package xyz.castle.navigation;

import android.app.Activity;
import android.graphics.Color;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.DrawableRes;
import xyz.castle.R;
import xyz.castle.ViewUtils;

public class CastleTabNavigator extends CastleNavigator {

    public static final int TABS_TOP = 0;
    public static final int TABS_BOTTOM = 1;

    private LinearLayout linearLayout;
    private FrameLayout mainLayout;
    private TabBar tabBar;

    List<CastleNavigationScreen.Instance> tabs = new ArrayList<>();

    private int index = 0;
    private int tabHeight;

    public CastleTabNavigator(Activity activity, int tabsStyle) {
        super(activity);

        tabHeight = ViewUtils.dpToPx(50);

        linearLayout = new LinearLayout(activity);
        linearLayout.setOrientation(LinearLayout.VERTICAL);

        mainLayout = new FrameLayout(activity);
        mainLayout.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, 1));

        if (tabsStyle == TABS_BOTTOM) {
            tabBar = new BottomTabBar(activity);
        } else {
            tabBar = new TopTabBar(activity);
        }

        tabBar.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, tabHeight));
        tabBar.setBackgroundColor(Color.BLACK);

        if (tabsStyle == TABS_BOTTOM) {
            linearLayout.addView(mainLayout);
            linearLayout.addView(tabBar);
        } else {
            linearLayout.addView(tabBar);
            View paddingView = new View(activity);
            paddingView.setBackgroundColor(activity.getResources().getColor(R.color.top_tab_bar_divier));
            paddingView.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewUtils.dpToPx(1)));

            linearLayout.addView(paddingView);
            linearLayout.addView(mainLayout);
        }

        tabBar.setListener((int id) -> {
            index = id;
            tabs.get(index).bind(CastleTabNavigator.this, mainLayout, navigationWidth, navigationHeight + tabHeight, 0);
        });
    }

    public void addTab(String screenType, String title, @DrawableRes int resId) {
        tabs.add(CastleNavigator.screenForType(screenType));

        tabBar.addButton(tabs.size() - 1, title, resId);
    }

    public void doneAddingTabs() {
        tabBar.doneAddingButtons();
    }

    @Override
    public void bindViews(FrameLayout layout, int navigationWidth, int navigationHeight) {
        super.bindViews(layout, navigationWidth, navigationHeight);

        setContentView(linearLayout);
        tabs.get(index).bind(this, mainLayout, navigationWidth, navigationHeight + tabHeight, 0);
    }

    @Override
    public void destroyViews() {
        index = 0;
    }

    @Override
    public void destroy() {
        for (int i = 0; i < tabs.size(); i++) {
            tabs.get(i).destroy();
        }
    }

    @Override
    public void navigate(String screenType, String navigationScreenOptions) {
        throw new Error("Cannot call navigate on TabNavigator");
    }

    @Override
    public void navigatePush(String screenType, String navigationScreenOptions) {
        throw new Error("Cannot call navigatePush on TabNavigator");
    }

    @Override
    public boolean handleBack() {
        CastleNavigator navigator = tabs.get(index).navigator();
        if (navigator != null) {
            return navigator.handleBack();
        }

        return false;
    }

    @Override
    public boolean popToTop() {
        CastleNavigator navigator = tabs.get(index).navigator();
        if (navigator != null) {
            return navigator.popToTop();
        }

        return false;
    }
}
