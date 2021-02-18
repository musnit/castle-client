package xyz.castle;

import android.content.Context;
import android.content.SharedPreferences;

import org.greenrobot.eventbus.EventBus;

import xyz.castle.NavigationActivity;

public class CastleSharedPreferences {

    public static class AuthTokenEvent {
        public final String token;

        public AuthTokenEvent(String token) {
            this.token = token;
        }
    }

    private static final String AUTH_TOKEN_KEY = "AUTH_TOKEN";
    private static final String USER_IS_ANONYMOUS_KEY = "USER_IS_ANONYMOUS";

    private static SharedPreferences sharedPreferences;

    public static void initialize(Context context) {
        sharedPreferences = context.getSharedPreferences("xyz.castle.MainActivity", Context.MODE_PRIVATE);
    }

    public static String get(String key) {
        return sharedPreferences.getString(key, null);
    }

    public static String get(String key, String def) {
        return sharedPreferences.getString(key, def);
    }

    public static void set(String key, String value) {
        sharedPreferences.edit().putString(key, value).commit();

        if (AUTH_TOKEN_KEY.equals(key)) {
            EventBus.getDefault().post(new AuthTokenEvent(value));
        }
        if (USER_IS_ANONYMOUS_KEY.equals(key)) {
            boolean isAnonymous = value.equals("true");
            EventBus.getDefault().post(new NavigationActivity.UpdateUserIsAnonymousEvent(isAnonymous));
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
