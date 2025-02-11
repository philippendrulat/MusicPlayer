import {Component, OnInit} from '@angular/core';
import {NavParams, PopoverController} from '@ionic/angular';
import { IonItem, IonList } from '@ionic/angular/standalone';

@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
    imports: [IonItem, IonList]
})
export class MenuComponent implements OnInit {
    public current: number;
    public total: number;

    constructor(private popoverCtrl: PopoverController, private params: NavParams) {
        this.current = params.get('current');
        this.total = params.get('total');
    }

    ngOnInit() {
    }

    select(event: string) {
        this.popoverCtrl.dismiss(event);
    }
}
