package ghost;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import xyz.castle.CastleSharedPreferences;

public class CastleNativeSettingsModule extends ReactContextBaseJavaModule {
    CastleNativeSettingsModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "CastleNativeUtils";
    }

    public static final String REACT_NATIVE_CHANNEL_KEY = "REACT_NATIVE_CHANNEL";

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
