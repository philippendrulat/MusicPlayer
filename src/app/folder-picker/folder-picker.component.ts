import {Component} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {DirectoryEntry, Entry} from '@awesome-cordova-plugins/file/ngx';
import {AndroidPermissions} from '@awesome-cordova-plugins/android-permissions/ngx';
import {StorageService} from 'src/provider/storage.service';
import {IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonList, IonItem, IonLabel} from '@ionic/angular/standalone';
import { FileInfo } from '@capacitor/filesystem';
import { FileChooser } from '@awesome-cordova-plugins/file-chooser/ngx';

@Component({
    selector: 'app-folder-picker',
    templateUrl: './folder-picker.component.html',
    styleUrls: ['./folder-picker.component.scss'],
    imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonList, IonItem, IonLabel]
})
export class FolderPickerComponent {

    public items?: FileInfo[];
    private currentParentUrl?: string;

    constructor(private storage: StorageService, private androidPermissions: AndroidPermissions, private modalController: ModalController, private fileChooser: FileChooser) {
    }


    private listDir(path: string, dirName: string) {
        console.log('list: ', path, dirName);
        this.storage
            .listDir(path, dirName)
            .then(entries => {
                console.log('list: ', path + dirName, entries)
                this.items = entries;
            })
            .catch(e => console.error(e));
    }

    public goDown(item: FileInfo) {
        this.currentParentUrl = this.storage.rootDirectory + item.uri;

        this.listDir(this.storage.getParent(this.currentParentUrl), this.storage.getName(this.currentParentUrl));
    }

    public goUp() {
        if (!this.currentParentUrl) {
            // already at root level
            return;
        }
        const parentNativeURL = this.storage.getParent(this.currentParentUrl);

        this.listDir(this.storage.getParent(parentNativeURL), this.storage.getName(parentNativeURL));
    }

    public select() {
        console.log('dismiss: ', this.currentParentUrl);
        this.modalController.dismiss(this.currentParentUrl);
    }

    public cancel() {
        this.modalController.dismiss();
    }
}
