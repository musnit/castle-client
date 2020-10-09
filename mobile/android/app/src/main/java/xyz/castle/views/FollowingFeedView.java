// Copyright 2015-present 650 Industries. All rights reserved.

package xyz.castle.views;

import android.app.Activity;

import org.greenrobot.eventbus.EventBus;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import androidx.annotation.NonNull;
import xyz.castle.NavigationActivity;
import xyz.castle.R;
import xyz.castle.ViewUtils;
import xyz.castle.api.API;
import xyz.castle.api.GraphQLOperation;
import xyz.castle.navigation.CastleNavigationFocusListener;

public class FollowingFeedView extends NativeFeedView implements CastleNavigationFocusListener {
    public FollowingFeedView(@NonNull Activity activity) {
        super(activity);

        addInfiniteScrollHandler((decks, handler) -> {
            try {
                JSONObject lastDeck = decks.getJSONObject(decks.length() - 1);
                String lastModified = lastDeck.getString("lastModified");
                int limit = 24;

                GraphQLOperation operation = GraphQLOperation
                        .Query("followingFeed")
                        .fields(API.FEED_ITEM_DECK_FIELD_LIST)
                        .variable("limit", "Int", limit)
                        .variable("lastModifiedBefore", "Datetime", lastModified);

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
            } catch (JSONException e) {
                handler.doneLoadingMore();
            }
        });
    }

    @Override
    public String feedName() {
        return "Newest";
    }

    @Override
    public void loadData() {
        GraphQLOperation operation = GraphQLOperation
                .Query("followingFeed")
                .fields(API.FEED_ITEM_DECK_FIELD_LIST)
                .variable("limit", "Int", 24);

        API.getInstance().graphql(operation, new API.GraphQLResponseHandler() {
            @Override
            public void success(API.GraphQLResult result) {
                JSONArray array = result.array();
                feedRecyclerView.replaceDecks(array);

                ViewUtils.runOnUiThread(() -> {
                    setRefreshing(false);

                    if (array.length() == 0) {
                        addEmptyStateLayout(R.layout.following_feed_empty_state);
                    } else {
                        hideEmptyStateLayout();
                    }
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

    @Override
    public void onFocus() {
        GraphQLOperation operation = GraphQLOperation
                .Mutation("markFollowingFeedRead");
        API.getInstance().graphql(operation);
        EventBus.getDefault().post(new NavigationActivity.UpdateFollowingBadge(false));
    }

    @Override
    public void onBlur() {

    }
}
