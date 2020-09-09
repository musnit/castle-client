// Copyright 2015-present 650 Industries. All rights reserved.

package xyz.castle.navigation;

import android.content.Context;
import android.view.View;
import android.widget.LinearLayout;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.DrawableRes;

public abstract class TabBar extends LinearLayout {

    public TabBar(Context context) {
        super(context);
    }

    public interface OnItemSelectedListener {
        void onSelected(int id);
    }

    protected static class Tab {
        int id;
        String title;
        @DrawableRes
        int resId;
        View view;

        Tab(int id, String title, @DrawableRes int resId) {
            this.id = id;
            this.title = title;
            this.resId = resId;
        }
    }

    protected OnItemSelectedListener listener;
    protected List<Tab> tabs = new ArrayList<>();
    protected int selectedIndex = 0;

    public void setListener(OnItemSelectedListener listener) {
        this.listener = listener;
    }

    public void addButton(int id, String title, @DrawableRes int resId) {
        tabs.add(new Tab(id, title, resId));
    }

    public abstract void doneAddingButtons();
}
