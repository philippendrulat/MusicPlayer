package plugins.SongFinder;

import android.Manifest;
import android.database.Cursor;
import android.os.Build;
import android.provider.MediaStore;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;

public class SongFinder {

  private AppCompatActivity activity;

  public SongFinder(AppCompatActivity activity) {
    this.activity = activity;
  }

  @RequiresApi(api = Build.VERSION_CODES.N)
  public void list(Consumer<List<String>> consumer) {
//    if (Build.VERSION.SDK_INT > Build.VERSION_CODES.TIRAMISU) {
//      this.listNew(consumer);
//    } else {
//      this.listOld(consumer);
//    }
    this.listWithPermission(consumer);
  }

  @RequiresApi(api = Build.VERSION_CODES.N)
  private void listWithPermission(Consumer<List<String>> consumer) {
    String selection = MediaStore.Audio.Media.IS_MUSIC + " != 0";

    String[] projection = {
      MediaStore.Audio.Media._ID,
      MediaStore.Audio.Media.ARTIST,
      MediaStore.Audio.Media.TITLE,
      MediaStore.Audio.Media.DATA,
      MediaStore.Audio.Media.DISPLAY_NAME,
      MediaStore.Audio.Media.DURATION
    };

    Cursor cursor = this.activity.getContentResolver().query(
      MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
      projection,
      selection,
      null,
      null);

    List<String> songs = new ArrayList<String>();
    while(cursor.moveToNext()){
      songs.add(cursor.getString(0) + "||" + cursor.getString(1) + "||" +   cursor.getString(2) + "||" +   cursor.getString(3) + "||" +  cursor.getString(4) + "||" +  cursor.getString(5));
    }

    consumer.accept(songs);
  }

  @RequiresApi(api = Build.VERSION_CODES.TIRAMISU)
  private void listNew(Consumer<List<String>> consumer) {

    this.activity.registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
      if (isGranted) {
        listWithPermission(consumer);
      }
    }).launch(Manifest.permission.READ_MEDIA_AUDIO);
  }

  @RequiresApi(api = Build.VERSION_CODES.N)
  private void listOld(Consumer<List<String>> consumer) {

    this.activity.registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
      if (isGranted) {
        listWithPermission(consumer);
      }
    }).launch(Manifest.permission.READ_EXTERNAL_STORAGE);
  }
}
