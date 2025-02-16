import {StorageService} from './storage.service';
import {Injectable} from '@angular/core';
import {Song} from 'src/app/home/Song';
import {BehaviorSubject} from 'rxjs';
import {BackgroundMode} from '@awesome-cordova-plugins/background-mode/ngx';
import {ISong, SongFinder} from "../plugin/song-finder";
import {Filesystem} from "@capacitor/filesystem";
import * as realtimeBpm from 'realtime-bpm-analyzer';
import {Platform} from "@ionic/angular";

@Injectable({providedIn: 'root'})
export class SongService {
    private songsSubject = new BehaviorSubject<Song[]>([]);
    private refreshingSubject = new BehaviorSubject<boolean>(false);
    private refreshProgressSubject = new BehaviorSubject<number>(0);
    private _processedSongs = 0;
    private _totalSongs = 0;

    public constructor(private storage: StorageService, private platform: Platform, backgroundmode: BackgroundMode) {
        this.refreshAll();
        // this.worker = new Worker('../app/parse-metadata.worker', {type: 'module'});
        // this.worker.postMessage('foo');
        this.refreshingSubject.subscribe(value => {
            // let app running in background while running
            backgroundmode.setEnabled(value);
        });
    }


    get processedSongs(): number {
        return this._processedSongs;
    }

    get totalSongs(): number {
        return this._totalSongs;
    }

    public async refreshAll() {
        this.refreshingSubject.next(true);
        const songs = await this.storage.getSongs();
        this.songsSubject.next(songs);

        const files = await SongFinder.list();
        await this.processFiles(files.files).catch(error => console.error(error));
        this.refreshingSubject.next(false);
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
        if (!currentSongs.find(s => s.nativeURL === song.nativeURL)) {
            currentSongs.push(song);
            this.songsSubject.next(currentSongs);
        }
    }

    private async processFiles(files: ISong[]) {
        this._totalSongs = files.length;
        this._processedSongs = 0;
        for (const file of files) {
            this._processedSongs++;
            if (this._processedSongs++ % 100 === 0) {
                await this.storage.setSongs(this.songsSubject.value);
            }
            try {
                const currentSongs = this.songsSubject.value;
                const existingSongIndex = currentSongs.findIndex(song => song.nativeURL === file!.nativeURL);
                const existingSong = currentSongs[existingSongIndex];
                if (existingSong) {
                    if (file.modificationTime > existingSong.modificationTime) {
                        const songMetadata = await this.parseFile(file);
                        currentSongs.splice(existingSongIndex, 1, new Song(file, songMetadata));
                        this.songsSubject.next(currentSongs);
                    }
                } else {
                    const metadata = await this.parseFile(file);
                    this.addSong(new Song(file, metadata));
                }
                this.refreshProgressSubject.next(this._processedSongs / this._totalSongs);
            } catch (e) {
                console.error(e);
            }
        }
        this._totalSongs = 0;
        this._processedSongs = 0;
        await this.storage.setSongs(this.songsSubject.value);
        this.refreshingSubject.next(false);
    }

    private async parseFile(file: ISong): Promise<number> {
        if (!file.nativeURL) {
            console.error(file);
            throw "No native URL";
        }
        const buffer = await this.readFileAsArrayBuffer(file.nativeURL, file.mimetype);
        return new Promise(resolve => {
            const audioContext = new AudioContext();
            audioContext.decodeAudioData(buffer, audioBuffer => {
                realtimeBpm.analyzeFullBuffer(audioBuffer).then(topCandidates => {
                    resolve(topCandidates[0]?.tempo);
                });
            });
        })
    }

    private async readFileAsArrayBuffer(path: string, mimetype: string): Promise<ArrayBuffer> {
        if (this.platform.is("android")) {
            const readFile = await Filesystem.readFile({
                path: path
            });
            let buffer: ArrayBuffer;
            let data = readFile.data;
            if (typeof data === 'string') {
                const url = "data:" + mimetype + ";base64," + data;
                buffer = await fetch(url).then(res => res.arrayBuffer())
            } else {
                buffer = await new Response(data).arrayBuffer();
            }

            return buffer;
        } else {
            return fetch(path).then(res => res.arrayBuffer());
        }

    }

    public async reset() {
        await this.storage.setSongs([]);
    }

}
