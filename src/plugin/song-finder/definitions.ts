export interface SongFinderPlugin {
    list(): Promise<{files: ISong[]}>;
}

export interface ISong {
    nativeURL: string;
    modificationTime: number;
    mimetype: string;
    album: string;
    artist: string;
    length: number;
    title: string;
    genre?: string[];
}
