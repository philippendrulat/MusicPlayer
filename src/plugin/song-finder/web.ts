import {WebPlugin} from "@capacitor/core";
import {ISong, SongFinderPlugin} from "./definitions";

export class SongFinderWeb extends WebPlugin implements SongFinderPlugin {
    async list(): Promise<ISong[]> {
        return [{
            nativeURL: "/assets/file.mp3",
            metadata: {
                modificationTime: new Date(),
            }
        }];
    }
}
