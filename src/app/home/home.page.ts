import {AfterViewInit, Component, HostListener, NgZone, ViewChild} from '@angular/core';
import {ActionSheetController, AlertController, ModalController, PopoverController} from '@ionic/angular';
import {MusicDatasource} from './MusicDatasource';
import {Song} from './Song';
import {PlayerService} from 'src/provider/player.service';
import {Media} from '@awesome-cordova-plugins/media/ngx';
import {SongService} from 'src/provider/song.service';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {Keyboard} from '@awesome-cordova-plugins/keyboard/ngx';
import {MenuComponent} from './components/menu/menu.component';
import {MatAutocompleteModule, MatAutocompleteTrigger} from '@angular/material/autocomplete';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {StorageService} from '../../provider/storage.service';
import {RowCountComponent} from './components/row-count/row-count.component';
import { IonContent, IonHeader, IonTitle, IonButton, IonButtons, IonToolbar, IonProgressBar, IonIcon, IonRange, IonSpinner } from '@ionic/angular/standalone';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { LengthPipe } from './LengthPipe';
import { MatInputModule } from '@angular/material/input';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
    imports: [IonContent, IonHeader, IonTitle, MatFormFieldModule, MatInputModule, IonButton, IonButtons, IonToolbar, IonIcon, IonRange, IonProgressBar, MatAutocompleteModule, MatTableModule, MatSortModule, ReactiveFormsModule, IonSpinner, MatTableModule, LengthPipe]
})
export class HomePage implements AfterViewInit {
    @ViewChild(MatSort)
    public sort?: MatSort;

    public datasource = new MusicDatasource();
    public currentSong?: Song;
    public refreshing = false;
    public refreshProgress = 0;
    public artistControl = new FormControl('');
    public genreControl = new FormControl('');
    public trackProgress = 0;
    public paused = true;
    private trackProgressOverride = false;
    public bpmRange?: { lower: number; upper: number };
    private bpmFilteringActive = false;

    constructor(
        private zone: NgZone,
        private modal: ModalController,
        private player: PlayerService,
        private media: Media,
        private songService: SongService,
        private keyboard: Keyboard,
        private popoverCtrl: PopoverController,
        private actionSheetController: ActionSheetController,
        private alertController: AlertController,
        private storageService: StorageService) {
        this.songService.song$.subscribe(songs => {
            this.datasource.setSongs(songs);
            if (!this.bpmRange) {
                this.bpmRange = {lower: this.datasource.bpmMin, upper: this.datasource.bpmMax};
            }
        });
        this.songService.refreshing$.subscribe(refreshing => this.refreshing = refreshing);
        this.songService.refreshProgre$$.subscribe(progress => {
            this.refreshProgress = progress;
        });
        this.player.trackProgre$$.subscribe(progress => {
            if (this.trackProgressOverride) {
                return;
            }
            if (this.currentSong) {
                this.trackProgress = progress;
            } else {
                this.trackProgress = 0;
            }
        });
        this.player.playing$.subscribe(song => {
            this.zone.run(() => {
                if (this.currentSong) {
                    this.datasource.setPlaying(this.currentSong, false);
                }
                this.currentSong = song;
                if (this.currentSong) {
                    this.datasource.setPlaying(this.currentSong, true);
                }
            });
        });
        this.player.pau$ed.subscribe(paused => this.paused = paused);
        this.artistControl.valueChanges.subscribe(artist => this.artistChanged(artist || undefined));
        this.genreControl.valueChanges.subscribe(genre => this.genreChanged(genre || undefined));
        this.storageService.getRowCount().then(elems => this.datasource.setRowSize(elems));
    }

    ngAfterViewInit(): void {
        if (!this.sort) {
            throw "Mat Sort not found!";
        }
        this.datasource.sort = this.sort;
    }

    public async selectFolder() {
        await this.songService.addMusicLocation();
    }

    public play(index: number) {
        setTimeout(() => {
            this.player.play(this.datasource.songs, index);
        }, 100);
    }

    public pause() {
        this.player.pause();
    }

    public artistChanged(e?: string) {
        this.datasource.setArtist(e);
    }

    public genreChanged(e?: string) {
        this.datasource.setGenre(e);
    }

    selectOption(field: HTMLInputElement) {
        field.blur();
        this.datasource.filterImmediately();
    }

    sliderChanged(value: number | { lower: number; upper: number }) {
        if (!(typeof value === 'number')) {
            return;
        }
        if (this.trackProgressOverride) {
            this.trackProgress = value;
        }
    }

    stopProgressChange() {
        this.trackProgressOverride = true;
    }

    @HostListener('touchend')
    startProgressChange() {
        if (this.trackProgressOverride) {
            this.player.setTrackProgressInSeconds(this.trackProgress);
        }
        this.trackProgressOverride = false;
    }

    setTrackProgress(value: number | { lower: number; upper: number }) {
        if (!(typeof value === 'number')) {
            return;
        }
        if (this.currentSong) {
            this.player.setTrackProgressInSeconds(value);
        }
    }

    public async openMenu(event: MouseEvent) {
        const popover = await this.popoverCtrl.create({
            component: MenuComponent,
            componentProps: {
                current: this.songService.workingFiles.processedSize,
                total: this.songService.workingFiles.totalSize
            },
            event
        });
        await popover.present();
        const result = await popover.onDidDismiss();
        switch (result.data) {
            case 'addFolder':
                return this.selectFolder();
            case 'removeFolder':
                return this.removeFolder();
            case 'refresh':
                return this.songService.refreshAll();
            case 'reset':
                const alert = await this.alertController.create({
                    header: 'Alles löschen',
                    message: 'Wirklich alles löschen?',
                    buttons: [
                        {
                            text: 'Abbrechen'
                        },
                        {
                            text: 'Alles löschen',
                            handler: () => this.songService.reset()
                        }]
                });
                await alert.present();
                return;
            case 'rowCountChange':
                const rowCountPopover = await this.popoverCtrl.create({
                    component: RowCountComponent,
                    componentProps: {
                        rowCount: this.datasource.getRowSize()
                    }
                });
                await rowCountPopover.present();
                const rowSize = await rowCountPopover.onDidDismiss();
                if (result) {
                    this.datasource.setRowSize(rowSize.data);
                }
                return;
            default:
                console.log(result.data);
        }
    }

    private async removeFolder() {
        const sheet = await this.actionSheetController.create({
            header: 'Ordner',
            buttons: (await this.songService.getMusicLocations()).map(location => ({
                text: location,
                handler: () => {
                    return this.songService.removeMusicLocation(location);
                }
            }))
        });
        await sheet.present();
    }

    public togglePlay() {
        if (this.paused) {
            if (this.currentSong) {
                this.player.resume();
            } else {
                this.play(0);
            }
        } else {
            this.player.pause();
        }
    }

    public clear(auto: MatAutocompleteTrigger, control: FormControl, event: MouseEvent) {
        auto.closePanel();
        control.setValue('');
        event.stopPropagation();
    }

    bpmChanged(bpmRange: number | { lower: number; upper: number }) {
        if (typeof bpmRange === 'number') {
            return;
        }
        this.datasource.setBpm(bpmRange);
    }

    startBpmFilter() {
        this.bpmFilteringActive = true;
        const listener = () => {
            this.datasource.filterImmediately();
            window.removeEventListener('touchend', listener);
        };
        window.addEventListener('touchend', listener.bind(this));
    }
}
