// Copyright 2015-present 650 Industries. All rights reserved.

package xyz.castle.views;

import android.app.Activity;

import androidx.annotation.NonNull;
import xyz.castle.ViewUtils;
import xyz.castle.api.API;
import xyz.castle.api.GraphQLOperation;

public class FeaturedFeedView extends NativeFeedView {

    public FeaturedFeedView(@NonNull Activity activity) {
        super(activity);
    }

    @Override
    public String feedName() {
        return "Featured";
    }

    @Override
    public void loadData() {
        API.getInstance().graphql(GraphQLOperation.Query("featuredFeed").fields(API.FEED_ITEM_DECK_FIELD_LIST), new API.GraphQLResponseHandler() {
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
