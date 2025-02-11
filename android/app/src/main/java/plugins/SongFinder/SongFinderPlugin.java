package plugins.SongFinder;

import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

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

        JSObject ret = new JSObject();
        ret.put("files", songs);
        call.resolve(ret);
      });
    }
  }
}
