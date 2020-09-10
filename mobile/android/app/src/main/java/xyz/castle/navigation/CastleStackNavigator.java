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
        screens.get(index).bind(this, layout, navigationWidth, navigationHeight);
    }

    @Override
    public void bindViews(FrameLayout layout, int navigationWidth, int navigationHeight) {
        super.bindViews(layout, navigationWidth, navigationHeight);
        bindCurrentScreen();
    }

    @Override
    public void destroyViews() {
        index = 0;

        for (int i = 1; i < screens.size(); i++) {
            screens.remove(i).destroy();
        }
    }

    @Override
    public void destroy() {
        for (int i = 0; i < screens.size(); i++) {
            screens.get(i).destroy();
        }
    }

    @Override
    public void navigate(String screenType, String navigationScreenOptions) {
        // look in our stack to see if we have a screen of the same type already
        for (int i = screens.size() - 1; i >= 0; i--) {
            if (screens.get(i).screenType().equals(screenType)) {
                while (index > i) {
                    screens.remove(index).destroy();
                    index--;
                }

                screens.get(index).setNavigationScreenOptions(navigationScreenOptions);
                bindCurrentScreen();

                return;
            }
        }

        // if not, push it to the top of the stack
        CastleNavigationScreen.Instance instance = CastleNavigator.screenForType(screenType);
        instance.setNavigationScreenOptions(navigationScreenOptions);
        screens.add(instance);
        index = screens.size() - 1;
        bindCurrentScreen();
    }

    @Override
    public void navigatePush(String screenType, String navigationScreenOptions) {
        /*for (int i = 0; i < screens.size(); i++) {
            screens.get(i).destroy();
        }*/

        CastleNavigationScreen.Instance instance = CastleNavigator.screenForType(screenType);
        instance.setNavigationScreenOptions(navigationScreenOptions);
        screens.add(instance);
        index = screens.size() - 1;
        bindCurrentScreen();
    }

    @Override
    public boolean handleBack() {
        CastleNavigator navigator = screens.get(index).navigator();
        if (navigator != null && navigator.handleBack()) {
             return true;
        }

        if (index > 0) {
            screens.remove(index).destroy();
            index--;
            bindCurrentScreen();

            return true;
        }

        return false;
    }

    @Override
    public boolean popToTop() {
        CastleNavigator navigator = screens.get(index).navigator();
        if (navigator != null && navigator.popToTop()) {
            return true;
        }

        if (index > 0) {
            while (index > 0) {
                screens.remove(index).destroy();
                index--;
            }

            bindCurrentScreen();

            return true;
        }

        return false;
    }
}
