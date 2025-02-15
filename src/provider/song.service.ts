import {StorageService} from './storage.service';
import {Injectable} from '@angular/core';
import {Song} from 'src/app/home/Song';
import {BehaviorSubject} from 'rxjs';
import {Entry, File, FileEntry, Metadata} from '@awesome-cordova-plugins/file/ngx';
import {BackgroundMode} from '@awesome-cordova-plugins/background-mode/ngx';
import {ISong, SongFinder} from "../plugin/song-finder";
import {FileReader} from "@awesome-cordova-plugins/file";
import {SongFinderWeb} from "../plugin/song-finder/web";
import * as mm from 'music-metadata';

class WorkerFiles {
    private workingFilesTotal: { location: string, file: ISong }[] = [];
    private workingFilesCurrent: { location: string, file: ISong }[] = [];
    private pointer = 0;

    public addLocation(location: string, files: ISong[]) {
        files.forEach(file => this.workingFilesTotal.push({location, file}));
        files.forEach(file => this.workingFilesCurrent.push({location, file}));
    }

    public removeLocation(location: string) {
        this.workingFilesTotal
            .map((elem, index) => ({location, index}))
            .filter(elem => elem.location === location)
            .forEach(elem => this.workingFilesTotal.splice(elem.index, 1));
        this.workingFilesCurrent
            .map((elem, index) => ({location, index}))
            .filter(elem => elem.location === location)
            .forEach(elem => this.workingFilesTotal.splice(elem.index, 1));
    }

    public getFile() {
        return this.workingFilesCurrent.shift()?.file;
    }

    public reset() {
        this.workingFilesTotal = [];
        this.pointer = 0;
    }

    public get totalSize() {
        return this.workingFilesTotal.length;
    }

    public get processedSize() {
        return this.totalSize - this.workingFilesCurrent.length;
    }
}

@Injectable({providedIn: 'root'})
export class SongService {
    private songsSubject = new BehaviorSubject<Song[]>([]);
    private refreshingSubject = new BehaviorSubject<boolean>(false);
    private refreshProgressSubject = new BehaviorSubject<number>(0);
    public workingFiles = new WorkerFiles();
    private fileProcessRunning = false;

    public constructor(private storage: StorageService, private file: File, private backgroundmode: BackgroundMode) {
        this.refreshAll();
        // this.worker = new Worker('../app/parse-metadata.worker', {type: 'module'});
        // this.worker.postMessage('foo');
        this.refreshingSubject.subscribe(value => {
            // let app running in background while running
            backgroundmode.setEnabled(value);
        });
    }

    private static arrayRemoveIf<T>(array: T[], predicate: (elem: T) => boolean) {
        let length = array.length;
        for (let i = 0; i < length; i++) {
            if (predicate(array[i])) {
                array.splice(i, 1);
                i--;
                length--;
            }
        }
    }

    public async refreshAll() {
        this.refreshingSubject.next(true);
        const songs = await this.storage.getSongs();
        this.songsSubject.next(songs);
        const locations = await this.storage.getMusicLocations();
        if (locations.length === 0) {
            this.refreshingSubject.next(false);
        }
        for (const loc of locations) {
            await this.refreshLocation(loc);
        }
    }

    public get song$() {
        return this.songsSubject.asObservable();
    }

    public get refreshing$() {
        return this.refreshingSubject.asObservable();
    }

    public get refreshProgre$$() {
        return this.refreshProgressSubject.asObservable();
    }

    private addSong(song: Song) {
        const currentSongs = this.songsSubject.value;
        if (!currentSongs.find(s => s.location === song.location)) {
            currentSongs.push(song);
            this.songsSubject.next(currentSongs);
        }
    }

    public async addMusicLocation() {
        const location = await this.storage.getFolder();
        if (!location) {
            return;
        }
        const existingLocations = await this.storage.getMusicLocations();

        // determine if parent location already existing
        if (existingLocations.find(loc => location.includes(loc))) {
            return;
        }

        // remove deprecated locations
        const deprecatedLocations = existingLocations.filter(loc => loc.includes(location));
        deprecatedLocations.forEach(dep => this.workingFiles.removeLocation(dep));
        deprecatedLocations.forEach(dep => existingLocations.splice(existingLocations.findIndex(loc => loc === dep), 1));

        // add new location and update storage, if new
        if (!existingLocations.find(loc => loc === location)) {
            existingLocations.push(location);
            await this.storage.setMusicLocations(existingLocations);
        }

        await this.refreshLocation(location);
    }

