export interface SongFinderPlugin {
    list(): Promise<any[]>;
}