package xyz.castle.navigation;

import android.app.Activity;
import android.widget.FrameLayout;

import java.util.ArrayList;
import java.util.List;

public class CastleStackNavigator extends CastleNavigator {

    List<CastleNavigationScreen.Instance> screens = new ArrayList<>();

    private int index = 0;

    public CastleStackNavigator(Activity activity) {
        super(activity);
    }

    public CastleStackNavigator(Activity activity, String screenType) {
        this(activity);

        screens.add(CastleNavigator.screenForType(screenType));
    }

    private void bindCurrentScreen() {
        screens.get(index).bind(this, layout);
    }

    @Override
    public void bindViews(FrameLayout layout) {
        super.bindViews(layout);
        bindCurrentScreen();
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
    public void navigate(String screenName, String navigationScreenOptions) {
        CastleNavigationScreen.Instance instance = CastleNavigator.screenForType(screenName);
        instance.setNavigationScreenOptions(navigationScreenOptions);
        screens.add(instance);
        index = screens.size() - 1;

        activity.runOnUiThread(() -> {
            bindCurrentScreen();
        });
    }

    @Override
    public boolean handleBack() {
        CastleNavigator navigator = screens.get(index).navigator();
        if (navigator != null && navigator.handleBack()) {
             return true;
        }

        if (index > 0) {
            screens.remove(index);
            index--;
            bindCurrentScreen();

            return true;
        }

        return false;
    }
}
