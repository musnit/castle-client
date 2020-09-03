package xyz.castle.navigation;

import android.app.Activity;
import android.view.View;
import android.widget.FrameLayout;

import androidx.annotation.IdRes;
import androidx.annotation.LayoutRes;

public abstract class CastleNavigator {
    protected Activity activity;
    protected FrameLayout layout;

    public void setContentView(@LayoutRes int layoutResID) {
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

    public void bindViews(Activity activity, FrameLayout layout) {
        this.activity = activity;
        this.layout = layout;
    }

    abstract public void destroyViews();

    abstract public void destroy();

    public boolean handleBack() {
        return false;
    }
}
