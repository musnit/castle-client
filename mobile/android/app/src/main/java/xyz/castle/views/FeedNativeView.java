package xyz.castle.views;

import android.content.Context;
import android.widget.GridView;

import androidx.annotation.NonNull;
import ghost.CastleFeedView;

public class FeedNativeView extends GridView {

    CastleFeedView.FeedViewAdapter adapter;

    public FeedNativeView(@NonNull Context context) {
        super(context);

        setColumnWidth(400);
        setNumColumns(GridView.AUTO_FIT);
        setVerticalSpacing(24);
        setHorizontalSpacing(10);
        setStretchMode(GridView.STRETCH_SPACING_UNIFORM);

        adapter = new CastleFeedView.FeedViewAdapter(context);
        setAdapter(adapter);
        adapter.setTestDecks();
    }
}
