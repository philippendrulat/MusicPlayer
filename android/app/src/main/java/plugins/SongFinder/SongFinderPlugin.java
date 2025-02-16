package plugins.SongFinder;

import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Logger;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "SongFinder")
public class SongFinderPlugin extends Plugin {
  private SongFinder implementation;


  @Override
  public void load() {
    implementation = new SongFinder(getActivity());
  }

  @PluginMethod()
  public void list(PluginCall call) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      implementation.list(songs -> {
          JSONArray array = new JSONArray();
          for (int i = 0; i < 5; i++) {
              Song song = songs.get(i);
              JSONObject jSong = new JSONObject();
              try {
                  jSong.put("nativeURL", song.getNativeURL());
                  jSong.put("modificationTime", song.getModificationTime());
                  jSong.put("mimetype", song.getMimetype());
                  jSong.put("artist", song.getArtist());
                  jSong.put("album", song.getAlbum());
                  jSong.put("title", song.getTitle());
                  jSong.put("length", song.getLength());
              } catch (JSONException e) {
                  Logger.error(e.getMessage(), e);
              }
              array.put(jSong);
          }
          /*
          songs.forEach(song -> {
              JSONObject jSong = new JSONObject();
              try {
                  jSong.put("nativeURL", song.getNativeURL());
                  jSong.put("modificationTime", song.getModificationTime());
                  jSong.put("mimetype", song.getMimetype());
              } catch (JSONException e) {
                  Logger.error(e.getMessage(), e);
              }
              array.put(jSong);
          });
           */
        JSObject ret = new JSObject();
        ret.put("files", array);
        call.resolve(ret);
      });
    }
  }
}
