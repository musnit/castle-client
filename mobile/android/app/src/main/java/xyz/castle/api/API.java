// Copyright 2015-present 650 Industries. All rights reserved.

package xyz.castle.api;

import android.util.Pair;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.LinkedList;
import java.util.Queue;
import java.util.concurrent.TimeUnit;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import xyz.castle.CastleSharedPreferences;
import xyz.castle.MainActivity;
import xyz.castle.ViewUtils;

public class API {

    public static native void networkRequestCompleted(String response, int requestId);
    public static native void dataNetworkRequestCompleted(boolean success, byte[] response, int requestId);

    public static void jniGraphqlPostRequest(final String postBody, final int requestId) {
        RequestBody body = RequestBody.create(JSON, postBody);
        Request.Builder builder = new Request.Builder()
                .url(API_HOST)
                .post(body)
                .addHeader("X-Platform", "mobile")
                .addHeader("X-Scene-Creator-Version", MainActivity.SCENE_CREATOR_API_VERSION);

        String authToken = CastleSharedPreferences.getAuthToken();
        if (authToken != null) {
            builder.addHeader("X-Auth-Token", authToken);
        }

        client.newCall(builder.build()).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                networkRequestCompleted("error", requestId);
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                try {
                    networkRequestCompleted(response.body().string(), requestId);
                } catch (IOException e) {
                    networkRequestCompleted("error", requestId);
                }
            }
        });
    }

    public static void jniGetRequest(final String url, final int requestId) {
        Request.Builder builder = new Request.Builder()
                .url(url)
                .get();

        client.newCall(builder.build()).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                networkRequestCompleted("error", requestId);
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                try {
                    networkRequestCompleted(response.body().string(), requestId);
                } catch (IOException e) {
                    networkRequestCompleted("error", requestId);
                }
            }
        });
    }

    public static void jniGetDataRequest(final String url, final int requestId) {
        Request.Builder builder = new Request.Builder()
                .url(url)
                .get();

        client.newCall(builder.build()).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                dataNetworkRequestCompleted(false, null, requestId);
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                try {
                    dataNetworkRequestCompleted(true, response.body().bytes(), requestId);
                } catch (IOException e) {
                    dataNetworkRequestCompleted(false, null, requestId);
                }
            }
        });
    }

    public static final FieldList CARD_FIELD_LIST = new FieldList()
            .add("id")
            .add("cardId")
            .add("sceneDataUrl")
            .add("title")
            .add("updatedTime")
            .add("backgroundImage", new FieldList("fileId", "url"))
            .add("scene", new FieldList("data", "sceneId"));


    private static final FieldList CREATOR_FIELD_LIST = new FieldList()
            .add("userId")
            .add("username")
            .add("photo", new FieldList("url", "smallUrl"));

    public static final FieldList DECK_FIELD_LIST = new FieldList()
            .add("id")
            .add("deckId")
            .add("initialCard", new FieldList("id", "cardId", "backgroundColor", "sceneDataUrl"))
            .add("creator", CREATOR_FIELD_LIST)
            .add("variables")
            .add("reactions", new FieldList("id", "reactionId", "count", "isCurrentUserToggled"))
            .add("comments", new FieldList("threadId", "count"))
            .add("commentsEnabled");

    private static final FieldList INITIAL_CARD_FIELD_LIST = new FieldList()
            .add("id")
            .add("cardId")
            .add("sceneDataUrl")
            .add("title")
            .add("backgroundImage", new FieldList("url", "smallUrl", "privateCardUrl", "overlayUrl", "primaryColor"));

    public static final FieldList FEED_ITEM_DECK_FIELD_LIST = new FieldList()
            .add("id")
            .add("deckId")
            .add("title")
            .add("creator", CREATOR_FIELD_LIST)
            .add("initialCard", INITIAL_CARD_FIELD_LIST)
            .add("lastModified")
            .add("variables");

    private static final String API_HOST = "https://castle-app-server-staging.herokuapp.com/graphql";

    private static API sInstance;

    private static final OkHttpClient client = new OkHttpClient
            .Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .writeTimeout(10, TimeUnit.SECONDS)
            .build();
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    public static API getInstance() {
        if (sInstance == null) {
            sInstance = new API();
        }

        return sInstance;
    }

    public static class GraphQLResult {
        JSONObject object;
        JSONArray array;

        public JSONObject object() {
            return object;
        }

        public JSONArray array() {
            return array;
        }
    }

    public interface GraphQLResponseHandler {
        void success(GraphQLResult result);
        void failure(Exception e);
    }

    public void graphql(GraphQLOperation operation) {
        graphql(operation, new GraphQLResponseHandler() {
            @Override
            public void success(GraphQLResult result) {

            }

            @Override
            public void failure(Exception e) {

            }
        });
    }

    public void graphql(GraphQLOperation operation, GraphQLResponseHandler handler) {
        RequestBody body = null;
        try {
            body = RequestBody.create(JSON, operation.build());
        } catch (JSONException e) {
            handler.failure(e);
            return;
        }

        Request.Builder builder = new Request.Builder()
                .url(API_HOST)
                .post(body)
                .addHeader("X-Platform", "mobile");

        String authToken = CastleSharedPreferences.getAuthToken();
        if (authToken != null) {
            builder.addHeader("X-Auth-Token", authToken);
        }

        Request request = builder.build();
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                ViewUtils.runOnUiThread(() -> {
                    handler.failure(e);
                });
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                try {
                    String resultString = response.body().string();
                    JSONObject json = new JSONObject(resultString);
                    JSONObject data = json.getJSONObject("data");

                    JSONObject object = null;
                    JSONArray array = null;

                    try {
                        object = data.getJSONObject(operation.name);
                    }catch (JSONException e) {}
                    try {
                        array = data.getJSONArray(operation.name);
                    }catch (JSONException e) {}

                    GraphQLResult result = new GraphQLResult();
                    result.object = object;
                    result.array = array;

                    handler.success(result);
                } catch (IOException | JSONException e) {
                    handler.failure(e);
                }
            }
        });
    }
}
