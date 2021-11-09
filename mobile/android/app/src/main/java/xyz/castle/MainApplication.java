package xyz.castle;

import androidx.annotation.Nullable;
import ghost.CastleNativeSettingsModule;
import xyz.castle.api.ReactNativeDownloader;

import android.content.Context;
import android.app.Application;

import org.love2d.android.GameActivity;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;
import com.reactnativenavigation.react.ReactGateway;

import java.lang.reflect.InvocationTargetException;
import java.util.Arrays;
import java.util.List;

import ghost.GhostPackage;
import com.brentvatne.react.ReactVideoPackage;

public class MainApplication extends Application implements ReactApplication {

  private ReactNativeHost mReactNativeHost;
  private ReactGateway reactGateway;

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();

      CastleSharedPreferences.initialize(this);
      String channel = CastleNativeSettingsModule.reactNativeChannel();
      if (channel == null) {
          channel = "default";
      }
      GameActivity.castleReactNativeChannel = channel;

      mReactNativeHost =
              new ReactNativeHost(this) {
                  @Override
                  public boolean getUseDeveloperSupport() {
                      if (CastleNativeSettingsModule.reactNativeChannel() != null) {
                          return false;
                      }

                      return BuildConfig.DEBUG;
                  }

                  @Override
                  protected List<ReactPackage> getPackages() {
                      @SuppressWarnings("UnnecessaryLocalVariable")
                      List<ReactPackage> packages = new PackageList(this).getPackages();
                      // Packages that cannot be autolinked yet can be added manually here, for example:
                      // packages.add(new MyReactNativePackage());
                      packages.add(new GhostPackage());
                      packages.add(new ReactVideoPackage());

                      return packages;
                  }

                  @Override
                  protected String getJSMainModuleName() {
                      return "index";
                  }

                  @Override
                  protected @Nullable
                  String getJSBundleFile() {
                      return ReactNativeDownloader.download(MainApplication.this);
                  }
              };

    SoLoader.init(this, /* native exopackage */ false);
    initializeFlipper(this); // Remove this line if you don't want Flipper enabled
    reactGateway = createReactGateway();
  }

    protected ReactGateway createReactGateway() {
        return new ReactGateway(getReactNativeHost());
    }

    public ReactGateway getReactGateway() {
        return reactGateway;
    }

  /**
   * Loads Flipper in React Native templates.
   *
   * @param context
   */
  private static void initializeFlipper(Context context) {
    if (BuildConfig.DEBUG) {
      try {
        /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
        Class<?> aClass = Class.forName("com.facebook.flipper.ReactNativeFlipper");
        aClass.getMethod("initializeFlipper", Context.class).invoke(null, context);
      } catch (ClassNotFoundException e) {
        e.printStackTrace();
      } catch (NoSuchMethodException e) {
        e.printStackTrace();
      } catch (IllegalAccessException e) {
        e.printStackTrace();
      } catch (InvocationTargetException e) {
        e.printStackTrace();
      }
    }
  }
}
