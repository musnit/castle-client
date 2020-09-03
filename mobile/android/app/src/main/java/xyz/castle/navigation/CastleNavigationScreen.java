package xyz.castle.navigation;

import android.app.Activity;
import android.view.View;
import android.widget.FrameLayout;

public class CastleNavigationScreen {

    public interface NavigatorFactory {
        CastleNavigator inflate();
    }

    public interface NativeViewFactory {
        View inflate();
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

    public CastleNavigationScreen(NativeViewFactory nativeViewFactory) {
        this.nativeViewFactory = nativeViewFactory;
    }

    public void bind(Activity activity, FrameLayout layout) {
        if (reactComponentName != null) {
            if (castleReactView == null) {
                castleReactView = new CastleReactView(activity, reactComponentName);
            }

            if (layout == null) {
                activity.setContentView(castleReactView);
            } else {
                layout.removeAllViews();
                layout.addView(castleReactView);
            }
        } else if (navigatorFactory != null ){
            if (navigator == null) {
                navigator = navigatorFactory.inflate();
            }

            navigator.bindViews(activity, layout);
        } else {
            if (nativeView == null) {
                nativeView = nativeViewFactory.inflate();
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
