package ghost;

import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import java.util.Map;
import java.util.HashMap;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import xyz.castle.CastleSharedPreferences;
import xyz.castle.MainActivity;

public class CastleNativeSettingsModule extends ReactContextBaseJavaModule {
    CastleNativeSettingsModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "CastleNativeUtils";
    }

    public static final String REACT_NATIVE_CHANNEL_KEY = "REACT_NATIVE_CHANNEL";

    private static long getLongVersionCode(PackageInfo info) {
        if (Build.VERSION.SDK_INT >= 28) {
            return info.getLongVersionCode();
        }
        return info.versionCode;
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("sceneCreatorApiVersion", MainActivity.SCENE_CREATOR_API_VERSION);

        PackageManager packageManager = getReactApplicationContext().getPackageManager();
        try {
          PackageInfo pInfo = packageManager.getPackageInfo(getReactApplicationContext().getPackageName(), 0);
          constants.put("nativeAppVersion", pInfo.versionName);

          int versionCode = (int)getLongVersionCode(pInfo);
          constants.put("nativeBuildVersion", Integer.toString(versionCode));
        } catch (PackageManager.NameNotFoundException e) {
          Log.e("CastleNativeUtils", "Exception: ", e);
        }

        return constants;
    }

    public static String reactNativeChannel() {
        String channel = CastleSharedPreferences.get(CastleNativeSettingsModule.REACT_NATIVE_CHANNEL_KEY, "default");
        if ("default".equals(channel)) {
            return null;
        }

        return channel;
    }

    @ReactMethod
    void setReactNativeChannel(String channelName, Promise promise) {
        CastleSharedPreferences.set(REACT_NATIVE_CHANNEL_KEY, channelName);
        promise.resolve(null);
    }


    @ReactMethod
    void getReactNativeChannel(Promise promise) {
        promise.resolve(CastleSharedPreferences.get(REACT_NATIVE_CHANNEL_KEY, "default"));
    }
}
