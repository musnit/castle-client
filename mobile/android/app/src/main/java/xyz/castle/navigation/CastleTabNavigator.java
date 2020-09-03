package xyz.castle.navigation;

import android.app.Activity;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.FrameLayout;

import com.google.android.material.bottomnavigation.BottomNavigationView;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.NonNull;
import xyz.castle.R;

public class CastleTabNavigator extends CastleNavigator {

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
    }

    @Override
    public void bindViews(Activity activity, FrameLayout layout) {
        super.bindViews(activity, layout);

        setContentView(R.layout.tab_navigation);

        FrameLayout mainLayout = findViewById(R.id.main_frame_layout);

        BottomNavigationView bottomNavigationView = findViewById(R.id.bottom_navigation);
        Menu menu = bottomNavigationView.getMenu();

        for (int i = 0; i < tabs.size(); i++) {
            menu.add(Menu.NONE, i, Menu.NONE, tabs.get(i).title);
            //.setIcon(R.drawable.ic_action_one);
        }

        tabs.get(0).castleNavigationScreen.bind(activity, mainLayout);

        bottomNavigationView.setOnNavigationItemSelectedListener(new BottomNavigationView.OnNavigationItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(@NonNull MenuItem item) {

                int id = item.getItemId();
                tabs.get(id).castleNavigationScreen.bind(activity, mainLayout);

                return true;
            }
        });
    }

    @Override
    public void destroyViews() {

    }

    @Override
    public void destroy() {

    }
}
