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
        screen.bind(this, layout, navigationWidth, navigationHeight, 0);
    }

    @Override
    public void bindViews(FrameLayout layout, int navigationWidth, int navigationHeight) {
        super.bindViews(layout, navigationWidth, navigationHeight);
        bindCurrentScreen();
    }

    @Override
    public void destroyViews() {

    }

    @Override
    public void destroy() {

    }

    @Override
    public void navigate(String screenType, String navigationScreenOptions) {
        if (screen != null) {
            screen.destroy();
        }

        screen = CastleNavigator.screenForType(screenType);
        screen.setNavigationScreenOptions(navigationScreenOptions);
        bindCurrentScreen();
    }

    @Override
    public void navigatePush(String screenType, String navigationScreenOptions) {
        this.navigate(screenType, navigationScreenOptions);
    }

    @Override
    public boolean handleBack() {
        CastleNavigator navigator = screen.navigator();
        if (navigator != null) {
            return navigator.handleBack();
        }

        return false;
    }

    @Override
    public boolean popToTop() {
        CastleNavigator navigator = screen.navigator();
        if (navigator != null) {
            return navigator.popToTop();
        }

        return false;
    }
}
