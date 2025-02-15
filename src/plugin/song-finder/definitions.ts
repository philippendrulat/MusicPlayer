export interface SongFinderPlugin {
    list(): Promise<ISong[]>;
}

export interface ISong {
    nativeURL: string;
    metadata: Metadata;
}

export interface Metadata extends Record<string, any> {
  modificationTime: Date;
}
