package xyz.castle.navigation;

import android.content.Context;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;

import xyz.castle.R;
import xyz.castle.ViewUtils;

public class BottomTabBar extends TabBar {

    private Float motionEventX;

    public BottomTabBar(Context context) {
        super(context);

        setOrientation(HORIZONTAL);
        setOnTouchListener((view, motionEvent) -> {
            motionEventX = motionEvent.getX();

            return false;
        });

        setOnClickListener(view -> {
            if (motionEventX != null) {
                float percent = motionEventX / ViewUtils.screenWidth();
                int index = (int) Math.floor(percent * tabs.size());
                if (index >= tabs.size()) {
                    index = tabs.size() - 1;
                }

                if (listener != null && selectedIndex != index) {
                    ((ImageView)tabs.get(selectedIndex).view).setColorFilter(R.color.bottom_tab_inactive);
                    ((ImageView)tabs.get(index).view).clearColorFilter();

                    selectedIndex = index;
                    listener.onSelected(tabs.get(index).id);
                }
            }

            motionEventX = null;
        });
    }

    @Override
    public void doneAddingButtons() {
        ViewUtils.runOnUiThread(() -> {
            for (int i = 0; i < tabs.size(); i++) {
                Tab tab = tabs.get(i);

                RelativeLayout layout = new RelativeLayout(getContext());
                layout.setLayoutParams(new LinearLayout.LayoutParams(ViewUtils.screenWidth() / tabs.size(), ViewGroup.LayoutParams.MATCH_PARENT));

                ImageView imageView = new ImageView(getContext());
                imageView.setImageResource(tab.resId);
                RelativeLayout.LayoutParams layoutParams = new RelativeLayout.LayoutParams(ViewUtils.dpToPx(28), ViewUtils.dpToPx(28));
                layoutParams.addRule(RelativeLayout.CENTER_IN_PARENT, RelativeLayout.TRUE);
                imageView.setLayoutParams(layoutParams);

                layout.addView(imageView);

                if (i != selectedIndex) {
                    imageView.setColorFilter(R.color.bottom_tab_inactive);
                }

                tab.view = imageView;

                addView(layout);
            }
        });
    }
}
