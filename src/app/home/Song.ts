import {ISong} from "../../plugin/song-finder";

export class Song {
    public readonly album;
    public readonly artist;
    public readonly name;
    public readonly length;
    public readonly modificationTime;
    public readonly mimetype;
    public readonly nativeURL;
    public readonly genre;

    public constructor(song: ISong, public bpm: number) {
        this.album = song.album;
        this.artist = song.artist;
        this.name = song.title;
        this.length = song.length / 1000;
        this.modificationTime = song.modificationTime;
        this.mimetype = song.mimetype;
        this.nativeURL = song.nativeURL;
        this.genre = song.genre || [];
    }
}
