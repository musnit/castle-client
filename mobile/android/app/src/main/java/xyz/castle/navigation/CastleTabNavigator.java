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
import xyz.castle.R;
import xyz.castle.ViewUtils;

public class CastleTabNavigator extends CastleNavigator {

    private LinearLayout linearLayout;
    private FrameLayout mainLayout;
    private BottomNavigationView bottomNavigationView;

    public CastleTabNavigator(Activity activity) {
        super(activity);

        linearLayout = new LinearLayout(activity);
        linearLayout.setOrientation(LinearLayout.VERTICAL);

        mainLayout = new FrameLayout(activity);
        mainLayout.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        linearLayout.addView(mainLayout);

        bottomNavigationView = new BottomNavigationView(activity);
        bottomNavigationView.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewUtils.dpToPx(50)));
        bottomNavigationView.setBackgroundColor(Color.BLACK);
        bottomNavigationView.setItemTextColor(ColorStateList.valueOf(Color.WHITE));
        linearLayout.addView(bottomNavigationView);

        bottomNavigationView.setOnNavigationItemSelectedListener((@NonNull MenuItem item) -> {
            int id = item.getItemId();
            tabs.get(id).castleNavigationScreen.bind(activity, mainLayout);

            return true;
        });
    }

    private class Tab {
        String title;
        CastleNavigationScreen castleNavigationScreen;

        Tab(String title, CastleNavigationScreen castleNavigationScreen) {
            this.title = title;
            this.castleNavigationScreen = castleNavigationScreen;
        }
    }

    List<Tab> tabs = new ArrayList<>();

    public void addTab(String title, CastleNavigationScreen castleNavigationScreen) {
        tabs.add(new Tab(title, castleNavigationScreen));

        Menu menu = bottomNavigationView.getMenu();
        menu.add(Menu.NONE, tabs.size() - 1, Menu.NONE, title);
        //.setIcon(R.drawable.ic_action_one);
    }

    @Override
    public void bindViews(FrameLayout layout) {
        super.bindViews(layout);

        setContentView(linearLayout);
        tabs.get(0).castleNavigationScreen.bind(activity, mainLayout);
    }

    @Override
    public void destroyViews() {

    }

    @Override
    public void destroy() {

    }
}
