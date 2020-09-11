// Copyright 2015-present 650 Industries. All rights reserved.

package xyz.castle.api;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import xyz.castle.CastleSharedPreferences;
import xyz.castle.ViewUtils;

public class API {

    public static final FieldList CARD_FIELD_LIST = new FieldList()
            .add("id")
            .add("cardId")
            .add("title")
            .add("updatedTime")
            .add("backgroundImage", new FieldList("fileId", "url"))
            .add("scene", new FieldList("data", "sceneId"));


    private static final FieldList CREATOR_FIELD_LIST = new FieldList()
            .add("userId")
            .add("username")
            .add("photo", new FieldList("url"));

    public static final FieldList DECK_FIELD_LIST = new FieldList()
            .add("id")
            .add("deckId")
            .add("initialCard", new FieldList("id", "cardId"))
            .add("creator", CREATOR_FIELD_LIST)
            .add("variables");

    private static final String API_HOST = "https://api.castle.games/graphql";

    private static API sInstance;

    private final OkHttpClient client = new OkHttpClient();
    private final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    public static API getInstance() {
        if (sInstance == null) {
            sInstance = new API();
        }

        return sInstance;
    }

    public interface GraphQLResponseHandler {
        void success(JSONObject result);
        void failure(Exception e);
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
                    JSONObject result = json.getJSONObject("data").getJSONObject(operation.name);

                    ViewUtils.runOnUiThread(() -> {
                        handler.success(result);
                    });
                } catch (IOException | JSONException e) {
                    handler.failure(e);
                }
            }
        });
    }
}
