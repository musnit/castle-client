package ghost;

import android.content.Context;
import android.content.SharedPreferences;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;

import org.love2d.android.Channels;

import xyz.castle.CastleSharedPreferences;
import xyz.castle.MainActivity;
import xyz.castle.navigation.CastleNavigator;

public class GhostChannelsModule extends ReactContextBaseJavaModule {

  GhostChannelsModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "GhostChannels";
  }

  @ReactMethod
  void freezeScreenAsync(Promise promise) {
    promise.resolve(null);
  }

  @ReactMethod
  void clearAsync(String name, Promise promise) {
    Channels.nativeClear(name);
    promise.resolve(null);
  }

  @ReactMethod
  void demandAsync(String name, ReadableMap options, Promise promise) {
    if (options.hasKey("timeout")) {
      promise.resolve(Channels.nativeDemand(name, options.getDouble("timeout")));
    } else {
      promise.resolve(Channels.nativeDemand(name, -1));
    }
  }

  @ReactMethod
  void getCountAsync(String name, Promise promise) {
    promise.resolve(Channels.nativeGetCount(name));
  }

  @ReactMethod
  void hasReadAsync(String name, Integer id, Promise promise) {
    promise.resolve(Channels.nativeHasRead(name, id));
  }

  @ReactMethod
  void peekAsync(String name, Promise promise) {
    promise.resolve(Channels.nativePeek(name));
  }

  @ReactMethod
  void popAsync(String name, Promise promise) {
    promise.resolve(Channels.nativePop(name));
  }

  @ReactMethod
  void popAllAsync(String name, Promise promise) {
    WritableArray array = Arguments.createArray();
    while (true) {
      String val = Channels.nativePop(name);
      if (val == null) {
        break;
      }
      array.pushString(val);
    }
    promise.resolve(array);
  }

  @ReactMethod
  void pushAsync(String name, String value, Promise promise) {
    promise.resolve(Channels.nativePush(name, value));
  }

  @ReactMethod
  void supplyAsync(String name, String value, ReadableMap options, Promise promise) {
    if (options.hasKey("timeout")) {
      promise.resolve(Channels.nativeSupply(name, value, options.getDouble("timeout")));
    } else {
      promise.resolve(Channels.nativeSupply(name, value, -1));
    }
  }

  @ReactMethod
  void globalPause() {
    if (MainActivity.gameActivity != null) {
      MainActivity.gameActivity.setPaused(true);
    }
  }

  @ReactMethod
  void navigate(String navigatorId, String screenType, String navigationScreenOptions, ReadableMap androidOptions) {
    getCurrentActivity().runOnUiThread(() -> {
      if (androidOptions.hasKey("isFullscreen") && androidOptions.getBoolean("isFullscreen")) {
        CastleNavigator.castleNavigatorForId("LoggedInRootStack").navigate(screenType, navigationScreenOptions);
      } else {
        CastleNavigator.castleNavigatorForId(navigatorId).navigate(screenType, navigationScreenOptions);
      }
    });
  }

  @ReactMethod
  void navigatePush(String navigatorId, String screenType, String navigationScreenOptions, ReadableMap androidOptions) {
    getCurrentActivity().runOnUiThread(() -> {
      if (androidOptions.hasKey("isFullscreen") && androidOptions.getBoolean("isFullscreen")) {
        CastleNavigator.castleNavigatorForId("LoggedInRootStack").navigatePush(screenType, navigationScreenOptions);
      } else {
        CastleNavigator.castleNavigatorForId(navigatorId).navigatePush(screenType, navigationScreenOptions);
      }
    });
  }

  @ReactMethod
  void navigateBack() {
    getCurrentActivity().runOnUiThread(() -> {
      CastleNavigator.castleNavigatorForId("Root").handleBack();
    });
  }

  @ReactMethod
  void navigatePopToTop() {
    getCurrentActivity().runOnUiThread(() -> {
      CastleNavigator.castleNavigatorForId("Root").popToTop();
    });
  }

  @ReactMethod
  void getCastleAsyncStorage(String key, Promise promise) {
    promise.resolve(CastleSharedPreferences.get(key));
  }

  @ReactMethod
  void setCastleAsyncStorage(String key, String value, Promise promise) {
    CastleSharedPreferences.set(key, value);
    promise.resolve(null);
  }

  @ReactMethod
  void removeCastleAsyncStorage(String key, Promise promise) {
    CastleSharedPreferences.remove(key);
    promise.resolve(null);
  }

  static {
    System.loadLibrary("love");
  }
}
