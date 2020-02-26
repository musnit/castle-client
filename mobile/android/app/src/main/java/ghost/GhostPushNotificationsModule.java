package ghost;

import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.tasks.Task;
import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.InstanceIdResult;

import org.greenrobot.eventbus.EventBus;
import org.greenrobot.eventbus.Subscribe;
import org.greenrobot.eventbus.ThreadMode;

import androidx.annotation.NonNull;
import games.castle.CastleFirebaseMessagingService;

public class GhostPushNotificationsModule extends ReactContextBaseJavaModule {
    GhostPushNotificationsModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "GhostPushNotifications";
    }

    @Override
    public void initialize() {
        EventBus.getDefault().register(this);
    }

    @Override
    public void onCatalystInstanceDestroy() {
        EventBus.getDefault().unregister(this);
    }

    @Subscribe(threadMode = ThreadMode.MAIN)
    public void onMessageEvent(CastleFirebaseMessagingService.NewFirebaseTokenEvent event) {
        WritableMap payload = Arguments.createMap();
        // Put data to map
        payload.putString("token", event.token);
        // Get EventEmitter from context and send event thanks to it
        getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onNewPushNotificationToken", payload);
    };

    @ReactMethod
    void getToken(Promise promise) {
        FirebaseInstanceId.getInstance().getInstanceId()
                .addOnCompleteListener((@NonNull Task<InstanceIdResult> task) -> {
                        if (!task.isSuccessful()) {
                            promise.reject(task.getException());
                            return;
                        }

                        // Get new Instance ID token
                        String token = task.getResult().getToken();


                        promise.resolve(token);
                    }
                );
    }
}
