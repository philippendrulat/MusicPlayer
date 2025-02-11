import {Song} from 'src/app/home/Song';
import {Injectable} from '@angular/core';
import {Storage} from '@ionic/storage';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

@Injectable({providedIn: 'root'})
export class StorageService {
    private locationsFileName = 'locations.js';
    private songsFileName = 'songs.js';
    private readonly initiated: Promise<void>;

    public constructor(private storage: Storage) {
        this.initiated = this.init().then(async () => {
            await storage.create();
        });
    }

    private async init() {
        return new Promise<void>(resolve => {
            document.addEventListener('deviceready', () => resolve());
        });
    }

    public async listDir(path: string, dirName: string){
        return Filesystem.readdir({
            path: path + '/' + dirName
        }).then(result => result.files);
    }

    public get rootDirectory() {
        return 'file:///storage/';
    }

    public getParent(path: string) {
        while (path.length > this.rootDirectory.length && path.endsWith('/')) {
            path = path.substring(0, path.lastIndexOf('/'));
        }
        if (path.length > this.rootDirectory.length) {
            path = path.substring(0, path.lastIndexOf('/'));
        }
        return path;
    }

    public getName(path: string) {
        while (path.length > this.rootDirectory.length && path.endsWith('/')) {
            path = path.substring(0, path.lastIndexOf('/'));
        }
        if (path.length > this.rootDirectory.length) {
            return path.substring(path.lastIndexOf('/') + 1);
        } else {
            return '';
        }
    }

    public withPermissions(exec: () => void | Promise<void>) {
        return new Promise((resolve, reject) => {
            const permissions = (window as any).cordova.plugins.permissions;
            permissions.requestPermission(
                permissions.MANAGE_EXTERNAL_STORAGE,
                async () => {
                    resolve(exec());
                },
                () => {
                    alert('Bitte Zustimmung erteilen!');
                    reject(' no access');
                }
            );
        });
    }

    public getFolder(): Promise<string | undefined> {
        return new Promise<string | undefined>(resolve => {
            this.withPermissions(() => {
                (window as any).OurCodeWorld.Filebrowser.folderPicker.single({
                    success: (data: string | any[]) => {
                        if (!data.length) {
                            // No folders selected
                            resolve(undefined);
                        }
                        resolve(data[0]);
                    },
                    error(err: any) {
                        console.error(err);
                        resolve(undefined);
                    }
                });
            });
        });
    }

    private async writeFile(name: string, dataObj: any[]): Promise<void> {
        await this.initiated;
        await Filesystem.writeFile({
            data: JSON.stringify(dataObj),
            path: name,
            directory: Directory.Data
        });
        /*
        return new Promise((resolve, reject) => {
            this.file.resolveDirectoryUrl(this.file.applicationStorageDirectory).then(dirEntry => {
                this.file.getFile(dirEntry as DirectoryEntry, name, {create: true}).then(fileEntry => {
                    fileEntry.createWriter((fileWriter) => {

                        fileWriter.onwriteend = () => {
                            resolve();
                        };

                        fileWriter.onerror = (e) => {
                            reject(e);
                        };

                        fileWriter.write(JSON.stringify(dataObj));
                    });
                });
            }, error => reject(error));
        });*/
    }

    private async readFile(name: string): Promise<any[]> {
        await this.initiated;
        return Filesystem.readFile({
            path: name,
            directory: Directory.Data
        }).then(file => {
            return JSON.parse(file.data as string);
        })
        /*
        return new Promise((resolve, reject) => {
            this.file.resolveDirectoryUrl(this.file.applicationStorageDirectory).then(dirEntry => {
                this.file.getFile(dirEntry as DirectoryEntry, name, {create: true}).then(fileEntry => {
                    fileEntry.file((file) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const result = reader.result as string || '[]';
                            resolve(JSON.parse(result));
                        };

                        reader.readAsText(file);

                    }, error => reject(error));
                });
            }, error => reject(error));
        });*/
    }

    public async getMusicLocations(): Promise<string[]> {
        return this.readFile(this.locationsFileName);
    }

    public async setMusicLocations(locations: string[]) {
        return this.writeFile(this.locationsFileName, locations);
    }

    public async setSongs(songs: Song[]) {
        return this.writeFile(this.songsFileName, songs);
    }

    public async getSongs(): Promise<Song[]> {
        return this.readFile(this.songsFileName).catch(async e => {
            await this.writeFile(this.songsFileName, []);
            return [];
        });
    }

    public async getRowCount(): Promise<number> {
        await this.initiated;
        return (await this.storage.get('shownElements')) || 50;
    }

    public async setRowCount(rowCount: number) {
        await this.initiated;
        await this.storage.set('shownElements', rowCount);
    }
}
