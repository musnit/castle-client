package xyz.castle.navigation;

import android.app.Activity;
import android.graphics.Color;
import android.view.View;
import android.widget.FrameLayout;

import java.util.HashMap;
import java.util.Map;
import java.util.WeakHashMap;

import androidx.annotation.IdRes;
import androidx.annotation.LayoutRes;

public abstract class CastleNavigator {
    protected final Activity activity;
    protected FrameLayout layout;
    protected int navigationWidth;
    protected int navigationHeight;

    private boolean hasCalledBindViews = false;

    private static int gId = 0;
    public String id;

    private static WeakHashMap<String, CastleNavigator> idToNavigator = new WeakHashMap<>();
    private static Map<String, CastleNavigationScreen> screenTypeToScreen = new HashMap<>();

    public CastleNavigator(Activity activity) {
        this.activity = activity;
        id = "castle-navigator-" + gId++;

        idToNavigator.put(id, this);
    }

    public void setId(final String id) {
        idToNavigator.remove(id);
        this.id = id;
        idToNavigator.put(id, this);
    }

    public static CastleNavigator castleNavigatorForId(String id) {
        return idToNavigator.get(id);
    }

    public static void addScreenType(CastleNavigationScreen screen) {
        screenTypeToScreen.put(screen.screenType(), screen);
    }

    public static CastleNavigationScreen.Instance screenForType(String screenType) {
        CastleNavigationScreen castleNavigationScreen = screenTypeToScreen.get(screenType);

        if (castleNavigationScreen == null) {
            castleNavigationScreen = new CastleNavigationScreen(screenType, screenType);
        }

        return castleNavigationScreen.newInstance();
    }

    public void setContentView(View view) {
        if (!hasCalledBindViews) {
            throw new Error("setContentView must be called in bindViews");
        }

        if (layout == null) {
            activity.setContentView(view);
        } else {
            layout.removeAllViews();
            layout.addView(view);
        }
    }

    public void enableOverlay() {
        if (hasCalledBindViews) {
            View view = new View(activity);
            view.setBackgroundColor(Color.BLACK);
            setContentView(view);
        }
    }

    public void disableOverlay() {
        bindViews(layout, navigationWidth, navigationHeight);
    }

    public void setContentView(@LayoutRes int layoutResID) {
        if (!hasCalledBindViews) {
            throw new Error("setContentView must be called in bindViews");
        }

        if (layout == null) {
            activity.setContentView(layoutResID);
        } else {
            layout.removeAllViews();
            activity.getLayoutInflater().inflate(layoutResID, layout);
        }
    }

    public <T extends View> T findViewById(@IdRes int id) {
        if (layout == null) {
            return activity.findViewById(id);
        } else {
            return layout.findViewById(id);
        }
    }

    public void bindViews(FrameLayout layout, int navigationWidth, int navigationHeight) {
        this.hasCalledBindViews = true;
        this.layout = layout;
        this.navigationWidth = navigationWidth;
        this.navigationHeight = navigationHeight;
    }

    abstract public void destroyViews();

    abstract public void destroy();

    public void navigate(String screenType) {
        navigate(screenType, null);
    }

    abstract public void navigate(String screenType, String navigationScreenOptions);

    abstract public void navigatePush(String screenType, String navigationScreenOptions);

    abstract public boolean handleBack();

    abstract public boolean popToTop();
}
