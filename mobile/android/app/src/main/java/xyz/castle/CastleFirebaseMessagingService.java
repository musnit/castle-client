package xyz.castle;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import org.greenrobot.eventbus.EventBus;

public class CastleFirebaseMessagingService extends FirebaseMessagingService {

    private static int sNotificationId = 0;

    public static class NewFirebaseTokenEvent {
        public final String token;

        public NewFirebaseTokenEvent(String token) {
            this.token = token;
        }
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        if (remoteMessage.getNotification() != null) {
            final String title = remoteMessage.getNotification().getTitle();
            final String messageBody = remoteMessage.getNotification().getBody();
            final Uri imageUri = remoteMessage.getNotification().getImageUrl();

            if (imageUri == null) {
                sendNotification(title, messageBody, null);
            } else {
                ViewUtils.loadBitmap(imageUri, this, (Bitmap bitmap) -> {
                    sendNotification(title, messageBody, bitmap);
                });
            }
        }
    }

    @Override
    public void onNewToken(String token) {
        EventBus.getDefault().post(new NewFirebaseTokenEvent(token));
    }

    private void sendNotification(String title, String messageBody, Bitmap bitmap) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent,
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

        if (title != null) {
            notificationBuilder = notificationBuilder.setContentTitle(title);
        }
        if (messageBody != null) {
            notificationBuilder = notificationBuilder.setContentText(messageBody);
        }
        if (bitmap != null) {
            notificationBuilder.setLargeIcon(bitmap);
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

        notificationManager.notify(sNotificationId++, notificationBuilder.build());
    }
}