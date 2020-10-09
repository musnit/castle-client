package xyz.castle.navigation;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;

import xyz.castle.R;
import xyz.castle.ViewUtils;

public class BottomTabBar extends TabBar {

    private Activity activity;
    private Float motionEventX;

    public BottomTabBar(Activity activity) {
        super(activity);

        this.activity = activity;

        setOrientation(HORIZONTAL);
        setOnTouchListener((view, motionEvent) -> {
            motionEventX = motionEvent.getX();

            return false;
        });

        setOnClickListener(view -> {
            if (motionEventX != null) {
                float percent = motionEventX / ViewUtils.screenWidth(activity);
                int index = (int) Math.floor(percent * tabs.size());
                if (index >= tabs.size()) {
                    index = tabs.size() - 1;
                }

                setSelectedIndex(index);

                if (listener != null) {
                    listener.onSelected(tabs.get(index).id);
                }
            }

            motionEventX = null;
        });
    }

    @Override
    public void setSelectedIndex(int index) {
        if (selectedIndex != index) {
            ((ImageView) tabs.get(selectedIndex).view).setColorFilter(R.color.bottom_tab_inactive);
            ((ImageView) tabs.get(index).view).clearColorFilter();

            selectedIndex = index;
        }
    }

    @Override
    public void doneAddingButtons() {
        ViewUtils.runOnUiThread(() -> {
            for (int i = 0; i < tabs.size(); i++) {
                Tab tab = tabs.get(i);

                final RelativeLayout layout = new RelativeLayout(getContext());
                layout.setLayoutParams(new LinearLayout.LayoutParams(ViewUtils.screenWidth(activity) / tabs.size(), ViewGroup.LayoutParams.MATCH_PARENT));

                ImageView imageView = new ImageView(getContext());
                {
                    imageView.setImageResource(tab.resId);
                    RelativeLayout.LayoutParams layoutParams = new RelativeLayout.LayoutParams(ViewUtils.dpToPx(28), ViewUtils.dpToPx(28));
                    layoutParams.addRule(RelativeLayout.CENTER_IN_PARENT, RelativeLayout.TRUE);
                    imageView.setLayoutParams(layoutParams);
                    imageView.setId((int) Math.floor(Math.random() * 10000000));

                    layout.addView(imageView);
                }

                tab.onUpdateBadgeListener = (int count) -> {
                    if (tab.badgeView == null) {
                        TextView badgeView = new TextView(getContext());
                        badgeView.setBackgroundColor(Color.WHITE);
                        badgeView.setTextColor(Color.BLACK);
                        badgeView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
                        badgeView.setBackgroundResource(R.drawable.badge_circle);
                        badgeView.setMinWidth(ViewUtils.dpToPx(18));
                        RelativeLayout.LayoutParams layoutParams = new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewUtils.dpToPx(18));
                        layoutParams.addRule(RelativeLayout.ALIGN_TOP, imageView.getId());
                        layoutParams.addRule(RelativeLayout.ALIGN_RIGHT, imageView.getId());
                        layoutParams.topMargin = -ViewUtils.dpToPx(6);
                        layoutParams.rightMargin = -ViewUtils.dpToPx(6);
                        badgeView.setPadding(ViewUtils.dpToPx(4), 0, ViewUtils.dpToPx(4), 0);
                        badgeView.setGravity(Gravity.CENTER);
                        badgeView.setLayoutParams(layoutParams);

                        layout.addView(badgeView);
                        tab.badgeView = badgeView;
                    }

                    if (count <= 0) {
                        tab.badgeView.setVisibility(View.GONE);
                    } else if (count < 100) {
                        ((TextView) tab.badgeView).setText(Integer.toString(count));
                        tab.badgeView.setVisibility(View.VISIBLE);
                    } else {
                        ((TextView) tab.badgeView).setText("99+");
                        tab.badgeView.setVisibility(View.VISIBLE);
                    }
                };

                if (i != selectedIndex) {
                    imageView.setColorFilter(R.color.bottom_tab_inactive);
                }

                tab.view = imageView;

                addView(layout);
            }
        });
    }
}
