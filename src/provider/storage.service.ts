import {Song} from 'src/app/home/Song';
import {Injectable} from '@angular/core';
import { Filesystem } from '@capacitor/filesystem';

@Injectable({providedIn: 'root'})
export class StorageService {

    public constructor() {
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
