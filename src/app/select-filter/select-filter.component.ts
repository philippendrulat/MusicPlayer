import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NavParams, PopoverController} from '@ionic/angular';
import {IonItem, IonLabel, IonList, IonRippleEffect} from '@ionic/angular/standalone'

@Component({
    selector: 'app-select-filter',
    templateUrl: 'select-filter.component.html',
    imports: [IonList, IonItem, IonLabel, IonRippleEffect]
})
export class SelectFilterComponent {

    public items: string[];

    public constructor(private popover: PopoverController, params: NavParams) {
        this.items = params.get('items');
    }
    public click(item: string) {
        this.popover.dismiss(item);
    }
}