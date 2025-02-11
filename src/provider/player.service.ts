import {Injectable} from '@angular/core';
import {Song} from 'src/app/home/Song';
import {Media, MEDIA_STATUS, MediaObject} from '@awesome-cordova-plugins/media/ngx';
import {MusicEvent, MusicNotification} from 'src/app/home/MusicNotification';
import {BehaviorSubject, Subscription} from 'rxjs';

@Injectable({providedIn: 'root'})
export class PlayerService {
    private playlist: Song[] = [];
    private index = 0;
    private currentMedia?: MediaObject;
    private pausedSubject = new BehaviorSubject<boolean>(true);
    private playingSubject = new BehaviorSubject<Song | undefined>(undefined);
    private trackProgressSubject = new BehaviorSubject<number>(0);
    private currentMediaSubscription?: Subscription;

    constructor(private media: Media, private notification: MusicNotification) {
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
                this.trackProgressSubject.next(await this.currentMedia.getCurrentPosition());
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
            this.currentMedia.seekTo(seconds * 1000);
        }
    }

    private playTrack() {
        if (this.currentMediaSubscription) {
            this.currentMediaSubscription.unsubscribe();
        }
        if (!this.playlist[this.index]) {
            this.index = 0;
        }
        this.playingSubject.next(this.playlist[this.index]);
        const media = this.media.create(this.playlist[this.index].location);
        try {
            // stop previous track
            this.stopCurrentSong();
            this.currentMedia = media;
            if (!this.pausedSubject.value) {
                media.play();
            }
            this.currentMediaSubscription = media.onStatusUpdate.subscribe(update => {
                if (update === MEDIA_STATUS.STOPPED) {
                    this.index++;
                    this.playTrack();
                }
            });
        } catch (e) {
            console.error(e);
        }

        this.notification.play(this.playlist[this.index]);
    }

    private stop() {

        if (this.currentMediaSubscription) {
            this.currentMediaSubscription.unsubscribe();
        }
        this.playingSubject.next(undefined);
        this.stopCurrentSong();
    }

    private stopCurrentSong() {
        if (this.currentMedia) {
            this.currentMedia.stop();
            this.currentMedia.release();
            this.currentMedia = undefined;
            this.pausedSubject.next(false);
        }
    }

    public async pause() {
        if (this.currentMedia) {
            this.currentMedia.pause();
            this.pausedSubject.next(true);
            this.notification.setPaused();
        }
    }

    public async resume() {
        if (this.currentMedia) {
            this.pausedSubject.next(false);
            this.currentMedia.play();
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
