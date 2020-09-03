package xyz.castle.navigation;

import android.app.Activity;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.view.Menu;
import android.view.MenuItem;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;

import com.google.android.material.bottomnavigation.BottomNavigationView;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.NonNull;
import xyz.castle.ViewUtils;

public class CastleTabNavigator extends CastleNavigator {

    public static final int TABS_TOP = 0;
    public static final int TABS_BOTTOM = 1;

    private LinearLayout linearLayout;
    private FrameLayout mainLayout;
    private BottomNavigationView bottomNavigationView;

    List<CastleNavigationScreen.Instance> tabs = new ArrayList<>();

    private int index = 0;

    public CastleTabNavigator(Activity activity, int tabsStyle) {
        super(activity);

        linearLayout = new LinearLayout(activity);
        linearLayout.setOrientation(LinearLayout.VERTICAL);

        mainLayout = new FrameLayout(activity);
        mainLayout.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, 1));

        bottomNavigationView = new BottomNavigationView(activity);
        bottomNavigationView.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewUtils.dpToPx(50)));
        bottomNavigationView.setBackgroundColor(Color.BLACK);
        bottomNavigationView.setItemTextColor(ColorStateList.valueOf(Color.WHITE));

        if (tabsStyle == TABS_BOTTOM) {
            linearLayout.addView(mainLayout);
            linearLayout.addView(bottomNavigationView);
        } else {
            linearLayout.addView(bottomNavigationView);
            linearLayout.addView(mainLayout);
        }

        bottomNavigationView.setOnNavigationItemSelectedListener((@NonNull MenuItem item) -> {
            int id = item.getItemId();
            index = id;
            tabs.get(index).bind(CastleTabNavigator.this, mainLayout);

            return true;
        });
    }

    public void addTab(String screenType, String title) {
        tabs.add(CastleNavigator.screenForType(screenType));

        Menu menu = bottomNavigationView.getMenu();
        menu.add(Menu.NONE, tabs.size() - 1, Menu.NONE, title);
        //.setIcon(R.drawable.ic_action_one);
    }

    @Override
    public void bindViews(FrameLayout layout) {
        super.bindViews(layout);

        setContentView(linearLayout);
        tabs.get(index).bind(this, mainLayout);
    }

    @Override
    public void destroyViews() {
        index = 0;
    }

    @Override
    public void destroy() {

    }

    @Override
    public void navigate(String screenName, String navigationScreenOptions) {

    }

    @Override
    public boolean handleBack() {
        CastleNavigator navigator = tabs.get(index).navigator();
        if (navigator != null) {
            return navigator.handleBack();
        }

        return false;
    }
}
