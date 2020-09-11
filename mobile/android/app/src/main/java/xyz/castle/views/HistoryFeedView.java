// Copyright 2015-present 650 Industries. All rights reserved.

package xyz.castle.views;

import android.app.Activity;

import org.json.JSONException;
import org.json.JSONObject;

import androidx.annotation.NonNull;
import xyz.castle.ViewUtils;
import xyz.castle.api.API;
import xyz.castle.api.GraphQLOperation;

public class HistoryFeedView extends NativeFeedView {
    public HistoryFeedView(@NonNull Activity activity) {
        super(activity);

        addInfiniteScrollHandler((decks, handler) -> {
            int offset = decks.length();
            int limit = 24;

            GraphQLOperation operation = GraphQLOperation
                    .Query("deckHistory")
                    .fields(API.FEED_ITEM_DECK_FIELD_LIST)
                    .variable("limit", "Int", limit)
                    .variable("offset", "Int", offset);

            API.getInstance().graphql(operation, new API.GraphQLResponseHandler() {
                @Override
                public void success(API.GraphQLResult result) {
                    feedRecyclerView.addDecks(result.array());
                    handler.doneLoadingMore();

                    if (result.array().length() < limit) {
                        handler.scrolledToBottom();
                    }
                }

                @Override
                public void failure(Exception e) {
                    handler.doneLoadingMore();
                }
            });
        });
    }

    @Override
    public String feedName() {
        return "History";
    }

    @Override
    public void loadData() {
        GraphQLOperation operation = GraphQLOperation
                .Query("deckHistory")
                .fields(API.FEED_ITEM_DECK_FIELD_LIST)
                .variable("limit", "Int", 24);

        API.getInstance().graphql(operation, new API.GraphQLResponseHandler() {
            @Override
            public void success(API.GraphQLResult result) {
                feedRecyclerView.replaceDecks(result.array());

                ViewUtils.runOnUiThread(() -> {
                    setRefreshing(false);
                });
            }

            @Override
            public void failure(Exception e) {
                ViewUtils.runOnUiThread(() -> {
                    setRefreshing(false);
                });
            }
        });
    }
}
