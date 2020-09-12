package ghost;

import android.content.IntentSender;
import android.net.Uri;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.google.android.gms.auth.api.credentials.Credential;
import com.google.android.gms.auth.api.credentials.CredentialRequest;
import com.google.android.gms.auth.api.credentials.CredentialRequestResponse;
import com.google.android.gms.auth.api.credentials.Credentials;
import com.google.android.gms.auth.api.credentials.CredentialsClient;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.CommonStatusCodes;
import com.google.android.gms.common.api.ResolvableApiException;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;

import org.love2d.android.Channels;

import androidx.annotation.NonNull;
import xyz.castle.CastleSharedPreferences;
import xyz.castle.MainActivity;
import xyz.castle.NavigationActivity;
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

  @ReactMethod
  void getSmartLockCredentials() {
    CredentialsClient client = Credentials.getClient(getCurrentActivity());

    CredentialRequest credentialRequest = new CredentialRequest.Builder()
            .setPasswordLoginSupported(true)
            .build();

    client.request(credentialRequest).addOnCompleteListener(task -> {
      if (task.isSuccessful()) {
        Credential credential = task.getResult().getCredential();
        ((NavigationActivity) getCurrentActivity()).sendSmartLockCredentials(credential);
        return;
      }

      Exception e = task.getException();
      if (e instanceof ResolvableApiException) {
        // This is most likely the case where the user has multiple saved
        // credentials and needs to pick one. This requires showing UI to
        // resolve the read request.
        ResolvableApiException rae = (ResolvableApiException) e;
        try {
          if (rae.getStatusCode() == CommonStatusCodes.RESOLUTION_REQUIRED) {
            rae.startResolutionForResult(getCurrentActivity(), NavigationActivity.RC_READ);
          }
        } catch (IntentSender.SendIntentException exception) {
        }
      } else if (e instanceof ApiException) {
      }
    });
  }

  @ReactMethod
  void saveSmartLockCredentials(String username, String password, String profilePictureUri) {
    CredentialsClient client = Credentials.getClient(getCurrentActivity());

    Credential.Builder credentialBuilder = new Credential.Builder(username).setPassword(password);

    if (profilePictureUri != null) {
      try {
        credentialBuilder.setProfilePictureUri(Uri.parse(profilePictureUri));
      } catch (Exception e) {}
    }
    Credential credential = credentialBuilder.build();

    client.save(credential).addOnCompleteListener(task -> {
      if (task.isSuccessful()) {
        return;
      }

      Exception e = task.getException();
      if (e instanceof ResolvableApiException) {
        // Try to resolve the save request. This will prompt the user if
        // the credential is new.
        ResolvableApiException rae = (ResolvableApiException) e;
        try {
          rae.startResolutionForResult(getCurrentActivity(), NavigationActivity.RC_SAVE);
        } catch (IntentSender.SendIntentException exception) {
          // Could not resolve the request
        }
      } else {
        // Request has no resolution
      }
    });
  }

  static {
    System.loadLibrary("love");
  }
}
