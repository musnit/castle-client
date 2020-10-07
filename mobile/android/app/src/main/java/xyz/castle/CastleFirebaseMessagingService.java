package xyz.castle;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.RectF;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.view.View;
import android.widget.RemoteViews;

import androidx.core.app.NotificationCompat;

import com.facebook.imagepipeline.common.ResizeOptions;
import com.facebook.imagepipeline.postprocessors.RoundPostprocessor;
import com.facebook.imagepipeline.request.Postprocessor;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import org.greenrobot.eventbus.EventBus;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Map;

public class CastleFirebaseMessagingService extends FirebaseMessagingService {

    public static String NOTIFICATION_DATA_KEY = "dataString";

    private static int sNotificationId = 0;

    public static class NewFirebaseTokenEvent {
        public final String token;

        public NewFirebaseTokenEvent(String token) {
            this.token = token;
        }
    }

    public static Bitmap getRoundedCornerBitmap(Bitmap bitmap, int pixels) {
        Bitmap output = Bitmap.createBitmap(bitmap.getWidth(), bitmap
                .getHeight(), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(output);

        final int color = 0xff424242;
        final Paint paint = new Paint();
        final Rect rect = new Rect(0, 0, bitmap.getWidth(), bitmap.getHeight());
        final RectF rectF = new RectF(rect);
        final float roundPx = pixels;

        paint.setAntiAlias(true);
        canvas.drawARGB(0, 0, 0, 0);
        paint.setColor(color);
        canvas.drawRoundRect(rectF, roundPx, roundPx, paint);

        paint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));
        canvas.drawBitmap(bitmap, rect, rect, paint);

        return output;
    }

    private void removePushNotification(int pushNotificationId) {
        try {
            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            notificationManager.cancel(pushNotificationId);
        } catch (Throwable e) {}
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        final Map<String, String> data = remoteMessage.getData();
        if (data != null) {
            if (data.containsKey("removePushNotificationId")) {
                int removePushNotificationId = Integer.parseInt(data.get("removePushNotificationId"));
                removePushNotification(removePushNotificationId);
                return;
            }

            final String title = data.get("title");
            final String messageBody = data.get("body");
            final String imageUriString = data.get("image");
            final String type = data.get("type");
            Uri imageUri = null;
            if (imageUriString != null) {
                imageUri = Uri.parse(imageUriString);
            }

            String dataString = "";
            if (data.containsKey("dataString")) {
                dataString = data.get("dataString");
            }
            final String finalDataString = dataString;

            int pushNotificationId = sNotificationId++;
            if (data.containsKey("pushNotificationId")) {
                pushNotificationId = Integer.parseInt(data.get("pushNotificationId"));
            }
            final int finalPushNotificationId = pushNotificationId;

            if (imageUri == null) {
                sendNotification(title, messageBody, null, finalDataString, finalPushNotificationId);
            } else {
                boolean isProfilePic = false;
                if (type != null && type.equals("follow")) {
                    //isProfilePic = true;
                }

                Postprocessor postprocessor = null;
                ResizeOptions resizeOptions = null;

                if (isProfilePic) {
                    postprocessor = new RoundPostprocessor();
                    resizeOptions = ResizeOptions.forSquareSize(ViewUtils.dpToPx(40));
                }

                final boolean finalIsProfilePic = isProfilePic;

                ViewUtils.loadBitmap(imageUri, this, postprocessor, resizeOptions, (Bitmap bitmap) -> {
                    if (!finalIsProfilePic) {
                        try {
                            bitmap = getRoundedCornerBitmap(bitmap, ViewUtils.dpToPx(10));
                        } catch (Throwable throwable) {}
                    }

                    sendNotification(title, messageBody, bitmap, finalDataString, finalPushNotificationId);
                });
            }
        }
    }

    @Override
    public void onNewToken(String token) {
        EventBus.getDefault().post(new NewFirebaseTokenEvent(token));
    }

    private void sendNotification(String title, String messageBody, Bitmap bitmap, String dataString, int pushNotificationId) {
        if (!NavigationActivity.isFocused() && (title != null || messageBody != null)) {
            Intent intent = new Intent(this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            intent.putExtra(NOTIFICATION_DATA_KEY, dataString);
            PendingIntent pendingIntent = PendingIntent.getActivity(this, 10000 + pushNotificationId, intent,
                    PendingIntent.FLAG_ONE_SHOT);

            String channelId = "default";
            Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            NotificationCompat.Builder notificationBuilder =
                    new NotificationCompat.Builder(this, channelId)
                            .setSmallIcon(R.drawable.notification_icon)
                            .setColor(getResources().getColor(R.color.black))
                            .setAutoCancel(true)
                            .setSound(defaultSoundUri)
                            .setContentIntent(pendingIntent);

            if (bitmap == null) {
                if (title != null) {
                    notificationBuilder.setContentTitle(title);
                }
                if (messageBody != null) {
                    notificationBuilder.setContentText(messageBody);
                }
            } else {
                RemoteViews notificationLayout = new RemoteViews(getPackageName(), R.layout.deck_notification_small);
                notificationLayout.setImageViewBitmap(R.id.image_view, bitmap);

                if (title != null) {
                    notificationLayout.setTextViewText(R.id.title_text_view, title);
                } else {
                    notificationLayout.setViewVisibility(R.id.title_text_view, View.GONE);
                }

                if (messageBody != null) {
                    notificationLayout.setTextViewText(R.id.content_text_view, messageBody);
                    // this is needed for the summary notification
                    notificationBuilder.setContentText(messageBody);
                }
                //RemoteViews notificationLayoutExpanded = new RemoteViews(getPackageName(), R.layout.notification_large);


                //notificationBuilder.setLargeIcon(bitmap).setStyle(new NotificationCompat.BigTextStyle().bigText(message));
                notificationBuilder.setStyle(new NotificationCompat.DecoratedCustomViewStyle())
                        .setCustomContentView(notificationLayout);
                        //.setCustomBigContentView(notificationLayoutExpanded)
            }

            NotificationManager notificationManager =
                    (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

            // Since android Oreo notification channel is needed.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(channelId,
                        "Default",
                        NotificationManager.IMPORTANCE_DEFAULT);
                notificationManager.createNotificationChannel(channel);
            }

            notificationManager.notify(pushNotificationId, notificationBuilder.build());
        }

        WritableMap payload = Arguments.createMap();
        payload.putString("dataString", dataString);
        EventBus.getDefault().post(new NavigationActivity.RNEvent("CastlePushNotificationReceived", payload));

        try {
            JSONObject data = new JSONObject(dataString);
            if (data.has("numUnseenNotifications")) {
                int count = data.getInt("numUnseenNotifications");
                EventBus.getDefault().post(new NavigationActivity.UpdateNotificationsBadgeEvent(count));
            }
        } catch (JSONException e) {}
    }
}
