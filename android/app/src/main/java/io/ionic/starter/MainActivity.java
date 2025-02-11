package io.ionic.starter;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import plugins.SongFinder.SongFinderPlugin;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(SongFinderPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
