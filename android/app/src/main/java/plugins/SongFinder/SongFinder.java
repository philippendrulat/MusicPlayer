package plugins.SongFinder;

import android.Manifest;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.health.connect.datatypes.MealType;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;

import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class SongFinder {

  private AppCompatActivity activity;
    private ActivityResultLauncher<String> requestPermissionLauncher;
    private Consumer<List<Song>> consumer;

  public SongFinder(AppCompatActivity activity) {
        this.activity = activity;
        this.requestPermissionLauncher = this.activity.registerForActivityResult(
                new ActivityResultContracts.RequestPermission(), isGranted -> {
                    if (isGranted && this.consumer != null) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                            listWithPermission(consumer);
                        }
                    }
                });
  }

  @RequiresApi(api = Build.VERSION_CODES.N)
  public void list(Consumer<List<Song>> consumer) {
      this.consumer = consumer;
      this.requestPermissionLauncher.launch(Manifest.permission.READ_EXTERNAL_STORAGE);
  }

  @RequiresApi(api = Build.VERSION_CODES.N)
  private void listWithPermission(Consumer<List<Song>> consumer) {
    String selection = MediaStore.Audio.Media.IS_MUSIC + " != 0";

    String[] projection = {
            MediaStore.Audio.Media.DATA,
            MediaStore.Audio.Media.DATE_MODIFIED,
            MediaStore.Audio.Media.MIME_TYPE,
            MediaStore.Audio.Media.ARTIST,
            MediaStore.Audio.Media.ALBUM,
            MediaStore.Audio.Media.TITLE,
    };

    try (Cursor cursor = this.activity.getContentResolver().query(
            MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
            projection,
            selection,
            null,
            null)) {
        try (MediaMetadataRetriever retriever = new MediaMetadataRetriever()) {
            List<Song> songs = new ArrayList<Song>();
            while(cursor != null && cursor.moveToNext()){
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    String path = cursor.getString(0);
                    Uri uri = Uri.fromFile(new File(path));
                    retriever.setDataSource(this.activity.getApplicationContext(), uri);
                    String time = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION);
                    long timeInMillisec = time == null ? 0 : Long.parseLong(time );
                    songs.add(new Song(
                            uri.toString(),
                            cursor.getInt(1),
                            cursor.getString(2),
                            cursor.getString(3),
                            cursor.getString(4),
                            cursor.getString(5),
                            timeInMillisec));
                }
            }
            consumer.accept(songs);
            retriever.release();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

  }

  @RequiresApi(api = Build.VERSION_CODES.TIRAMISU)
  private void listNew(Consumer<List<Song>> consumer) {

    this.activity.registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
      if (isGranted) {
        listWithPermission(consumer);
      }
    }).launch(Manifest.permission.READ_MEDIA_AUDIO);
  }
}
