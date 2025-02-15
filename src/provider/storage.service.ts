import {Song} from 'src/app/home/Song';
import {Injectable} from '@angular/core';
import {Storage} from '@ionic/storage';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import {SongFinder} from "../plugin/song-finder";

@Injectable({providedIn: 'root'})
export class StorageService {

    public constructor() {
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

    public async getMusicLocations(): Promise<string[]> {
        return ['root'];
    }

    public async setMusicLocations(locations: string[]) {
        localStorage.setItem('musicLocations', JSON.stringify(locations));
    }

    public async setSongs(songs: Song[]) {
        localStorage.setItem('songs', JSON.stringify(songs));
    }

    public async getSongs(): Promise<Song[]> {
      const songString = localStorage.getItem('songs');
      if (!songString) {
        return [];
      }
      return JSON.parse(songString);
    }

    public async getRowCount(): Promise<number> {
        const rowCount = localStorage.getItem('rowCount');
        if (!rowCount) {return 50};
        return parseInt(rowCount, 10);
    }

    public async setRowCount(rowCount: number) {
        localStorage.setItem('rowCount', '' + rowCount);
    }
}
