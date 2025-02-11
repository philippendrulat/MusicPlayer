import {MusicControls} from '@awesome-cordova-plugins/music-controls/ngx';
import {Song} from './Song';
import {Subject, Subscription} from 'rxjs';
import {Injectable} from '@angular/core';

export enum MusicEvent {
    RESUME, PAUSE, NEXT, PREVIOUS, DESTROY, HEADSET_PLUGGED, HEADSET_UNPLUGGED, HEADSET_MEDIA_BUTTON
}

@Injectable({providedIn: 'root'})
export class MusicNotification {
    private playing = new Subject<MusicEvent>();
    private notificationVisible = false;
    private subscription?: Subscription;

    constructor(private musicControls: MusicControls) {

    }

    public get control$() {
        return this.playing.asObservable();
    }

    public async play(song: Song) {
        console.log(song)
        // await this.musicControls.destroy();
        await this.musicControls.create({
            track: song.name,
            artist: song.artist,
            // cover       : song.imageUrl,      // optional, default : nothing
            // cover can be a local path (use fullpath 'file:///storage/emulated/...', or only 'my_image.jpg' if my_image.jpg is in the www folder of your app)
            //           or a remote url ('http://...', 'https://...', 'ftp://...')
            isPlaying: true,                         // optional, default : true
            dismissable: false,                         // optional, default : false

            // hide previous/next/close buttons:
            hasPrev: true,      // show previous button, optional, default: true
            hasNext: true,      // show next button, optional, default: true
            hasClose: true,       // show close button, optional, default: false

            // Android only, optional
            // text displayed in the status bar when the notification (and the ticker) are updated, optional
            ticker: 'Now playing "Time is Running Out"',
            // All icons default to their built-in android equivalents
            playIcon: 'media_play',
            pauseIcon: 'media_pause',
            prevIcon: 'media_prev',
            nextIcon: 'media_next',
            closeIcon: 'media_close',
            notificationIcon: 'notification'
        });

        if (!this.subscription) {
            this.subscription = this.musicControls.subscribe().subscribe(action => {

                const actualAction = JSON.parse(action);
                console.log(actualAction);
                const message = actualAction.message;
                switch (message) {
                    case 'music-controls-next':
                        this.playing.next(MusicEvent.NEXT);
                        break;
                    case 'music-controls-previous':
                        this.playing.next(MusicEvent.PREVIOUS);
                        break;
                    case 'music-controls-pause':
                        this.playing.next(MusicEvent.PAUSE);
                        this.musicControls.updateIsPlaying(false);
                        break;
                    case 'music-controls-play':
                        this.playing.next(MusicEvent.RESUME);
                        this.musicControls.updateIsPlaying(true);
                        break;
                    case 'music-controls-destroy':
                        this.playing.next(MusicEvent.DESTROY);
                        break;



                    // Headset events (Android only)
                    // All media button events are listed below
                    case 'music-controls-media-button' :
                        this.playing.next(MusicEvent.HEADSET_MEDIA_BUTTON);
                        break;
                    case 'music-controls-headset-unplugged':
                        this.playing.next(MusicEvent.HEADSET_UNPLUGGED);
                        break;
                    case 'music-controls-headset-plugged':
                        this.playing.next(MusicEvent.HEADSET_PLUGGED);
                        break;
                    default:
                        break;
                }
            });

            this.musicControls.listen(); // activates the observable above
        }

        this.musicControls.updateIsPlaying(true);
    }

    public setPaused() {
        this.musicControls.updateIsPlaying(false);
    }

    public setResumed() {
        this.musicControls.updateIsPlaying(true);
    }

}