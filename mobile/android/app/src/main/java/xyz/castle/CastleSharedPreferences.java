package xyz.castle;

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

    public static class NuxCompleteEvent {

    }

    private static final String AUTH_TOKEN_KEY = "AUTH_TOKEN";
    private static final String IS_NUX_COMPLETED_KEY = "IS_NUX_COMPLETED";

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

    public static boolean getIsNuxComplete() {
        return get(IS_NUX_COMPLETED_KEY, "false").equals("true");
    }

    public static void markNuxComplete() {
        set(IS_NUX_COMPLETED_KEY, "true");
        EventBus.getDefault().post(new NuxCompleteEvent());
    }
}
