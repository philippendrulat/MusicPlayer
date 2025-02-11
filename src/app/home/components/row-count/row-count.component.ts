import {Component} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import {NavParams, PopoverController} from '@ionic/angular';
import { IonContent, IonHeader, IonTitle, IonButton, IonButtons } from '@ionic/angular/standalone';


@Component({
    selector: 'app-row-count',
    templateUrl: './row-count.component.html',
    styleUrls: ['./row-count.component.scss'],
    imports: [IonContent, IonHeader, IonTitle, MatFormFieldModule, IonButton, IonButtons]
})
export class RowCountComponent {
    rowCount: any;

    constructor(params: NavParams, private popoverCtrl: PopoverController) {
        this.rowCount = params.get('rowCount');
    }

    public select() {
        this.popoverCtrl.dismiss(this.rowCount);
    }

    public cancel() {
        this.popoverCtrl.dismiss();
    }
}
