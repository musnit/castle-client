package ghost;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class CastleCoreBridgeModule extends ReactContextBaseJavaModule {
  private static CastleCoreBridgeModule instance = null;

  CastleCoreBridgeModule(ReactApplicationContext reactContext) {
    super(reactContext);
    instance = this;
  }

  @Override
  public void onCatalystInstanceDestroy() {
    instance = null;
    super.onCatalystInstanceDestroy();
  }

  @Override
  public String getName() {
    return "CastleCoreBridge";
  }


  // From JS

  @ReactMethod
  public void sendEventAsync(String eventJson) {
    nativeSendEvent(eventJson);
  }

  private static native void nativeSendEvent(String eventJson);


  // To JS

  void sendEventToJS(String eventJson) {
    getReactApplicationContext()
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("onReceiveEvent", eventJson);
  }

  static void staticSendEventToJS(String eventJson) {
    if (instance != null) {
      instance.sendEventToJS(eventJson);
    }
  }
}
