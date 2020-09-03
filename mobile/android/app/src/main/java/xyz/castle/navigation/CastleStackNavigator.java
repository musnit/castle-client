package xyz.castle.navigation;

import android.app.Activity;
import android.widget.FrameLayout;

import java.util.ArrayList;
import java.util.List;

public class CastleStackNavigator extends CastleNavigator {

    private class Screen {
        String title;
        CastleNavigationScreen castleNavigationScreen;

        Screen(String title, CastleNavigationScreen castleNavigationScreen) {
            this.title = title;
            this.castleNavigationScreen = castleNavigationScreen;
        }
    }

    List<Screen> screens = new ArrayList<>();

    private int index = 0;

    public CastleStackNavigator(Activity activity) {
        super(activity);
    }

    public CastleStackNavigator(Activity activity, String reactComponentName) {
        this(activity);

        addScreen(reactComponentName, new CastleNavigationScreen(reactComponentName));
    }

    public void addScreen(String title, CastleNavigationScreen castleNavigationScreen) {
        screens.add(new Screen(title, castleNavigationScreen));
    }

    @Override
    public void bindViews(FrameLayout layout) {
        super.bindViews(layout);

        screens.get(index).castleNavigationScreen.bind(this, layout);
    }

    @Override
    public void destroyViews() {
        index = 0;

        for (int i = 1; i < screens.size(); i++) {
            screens.remove(i);
        }
    }

    @Override
    public void destroy() {

    }

    @Override
    public void navigate(String screenName, String opts) {

    }

    @Override
    public boolean handleBack() {
        CastleNavigator navigator = screens.get(index).castleNavigationScreen.navigator();
        if (navigator != null && navigator.handleBack()) {
             return true;
        }

        if (index > 0) {
            screens.remove(index);
            index--;
            screens.get(index).castleNavigationScreen.bind(this, layout);

            return true;
        }

        return false;
    }
}
