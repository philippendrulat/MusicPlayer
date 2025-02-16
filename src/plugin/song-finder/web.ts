import {WebPlugin} from "@capacitor/core";
import {ISong, SongFinderPlugin} from "./definitions";

export class SongFinderWeb extends WebPlugin implements SongFinderPlugin {
    async list(): Promise<{files: ISong[]}> {
        return {files: [{
                nativeURL: "http://localhost:4200/assets/file.mp3",
                modificationTime: new Date().getTime(),
                mimetype: "audio/mp3",
                album: "Das Album",
                artist: "Der Artist",
                length: 12345,
                title: "Der Titel"
            }]};
    }
}
