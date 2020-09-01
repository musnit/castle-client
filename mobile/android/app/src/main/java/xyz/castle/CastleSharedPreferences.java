package xyz.castle;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;

import org.greenrobot.eventbus.EventBus;

public class CastleSharedPreferences {

    public static class AuthTokenEvent {
        public final String token;

        public AuthTokenEvent(String token) {
            this.token = token;
        }
    }

    private static final String AUTH_TOKEN_KEY = "AUTH_TOKEN";

    private static SharedPreferences sharedPreferences;

    public static void initialize(Activity activity) {
        sharedPreferences = activity.getPreferences(Context.MODE_PRIVATE);
    }

    public static String get(String key) {
        return sharedPreferences.getString(key, null);
    }

    public static void set(String key, String value) {
        sharedPreferences.edit().putString(key, value).commit();

        if (AUTH_TOKEN_KEY.equals(key)) {
            EventBus.getDefault().post(new AuthTokenEvent(value));
        }
    }

    public static void remove(String key) {
        sharedPreferences.edit().remove(key).commit();

        if (AUTH_TOKEN_KEY.equals(key)) {
            EventBus.getDefault().post(new AuthTokenEvent(null));
        }
    }

    public static String getAuthToken() {
        return get(AUTH_TOKEN_KEY);
    }
}
