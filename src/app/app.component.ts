import {Component} from '@angular/core';

import {Platform} from '@ionic/angular';
import {SongFinder} from 'src/plugin/song-finder';
import {StatusBar, Style} from "@capacitor/status-bar";
import {SplashScreen} from "@capacitor/splash-screen";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent {
  constructor(
      private platform: Platform,
  ) {
      this.initializeApp();
  }

  initializeApp() {
      this.platform.ready().then(() => {
          if (this.platform.is("android")) {
              StatusBar.setStyle({style: Style.Default});
              StatusBar.setOverlaysWebView({overlay: false});
          }
          SplashScreen.hide()
          SongFinder.list().then(res => console.log(res));
      });
  }
}
