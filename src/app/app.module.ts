import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';

import {SplashScreen} from '@awesome-cordova-plugins/splash-screen/ngx';
import {StatusBar} from '@awesome-cordova-plugins/status-bar/ngx';

import {AppRoutingModule} from './app-routing.module';
import {HttpClientModule} from '@angular/common/http';
import {File} from '@awesome-cordova-plugins/file/ngx';
import {AndroidPermissions} from '@awesome-cordova-plugins/android-permissions/ngx';
import {FileChooser} from '@awesome-cordova-plugins/file-chooser/ngx';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatTableModule} from '@angular/material/table';
import {Media} from '@awesome-cordova-plugins/media/ngx';
import {MusicControls} from '@awesome-cordova-plugins/music-controls/ngx';
import {IonicStorageModule} from '@ionic/storage-angular';
import {MatRippleModule} from '@angular/material/core';
import {BackgroundMode} from '@awesome-cordova-plugins/background-mode/ngx';
import {Keyboard} from '@awesome-cordova-plugins/keyboard/ngx';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {ReactiveFormsModule} from '@angular/forms';
import { provideIonicAngular, IonButton } from '@ionic/angular/standalone';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        IonicModule.forRoot(),
        IonicStorageModule.forRoot(),
        AppRoutingModule,
        BrowserAnimationsModule,
        MatTableModule,
        MatRippleModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatAutocompleteModule,
        ReactiveFormsModule
    ],
    providers: [
        StatusBar,
        SplashScreen,
        {provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
        File,
        AndroidPermissions,
        FileChooser,
        Media,
        MusicControls,
        BackgroundMode,
        Keyboard
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
