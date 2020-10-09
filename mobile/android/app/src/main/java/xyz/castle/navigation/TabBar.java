// Copyright 2015-present 650 Industries. All rights reserved.

package xyz.castle.navigation;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.DrawableRes;
import xyz.castle.ViewUtils;

public abstract class TabBar extends LinearLayout {

    public TabBar(Context context) {
        super(context);
    }

    public interface OnItemSelectedListener {
        void onSelected(int id);
    }

    public interface OnUpdateBadgeListener {
        void onUpdateBadge(int count);
    }

    public static class Tab {
        public void updateBadge(int count) {
            ViewUtils.runOnUiThread(() -> {
                onUpdateBadgeListener.onUpdateBadge(count);
            });
        }

        public final int id;
        String title;
        @DrawableRes
        int resId;
        View view;
        View badgeView;
        OnUpdateBadgeListener onUpdateBadgeListener = (int count) -> {};

        protected Tab(int id, String title, @DrawableRes int resId) {
            this.id = id;
            this.title = title;
            this.resId = resId;
        }
    }

    protected OnItemSelectedListener listener;
    protected List<Tab> tabs = new ArrayList<>();
    protected int selectedIndex = 0;

    public abstract void setSelectedIndex(int index);

    public void setListener(OnItemSelectedListener listener) {
        this.listener = listener;
    }

    public Tab addButton(int id, String title, @DrawableRes int resId) {
        Tab tab = new Tab(id, title, resId);
        tabs.add(tab);
        return tab;
    }

    public abstract void doneAddingButtons();
}
