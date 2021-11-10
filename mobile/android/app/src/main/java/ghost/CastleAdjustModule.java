package ghost;

import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import java.util.Map;
import java.util.HashMap;

import com.adjust.sdk.Adjust;
import com.adjust.sdk.AdjustEvent;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import xyz.castle.CastleSharedPreferences;
import xyz.castle.MainActivity;

public class CastleAdjustModule extends ReactContextBaseJavaModule {
    CastleAdjustModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "CastleAdjust";
    }

    @ReactMethod
    void trackEvent(String token, Promise promise) {
        AdjustEvent event = new AdjustEvent(token);
        Adjust.trackEvent(event);
        promise.resolve(null);
    }

    @ReactMethod
    void addSessionCallbackParameter(String paramName, String value, Promise promise) {
        Adjust.addSessionCallbackParameter(paramName, value);
        promise.resolve(null);
    }

    @ReactMethod
    void removeSessionCallbackParameter(String paramName, Promise promise) {
        Adjust.removeSessionCallbackParameter(paramName);
        promise.resolve(null);
    }
}
