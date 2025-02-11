import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IonicModule} from '@ionic/angular';
import {ReactiveFormsModule} from '@angular/forms';
import {HomePage} from './home.page';

import {HomePageRoutingModule} from './home-routing.module';
import {MatTableModule} from '@angular/material/table';
import {LengthPipe} from './LengthPipe';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MenuComponent} from './components/menu/menu.component';
import {MatSortModule} from '@angular/material/sort';


@NgModule({
    imports: [
        MatTableModule,
        MatSortModule,
        CommonModule,
        IonicModule,
        HomePageRoutingModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatAutocompleteModule,
        ReactiveFormsModule
    ],
    declarations: []
})
export class HomePageModule {
}
