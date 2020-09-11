// Copyright 2015-present 650 Industries. All rights reserved.

package xyz.castle.views;

import android.app.Activity;
import android.util.Log;
import android.view.View;
import android.widget.ProgressBar;

import org.json.JSONArray;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import xyz.castle.R;
import xyz.castle.ViewUtils;

public abstract class NativeFeedView extends SwipeRefreshLayout implements SwipeRefreshLayout.OnRefreshListener {

    RecyclerView recyclerView;
    FeedRecyclerView feedRecyclerView;
    ProgressBar progressBar;

    public NativeFeedView(@NonNull Activity activity) {
        super(activity);

        View layout = inflate(activity, R.layout.feed_view, this);

        progressBar = layout.findViewById(R.id.progress_bar);
        recyclerView = layout.findViewById(R.id.recycler_view);

        feedRecyclerView = new FeedRecyclerView(recyclerView, activity, feedName());

        setOnRefreshListener(this);
        setRefreshing(true);
        loadData();

        hideLoadMoreProgress();
    }

    private void hideLoadMoreProgress() {
        progressBar.setVisibility(View.GONE);
    }

    private void showLoadMoreProgress() {
        progressBar.setVisibility(View.VISIBLE);
        //recyclerView.setPadding(0, 0, 0, ViewUtils.dpToPx(50));
    }

    @Override
    public void onRefresh() {
        scrolledToBottom = false;
        loadData();
    }

    interface LoadMoreHandler {
        void doneLoadingMore();
        void scrolledToBottom();
    }

    interface InfiniteScrollHandler {
        void onLoadMore(JSONArray decks, LoadMoreHandler handler);
    }

    private InfiniteScrollHandler infiniteScrollHandler;
    private int previousTotal = 0;
    private boolean loadingMore = true;
    private boolean scrolledToBottom = false;
    private int visibleThreshold = 5;

    protected void addInfiniteScrollHandler(InfiniteScrollHandler handler) {
        infiniteScrollHandler = handler;

        recyclerView.addOnScrollListener(new RecyclerView.OnScrollListener() {
            @Override
            public void onScrolled(@NonNull RecyclerView recyclerView, int dx, int dy) {
                super.onScrolled(recyclerView, dx, dy);

                int visibleItemCount = recyclerView.getChildCount();
                int totalItemCount = feedRecyclerView.layoutManager.getItemCount();
                int firstVisibleItem = feedRecyclerView.layoutManager.findFirstVisibleItemPosition();

                if (loadingMore) {
                    if (totalItemCount > previousTotal) {
                        loadingMore = false;
                        hideLoadMoreProgress();
                        previousTotal = totalItemCount;
                    }
                }
                if (!scrolledToBottom && !loadingMore && (totalItemCount - visibleItemCount)
                        <= (firstVisibleItem + visibleThreshold)) {
                    loadingMore = true;
                    showLoadMoreProgress();

                    infiniteScrollHandler.onLoadMore(feedRecyclerView.getJSONDecks(), new LoadMoreHandler() {
                        @Override
                        public void doneLoadingMore() {
                            loadingMore = false;

                            ViewUtils.runOnUiThread(() -> {
                                hideLoadMoreProgress();
                            });
                        }

                        @Override
                        public void scrolledToBottom() {
                            scrolledToBottom = true;

                            ViewUtils.runOnUiThread(() -> {
                                //recyclerView.setPadding(0, 0, 0, 0);
                            });
                        }
                    });
                }
            }
        });
    }

    abstract public String feedName();
    abstract public void loadData();
}
