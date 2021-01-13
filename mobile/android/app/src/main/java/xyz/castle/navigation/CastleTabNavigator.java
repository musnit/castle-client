package xyz.castle.navigation;

import android.app.Activity;
import android.graphics.Color;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.DrawableRes;
import xyz.castle.R;
import xyz.castle.ViewUtils;

public class CastleTabNavigator extends CastleNavigator {

    public static final int TABS_TOP = 0;
    public static final int TABS_BOTTOM = 1;

    private FrameLayout frameLayout;
    private FrameLayout mainLayout;
    private TabBar tabBar;

    List<CastleNavigationScreen.Instance> tabs = new ArrayList<>();

    private int index = 0;
    private int tabHeight;

    public CastleTabNavigator(Activity activity, int tabsStyle) {
        super(activity);

        tabHeight = ViewUtils.dpToPx(50);

        frameLayout = new FrameLayout(activity);

        mainLayout = new FrameLayout(activity);
        mainLayout.setLayoutParams(new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        if (tabsStyle == TABS_BOTTOM) {
            tabBar = new BottomTabBar(activity);
        } else {
            tabBar = new TopTabBar(activity);
        }

        tabBar.setBackgroundColor(Color.BLACK);

        if (tabsStyle == TABS_BOTTOM) {
            FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, tabHeight);
            lp.gravity = Gravity.BOTTOM;
            tabBar.setLayoutParams(lp);

            frameLayout.addView(mainLayout);
            frameLayout.addView(tabBar);
        } else {
            FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, tabHeight);
            lp.gravity = Gravity.TOP;
            tabBar.setLayoutParams(lp);

            frameLayout.addView(tabBar);
            View paddingView = new View(activity);
            paddingView.setBackgroundColor(activity.getResources().getColor(R.color.top_tab_bar_divier));
            paddingView.setLayoutParams(new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewUtils.dpToPx(1)));

            frameLayout.addView(paddingView);
            frameLayout.addView(mainLayout);
        }

        tabBar.setListener((int id) -> {
            index = id;
            // add + tabHeight to navigation height if the view shouldn't go under the tab bar
            tabs.get(index).bind(CastleTabNavigator.this, mainLayout, navigationWidth, navigationHeight, 0);
        });
    }

    public TabBar.Tab addTab(String screenType, String title, @DrawableRes int resId) {
        tabs.add(CastleNavigator.screenForType(screenType));

        return tabBar.addButton(tabs.size() - 1, title, resId);
    }

    public void doneAddingTabs() {
        tabBar.doneAddingButtons();
    }

    public void switchToTab(int id) {
        int newIndex = -1;
        for (int i = 0; i < tabBar.tabs.size(); i++) {
            TabBar.Tab tab = tabBar.tabs.get(i);
            if (tab.id == id) {
                newIndex = i;
            }
        }

        if (newIndex == -1 || newIndex == index) {
            return;
        }

        index = newIndex;
        tabBar.setSelectedIndex(index);
        CastleNavigationScreen.Instance instance = tabs.get(index);
        if (instance.navigator() != null) {
            instance.navigator().popToTop();
        }
        bindCurrentTab();
    }

    public void hideTabBar() {
        tabBar.setVisibility(View.GONE);
    }

    public void showTabBar() {
        tabBar.setVisibility(View.VISIBLE);
    }

    private void bindCurrentTab() {
        // add + tabHeight to navigation height if the view shouldn't go under the tab bar
        tabs.get(index).bind(this, mainLayout, navigationWidth, navigationHeight, 0);
    }

    @Override
    public void bindViews(FrameLayout layout, int navigationWidth, int navigationHeight) {
        super.bindViews(layout, navigationWidth, navigationHeight);

        setContentView(frameLayout);
        bindCurrentTab();
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
