package ghost;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class CastleCoreBridgeModule extends ReactContextBaseJavaModule {
  CastleCoreBridgeModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "CastleCoreBridge";
  }

  @ReactMethod
  public void sendEventAsync(String eventJson) {
    nativeSendEvent(eventJson);
  }

  private static native void nativeSendEvent(String eventJson);
}
