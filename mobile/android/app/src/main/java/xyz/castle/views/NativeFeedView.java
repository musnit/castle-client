// Copyright 2015-present 650 Industries. All rights reserved.

package xyz.castle.views;

import android.app.Activity;

import androidx.annotation.NonNull;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

public abstract class NativeFeedView extends SwipeRefreshLayout implements SwipeRefreshLayout.OnRefreshListener {

    FeedRecyclerView feedRecyclerView;

    public NativeFeedView(@NonNull Activity activity) {
        super(activity);

        feedRecyclerView = new FeedRecyclerView(activity, feedName());
        addView(feedRecyclerView);

        setOnRefreshListener(this);
        setRefreshing(true);
        loadData();
    }

    @Override
    public void onRefresh() {
        loadData();
    }

    abstract public String feedName();
    abstract public void loadData();
}
