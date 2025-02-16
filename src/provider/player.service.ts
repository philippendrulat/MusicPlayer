import {Injectable} from '@angular/core';
import {Song} from 'src/app/home/Song';
import {MusicEvent, MusicNotification} from 'src/app/home/MusicNotification';
import {BehaviorSubject} from 'rxjs';
import {NativeAudio} from '@capacitor-community/native-audio'
import {PluginListenerHandle} from "@capacitor/core";

@Injectable({providedIn: 'root'})
export class PlayerService {
    private playlist: Song[] = [];
    private index = 0;
    private currentMedia?: string;
    private pausedSubject = new BehaviorSubject<boolean>(true);
    private playingSubject = new BehaviorSubject<Song | undefined>(undefined);
    private trackProgressSubject = new BehaviorSubject<number>(0);
    private currentMediaSubscription?: PluginListenerHandle;

    constructor(private notification: MusicNotification) {
        this.notification.control$.subscribe(next => {
            switch (next) {
                case MusicEvent.PAUSE:
                    this.pause();
                    break;
                case MusicEvent.RESUME:
                    this.resume();
                    break;
                case MusicEvent.NEXT:
                    this.next();
                    break;
                case MusicEvent.PREVIOUS:
                    this.previous();
                    break;
                case MusicEvent.DESTROY:
                    this.stop();
                    break;
            }
        });
        window.setInterval(async () => {
            if (this.currentMedia) {
                const currentTime = await NativeAudio.getCurrentTime({assetId: this.currentMedia});
                this.trackProgressSubject.next(currentTime.currentTime)
            } else {
                this.trackProgressSubject.next(0);
            }
        }, 100);
    }

    public get playing$() {
        return this.playingSubject.asObservable();
    }

    public get trackProgre$$() {
        return this.trackProgressSubject.asObservable();
    }

    public get pau$ed() {
        return this.pausedSubject.asObservable();
    }

    public async play(list: Song[], index: number) {
        this.playlist = list;
        this.index = index;
        this.pausedSubject.next(false);
        await this.playTrack();
    }

    public setTrackProgressInSeconds(seconds: number) {
        if (this.currentMedia) {
            NativeAudio.play({
                assetId: this.currentMedia,
                time: seconds
            })
        }
    }

    private async playTrack() {
        if (this.currentMediaSubscription) {
            await this.currentMediaSubscription.remove();
        }
        if (!this.playlist[this.index]) {
            this.index = 0;
        }
        const song = this.playlist[this.index];
        this.playingSubject.next(song);
        await NativeAudio.preload({
            assetId: song.nativeURL,
            assetPath: song.nativeURL,
            isUrl: true
        });
        try {
            // stop previous track
            this.stopCurrentSong();
            this.currentMedia = song.nativeURL;
            if (!this.pausedSubject.value) {
                NativeAudio.play({
                    assetId: song.nativeURL
                })
            }
            this.currentMediaSubscription = await NativeAudio.addListener("complete", () => {
                this.index++;
                this.playTrack();
            })
        } catch (e) {
            console.error(e);
        }

        this.notification.play(this.playlist[this.index]);
    }

    private stop() {

        if (this.currentMediaSubscription) {
            this.currentMediaSubscription.remove();
        }
        this.playingSubject.next(undefined);
        this.stopCurrentSong();
    }

    private stopCurrentSong() {
        if (this.currentMedia) {
            NativeAudio.stop({assetId: this.currentMedia});
            NativeAudio.unload({assetId: this.currentMedia});
            this.currentMedia = undefined;
            this.pausedSubject.next(false);
        }
    }

    public async pause() {
        if (this.currentMedia) {
            NativeAudio.pause({assetId: this.currentMedia});
            this.pausedSubject.next(true);
            this.notification.setPaused();
        }
    }

    public async resume() {
        if (this.currentMedia) {
            this.pausedSubject.next(false);
            NativeAudio.resume({assetId: this.currentMedia});
            this.notification.setResumed();
        }
    }

    private async next() {
        this.index++;
        await this.playTrack();
    }

    private async previous() {
        this.index--;
        await this.playTrack();
    }


}
