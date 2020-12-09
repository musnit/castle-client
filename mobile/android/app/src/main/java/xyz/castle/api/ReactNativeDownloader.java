// Copyright 2015-present 650 Industries. All rights reserved.

package xyz.castle.api;

import android.content.Context;
import android.os.StrictMode;
import android.util.AtomicFile;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

import ghost.CastleNativeSettingsModule;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okio.BufferedSink;
import okio.Okio;

public class ReactNativeDownloader {

    public static String download(Context context) {
        final String channel = CastleNativeSettingsModule.reactNativeChannel();
        if (channel == null) {
            return null;
        }

        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        Request.Builder builder = new Request.Builder()
                .url("https://api.castle.xyz/api/react-native-bundle?platform=android&channel=" + channel);

        try {
            Response response = new OkHttpClient().newCall(builder.build()).execute();
            File file = new File(context.getFilesDir(), "rnbundle.bundle");

            AtomicFile atomicFile = new AtomicFile(file);
            FileOutputStream stream = atomicFile.startWrite();

            BufferedSink sink = Okio.buffer(Okio.sink(stream));
            sink.writeAll(response.body().source());
            sink.close();

            atomicFile.finishWrite(stream);

            Log.d("ReactNativeDownloader", "Downloaded channel " + channel);
            return file.getAbsolutePath();
        } catch (IOException e) {
            return null;
        }
    }
}
