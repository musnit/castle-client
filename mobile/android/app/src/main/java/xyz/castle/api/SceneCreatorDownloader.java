// Copyright 2015-present 650 Industries. All rights reserved.

package xyz.castle.api;

import android.content.Context;
import android.util.AtomicFile;
import android.util.Log;

import org.apache.commons.io.FileUtils;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okio.BufferedSink;
import okio.Okio;

public class SceneCreatorDownloader {

    private static File loveDirectory(Context context) {
        return new File(context.getFilesDir(), "save" + File.separator + "Castle");
    }

    public static void download(Context context, String apiVersion) {
        Request.Builder builder = new Request.Builder()
                .url("https://api.castle.xyz/api/scene-creator?apiVersion=" + apiVersion);

        new OkHttpClient().newCall(builder.build()).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.d("SceneCreatorDownloader", "Download failed " + e.toString());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                File directory = new File(loveDirectory(context), "scene_creator_downloads");

                FileUtils.deleteDirectory(directory);

                File file = new File(directory, "scene_creator_download_dev.love");

                AtomicFile atomicFile = new AtomicFile(file);
                FileOutputStream stream = atomicFile.startWrite();

                BufferedSink sink = Okio.buffer(Okio.sink(stream));
                sink.writeAll(response.body().source());
                sink.close();

                atomicFile.finishWrite(stream);

                Log.d("SceneCreatorDownloader", "Downloaded version " + apiVersion);
            }
        });
    }
}
