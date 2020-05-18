package ghost;

import android.util.Log;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import org.love2d.android.GameActivity;

import javax.annotation.Nullable;

import games.castle.MainActivity;

public class GhostViewManager extends SimpleViewManager<ViewGroup> implements LifecycleEventListener {

  GhostViewManager(ReactApplicationContext reactContext) {
    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return "GhostView";
  }

  @Override
  protected ViewGroup createViewInstance(ThemedReactContext reactContext) {
    return MainActivity.recreateGameLayout(reactContext);
  }

  @ReactProp(name = "uri")
  public void setUri(ViewGroup view, @Nullable String uri) {
  }

  @ReactProp(name = "screenScaling")
  public void setScreenScaling(ViewGroup view, double screenScaling) {
    GameActivity.ghostScreenScaling = screenScaling;
  }

  @ReactProp(name = "applyScreenScaling")
  public void setScreenScaling(ViewGroup view, boolean applyScreenScaling) {
    GameActivity.ghostApplyScreenScaling = applyScreenScaling;
  }

  @ReactProp(name = "paused")
  public void setPaused(ViewGroup view, boolean paused) {
    MainActivity.gameActivity.setPaused(paused);
  }

  @Override
  public void onHostPause() {
    Log.v("GHOST", "onHostPause()");
//    if (gameActivity != null && gameActivity.isRunning()) {
//      // NOTE: On testing, found that only `gameActivity.pause()` is required
////      gameActivity.onWindowFocusChanged(false);
//      gameActivity.pause();
//    }
  }

  @Override
  public void onHostResume() {
    Log.v("GHOST", "onHostResume()");
//    if (gameActivity != null && gameActivity.isRunning()) {
//      // NOTE: On testing, found that only `gameActivity.resume()` is required
//      gameActivity.resume();
////      gameActivity.onWindowFocusChanged(true);
//    }
  }

  @Override
  public void onHostDestroy() {
    Log.v("GHOST", "onHostDestroy()");
  }
}
