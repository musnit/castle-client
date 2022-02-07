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
    private static final String NUM_APP_OPENS = "NUM_APP_OPENS";
    private static final String NUM_REVIEW_SHOWN = "NUM_REVIEW_SHOWN";
    private static final String REVIEW_TIMESTAMP = "REVIEW_TIMESTAMP";

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

    public static int numAppOpens() {
        return sharedPreferences.getInt(NUM_APP_OPENS, 0);
    }

    public static int incrementNumAppOpens() {
        int count = numAppOpens() + 1;
        sharedPreferences.edit().putInt(NUM_APP_OPENS, count).commit();
        return count;
    }

    public static void clearNumAppOpens() {
        sharedPreferences.edit().putInt(NUM_APP_OPENS, 0).commit();
    }

    public static int numReviewShown() {
        return sharedPreferences.getInt(NUM_REVIEW_SHOWN, 0);
    }

    public static int incrementNumReviewShown() {
        int count = numReviewShown() + 1;
        sharedPreferences.edit().putInt(NUM_REVIEW_SHOWN, count).commit();
        return count;
    }

    public static long reviewTimestamp() {
        long result = sharedPreferences.getLong(REVIEW_TIMESTAMP, -1);
        if (result == -1) {
            return updateReviewTimestamp();
        }
        return result;
    }

    public static long updateReviewTimestamp() {
        long result = System.currentTimeMillis();
        sharedPreferences.edit().putLong(REVIEW_TIMESTAMP, result).commit();
        return result;
    }
}
