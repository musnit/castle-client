package ghost;

import android.util.Log;
import android.view.ViewGroup;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import javax.annotation.Nullable;

import xyz.castle.MainActivity;

public class GhostViewManager extends SimpleViewManager<ViewGroup> implements LifecycleEventListener {

  GhostViewManager(ReactApplicationContext reactContext) {
    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return "CastleCoreView";
  }

  @Override
  protected ViewGroup createViewInstance(ThemedReactContext reactContext) {
    return MainActivity.recreateGameLayout(reactContext);
  }

  @ReactProp(name = "initialParams")
  public void setInitialParams(ViewGroup view, @Nullable String initialParams) {
    CoreGameActivity.castleCoreViewSetInitialParams(initialParams);
  }

  @ReactProp(name = "beltHeightFraction")
  public void setBeltHeightFraction(ViewGroup view, double beltHeightFraction) {
    CoreGameActivity.castleCoreViewSetBeltHeightFraction(beltHeightFraction);
  }

  @ReactProp(name = "screenScaling")
  public void setScreenScaling(ViewGroup view, double screenScaling) {
    CoreGameActivity.ghostScreenScaling = screenScaling;
  }

  @ReactProp(name = "applyScreenScaling")
  public void setScreenScaling(ViewGroup view, boolean applyScreenScaling) {
    CoreGameActivity.ghostApplyScreenScaling = applyScreenScaling;
  }

  @ReactProp(name = "paused")
  public void setPaused(ViewGroup view, boolean paused) {
    MainActivity.gameActivity.setPaused(paused);
  }

  @Override
  public void onHostPause() {
    Log.v("GHOST", "onHostPause()");
    if (MainActivity.gameActivity != null && MainActivity.gameActivity.isRunning()) {
      // NOTE: On testing, found that only `gameActivity.pause()` is required
//      gameActivity.onWindowFocusChanged(false);
      MainActivity.gameActivity.pause();
    }
  }

  @Override
  public void onHostResume() {
    Log.v("GHOST", "onHostResume()");
    if (MainActivity.gameActivity != null && MainActivity.gameActivity.isRunning()) {
      // NOTE: On testing, found that only `gameActivity.resume()` is required
      MainActivity.gameActivity.resume();
//      gameActivity.onWindowFocusChanged(true);
    }
  }

  @Override
  public void onHostDestroy() {
    Log.v("GHOST", "onHostDestroy()");
  }
}
