package xyz.castle.navigation;

import android.app.Activity;
import android.widget.FrameLayout;

public class CastleSwapNavigator extends CastleNavigator {

    CastleNavigationScreen.Instance screen;

    public CastleSwapNavigator(Activity activity, String screenType) {
        super(activity);

        screen = CastleNavigator.screenForType(screenType);
    }

    private void bindCurrentScreen() {
        screen.bind(this, layout);
    }

    @Override
    public void bindViews(FrameLayout layout) {
        super.bindViews(layout);
        bindCurrentScreen();
    }

    @Override
    public void destroyViews() {

    }

    @Override
    public void destroy() {

    }

    @Override
    public void navigate(String screenName, String navigationScreenOptions) {
        screen = CastleNavigator.screenForType(screenName);
        screen.setNavigationScreenOptions(navigationScreenOptions);
        bindCurrentScreen();
    }

    @Override
    public boolean handleBack() {
        CastleNavigator navigator = screen.navigator();
        if (navigator != null) {
            return navigator.handleBack();
        }

        return false;
    }
}
