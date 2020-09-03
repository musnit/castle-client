package xyz.castle.navigation;

import android.app.Activity;
import android.view.View;
import android.widget.FrameLayout;

public class CastleNavigationScreen {

    public interface NavigatorFactory {
        CastleNavigator inflate(Activity activity);
    }

    public interface NativeViewFactory {
        View inflate(Activity activity);
    }

    private String reactComponentName;
    private CastleReactView castleReactView;

    private NavigatorFactory navigatorFactory;
    private CastleNavigator navigator;

    private NativeViewFactory nativeViewFactory;
    private View nativeView;

    public CastleNavigationScreen(String reactComponentName) {
        this.reactComponentName = reactComponentName;
    }

    public CastleNavigationScreen(NavigatorFactory navigatorFactory) {
        this.navigatorFactory = navigatorFactory;
    }

    public CastleNavigationScreen(CastleNavigator navigator) {
        this.navigator = navigator;
    }

    public CastleNavigationScreen(NativeViewFactory nativeViewFactory) {
        this.nativeViewFactory = nativeViewFactory;
    }

    public CastleNavigator navigator() {
        return navigator;
    }

    public void bind(CastleNavigator castleNavigator, FrameLayout layout) {
        Activity activity = castleNavigator.activity;

        if (reactComponentName != null) {
            if (castleReactView == null) {
                castleReactView = new CastleReactView(activity, reactComponentName);
                castleReactView.addReactOpt("navigatorId", castleNavigator.id);
            }

            if (layout == null) {
                activity.setContentView(castleReactView);
            } else {
                layout.removeAllViews();
                layout.addView(castleReactView);
            }
        } else if (navigatorFactory != null || navigator != null){
            if (navigator == null) {
                navigator = navigatorFactory.inflate(activity);
            }

            navigator.bindViews(layout);
        } else {
            if (nativeView == null) {
                nativeView = nativeViewFactory.inflate(activity);
            }

            if (layout == null) {
                activity.setContentView(nativeView);
            } else {
                layout.removeAllViews();
                layout.addView(nativeView);
            }
        }
    }
}
