import * as mm from 'music-metadata-browser';

export class Song {

    public constructor(public metadata: mm.IAudioMetadata, public readonly location: string, public readonly modificationTime: Date) {
    }

    public get artist() {
        return this.metadata.common.artist
    }

    public get album() {
        return this.metadata.common.album;
    }

    public get name() {
        return this.metadata.common.title;
    }

    public get genre() {
        return this.metadata.common.genre;
    }

    public get bpm() {
        return this.metadata.common.bpm ? Math.round(this.metadata.common.bpm) : undefined;
    }

    public get length() {
        return this.metadata.format.duration;
    }
}
