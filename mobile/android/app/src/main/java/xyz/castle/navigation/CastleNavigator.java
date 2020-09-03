package xyz.castle.navigation;

import android.app.Activity;
import android.view.View;
import android.widget.FrameLayout;

import java.util.WeakHashMap;

import androidx.annotation.IdRes;
import androidx.annotation.LayoutRes;

public abstract class CastleNavigator {
    protected final Activity activity;
    protected FrameLayout layout;

    private boolean hasCalledBindViews = false;

    private static int gId = 0;
    public final String id;

    private static WeakHashMap<String, CastleNavigator> idToNavigator = new WeakHashMap<>();

    public CastleNavigator(Activity activity) {
        this.activity = activity;
        id = "castle-navigator-" + gId++;

        idToNavigator.put(id, this);
    }

    public static CastleNavigator castleNavigatorForId(String id) {
        return idToNavigator.get(id);
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

    public void bindViews(FrameLayout layout) {
        this.hasCalledBindViews = true;
        this.layout = layout;
    }

    abstract public void destroyViews();

    abstract public void destroy();

    abstract public void navigate(String screenName, String opts);

    abstract public boolean handleBack();
}