    public async removeMusicLocation(location: string) {
        const locations = await this.storage.getMusicLocations();
        this.workingFiles.removeLocation(location);
        locations.splice(locations.findIndex(loc => loc === location), 1);
        await this.storage.setMusicLocations(locations);
        const files = await this.getAllSongFiles();;
        SongService.arrayRemoveIf(this.songsSubject.value, (song) => !!files.find(file => file.nativeURL === song.location));
        this.songsSubject.next(this.songsSubject.value);
        this.storage.setSongs(this.songsSubject.value);
    }

    public getMusicLocations(): Promise<string[]> {
        return this.storage.getMusicLocations();
    }

    private async processFiles() {
        this.fileProcessRunning = true;
        this.refreshingSubject.next(true);
        let file = this.workingFiles.getFile();
        let i = 0;
        while (file) {
            if (i++ % 100 === 0) {
                await this.storage.setSongs(this.songsSubject.value);
            }
            try {
                const currentSongs = this.songsSubject.value;
                const existingSongIndex = currentSongs.findIndex(song => song.location === file!.nativeURL);
                const existingSong = currentSongs[existingSongIndex];
                if (existingSong) {
                    const metadata = file.metadata
                    if (metadata.modificationTime.getTime() > existingSong.modificationTime.getTime()) {
                        const songMetadata = await this.parseFile(file);
                        currentSongs.splice(existingSongIndex, 1, new Song(songMetadata, file.nativeURL, metadata.modificationTime));
                        this.songsSubject.next(currentSongs);
                    }
                } else {
                    const metadata = await this.parseFile(file);
                    console.log('added', metadata.common.title, this.workingFiles.processedSize, this.workingFiles.totalSize)
                    const fileMetadata = file.metadata;
                    this.addSong(new Song(metadata, file.nativeURL, fileMetadata.modificationTime));
                }
                this.refreshProgressSubject.next(this.workingFiles.processedSize / this.workingFiles.totalSize);
            } catch (e) {
                console.error(e);
            }
            file = this.workingFiles.getFile();
        }
        this.fileProcessRunning = false;
        this.workingFiles.reset();
        await this.storage.setSongs(this.songsSubject.value);
        this.refreshingSubject.next(false);
    }

    private async refreshLocation(location: string) {
        try {
            const files = await SongFinder.list();
            this.workingFiles.addLocation(location, files);
            this.processFiles().catch(error => console.error(error));
        } catch (e) {
            console.error(e);
        }
    }

    private async parseFile(file: ISong): Promise<mm.IAudioMetadata> {
        const blob = await fetch(file.nativeURL).then(res => res.blob());
        return mm.parseBlob(blob);
    }

    private getAllSongFiles(): Promise<ISong[]> {
      return SongFinder.list();
    }

    // private getFilesWithPermission(dir: string): Promise<FileEntry[]> {
    //     return new Promise<FileEntry[]>((resolve, reject) => {
    //         const permissions = (window as any).cordova.plugins.permissions;
    //         permissions.requestPermission(
    //             permissions.MANAGE_EXTERNAL_STORAGE,
    //             () => resolve(this.getFiles(dir)),
    //             (error: any) => reject(error)
    //         );
    //     });
    // }

    private async getFiles(dir: string, foundFiles: FileEntry[] = []): Promise<FileEntry[]> {
        let entries: Entry[];
        try {
            entries = await this.file.listDir(this.storage.getParent(dir), this.storage.getName(dir));
        } catch (e) {
            console.error('no files found for', dir, '...skipping');
            entries = [];
        }

        for (const entry of entries) {
            if (entry.isFile && (entry.fullPath.endsWith('mp3') || entry.fullPath.endsWith('wav') || entry.fullPath.endsWith('ogg'))) {
                foundFiles = foundFiles.concat(entry as FileEntry);
            } else if (entry.isDirectory) {
                foundFiles = foundFiles.concat(await this.getFiles(decodeURIComponent(decodeURI(entry.nativeURL))));
            }
        }
        return foundFiles;
    }

    public async reset() {
        console.log('do reset')
        const locations = await this.getMusicLocations();
        console.log(locations)
        for (const location of locations) {
            await this.removeMusicLocation(location);
        }
    }

}
