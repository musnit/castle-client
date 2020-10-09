// Copyright 2015-present 650 Industries. All rights reserved.

package xyz.castle.navigation;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.Space;
import android.widget.TextView;

import xyz.castle.R;
import xyz.castle.ViewUtils;

public class TopTabBar extends TabBar {

    public TopTabBar(Context context) {
        super(context);

        setOrientation(HORIZONTAL);
    }

    @Override
    public void setSelectedIndex(int index) {
        if (selectedIndex != index) {
            setSelected(false, (TextView) tabs.get(selectedIndex).view);
            setSelected(true, (TextView) tabs.get(index).view);

            selectedIndex = index;
        }
    }

    private void selectIndex(int index) {
        setSelectedIndex(index);

        if (listener != null) {
            listener.onSelected(tabs.get(index).id);
        }
    }

    private void setSelected(boolean selected, TextView textView) {
        if (selected) {
            textView.setTextColor(getResources().getColor(R.color.top_tab_active));
            textView.setTypeface(null, Typeface.BOLD);
            textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
            textView.setBackgroundResource(R.drawable.top_tab_bar_selected_item_border_bottom);
        } else {
            textView.setTextColor(getResources().getColor(R.color.top_tab_inactive));
            textView.setTypeface(null, Typeface.NORMAL);
            textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
            textView.setBackgroundColor(Color.TRANSPARENT);
        }
    }

    @Override
    public void doneAddingButtons() {
        ViewUtils.runOnUiThread(() -> {
            Space space = new Space(getContext());
            space.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f));
            addView(space);

            for (int i = 0; i < tabs.size(); i++) {
                Tab tab = tabs.get(i);

                RelativeLayout layout = new RelativeLayout(getContext());
                layout.setGravity(RelativeLayout.CENTER_HORIZONTAL);
                layout.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.MATCH_PARENT));

                TextView textView = new TextView(getContext());
                textView.setText(tab.title);
                textView.setPadding(ViewUtils.dpToPx(12), ViewUtils.dpToPx(8), ViewUtils.dpToPx(12), ViewUtils.dpToPx(8));
                textView.setId((int) Math.floor(Math.random() * 10000000));

                RelativeLayout.LayoutParams layoutParams = new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                layoutParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM, RelativeLayout.TRUE);
                textView.setLayoutParams(layoutParams);

                layout.addView(textView);

                tab.onUpdateBadgeListener = (int count) -> {
                    if (tab.badgeView == null) {
                        ImageView badgeView = new ImageView(getContext());
                        badgeView.setImageResource(R.drawable.unread_indicator_circle);
                        badgeView.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
                        //badgeView.setPadding(ViewUtils.dpToPx(12), ViewUtils.dpToPx(8), ViewUtils.dpToPx(0), ViewUtils.dpToPx(8));

                        RelativeLayout.LayoutParams layoutParams2 = new RelativeLayout.LayoutParams(ViewUtils.dpToPx(9), ViewUtils.dpToPx(9));
                        layoutParams2.addRule(RelativeLayout.ALIGN_BOTTOM, textView.getId());
                        layoutParams2.addRule(RelativeLayout.ALIGN_TOP, textView.getId());
                        layoutParams2.addRule(RelativeLayout.ALIGN_RIGHT, textView.getId());
                        layoutParams2.rightMargin = ViewUtils.dpToPx(6);
                        badgeView.setLayoutParams(layoutParams2);

                        layout.addView(badgeView);
                        tab.badgeView = badgeView;
                    }

                    if (count == 0) {
                        tab.badgeView.setVisibility(View.GONE);
                        textView.setPadding(ViewUtils.dpToPx(12), ViewUtils.dpToPx(8), ViewUtils.dpToPx(12), ViewUtils.dpToPx(8));
                    } else {
                        tab.badgeView.setVisibility(View.VISIBLE);
                        textView.setPadding(ViewUtils.dpToPx(12), ViewUtils.dpToPx(8), ViewUtils.dpToPx(12 + 10), ViewUtils.dpToPx(8));
                    }
                };

                setSelected(i == selectedIndex, textView);

                tab.view = textView;

                final int index = i;
                layout.setOnClickListener(view -> {
                    selectIndex(index);
                });
                addView(layout);
            }

            space = new Space(getContext());
            space.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f));
            addView(space);
        });
    }
}
