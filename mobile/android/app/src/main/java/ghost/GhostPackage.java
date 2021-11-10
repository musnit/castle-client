package ghost;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import xyz.castle.navigation.CastleNavigationScreenReactViewManager;

public class GhostPackage implements ReactPackage {
  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    return Arrays.<NativeModule>asList(
        new CastleCoreBridgeModule(reactContext),
        new GhostChannelsModule(reactContext),
        new GhostPushNotificationsModule(reactContext),
        new CastleNativeSettingsModule(reactContext),
        new CastleAdjustModule(reactContext));
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Arrays.<ViewManager>asList(
        new GhostViewManager(reactContext),
        new CastleNavigationScreenReactViewManager(),
        new GhostInputZoneManager(),
        new CastleFeedView(),
        new CastleBottomSheetManager()
    );
  }
}
