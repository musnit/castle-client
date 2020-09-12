package xyz.castle.navigation;

import android.app.Activity;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.widget.FrameLayout;

public class CastleNavigationScreen {

    public interface NavigatorFactory {
        CastleNavigator inflate(Activity activity);
    }

    public interface NativeViewFactory {
        View inflate(Activity activity);
    }

    private final String screenType;

    private final String reactComponentName;

    private final NavigatorFactory navigatorFactory;

    private final NativeViewFactory nativeViewFactory;

    public CastleNavigationScreen(String screenType, String reactComponentName) {
        this.screenType = screenType;
        this.reactComponentName = reactComponentName;
        this.navigatorFactory = null;
        this.nativeViewFactory = null;
    }

    public CastleNavigationScreen(String screenType, NavigatorFactory navigatorFactory) {
        this.screenType = screenType;
        this.reactComponentName = null;
        this.navigatorFactory = navigatorFactory;
        this.nativeViewFactory = null;
    }

    public CastleNavigationScreen(String screenType, NativeViewFactory nativeViewFactory) {
        this.screenType = screenType;
        this.reactComponentName = null;
        this.navigatorFactory = null;
        this.nativeViewFactory = nativeViewFactory;
    }

    public void register() {
        CastleNavigator.addScreenType(this);
    }

    public String screenType() {
        return screenType;
    }

    public Instance newInstance() {
        return new Instance();
    }

    private static int gId = 0;

    public class Instance {
        private String id;
        private CastleReactView castleReactView;
        private CastleNavigator navigator;
        private View nativeView;
        private String navigationScreenOptions;

        public Instance() {
            id = "castle-navigator-" + gId++;
        }

        public CastleNavigator navigator() {
            return navigator;
        }

        public String screenType() {
            return screenType;
        }

        public void setNavigationScreenOptions(final String navigationScreenOptions) {
            this.navigationScreenOptions = navigationScreenOptions;

            if (castleReactView != null && navigationScreenOptions != null) {
                castleReactView.sendNewProp("navigationScreenOptions", navigationScreenOptions);
            }
        }

        public void destroy() {
            if (castleReactView != null) {
                castleReactView.destroy();
            }

            if (navigator != null) {
                navigator.destroy();
            }

            castleReactView = null;
            navigator = null;
            nativeView = null;
        }

        public void bind(CastleNavigator castleNavigator, FrameLayout layout, int navigationWidth, int navigationHeight, int stackDepth) {
            Activity activity = castleNavigator.activity;

            View viewToAdd = null;

            if (reactComponentName != null) {
                if (castleReactView == null) {
                    castleReactView = new CastleReactView(activity, id, reactComponentName);
                    castleReactView.addReactOpt("navigatorId", castleNavigator.id);
                    castleReactView.addReactOpt("stackDepth", stackDepth);

                    if (navigationScreenOptions != null) {
                        castleReactView.addReactOpt("navigationScreenOptions", navigationScreenOptions);
                    }
                }

                castleReactView.setNavigationSize(navigationWidth, navigationHeight);
                viewToAdd = castleReactView;
            } else if (navigatorFactory != null || navigator != null){
                if (navigator == null) {
                    navigator = navigatorFactory.inflate(activity);
                }

                navigator.bindViews(layout, navigationWidth, navigationHeight);
            } else {
                if (nativeView == null) {
                    nativeView = nativeViewFactory.inflate(activity);
                }

                viewToAdd = nativeView;
            }

            if (viewToAdd != null) {
                ViewParent parent = viewToAdd.getParent();
                if (parent instanceof ViewGroup) {
                    ((ViewGroup) parent).removeView(viewToAdd);
                }

                if (layout == null) {
                    activity.setContentView(viewToAdd);
                } else {
                    layout.removeAllViews();
                    viewToAdd.setLayoutParams(new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                    layout.addView(viewToAdd);
                }
            }
        }
    }
}
