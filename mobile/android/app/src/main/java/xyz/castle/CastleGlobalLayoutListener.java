// Copyright 2015-present 650 Industries. All rights reserved.

package xyz.castle;

import android.app.Activity;
import android.graphics.Rect;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;

import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.PixelUtil;

import org.greenrobot.eventbus.EventBus;

public class CastleGlobalLayoutListener implements ViewTreeObserver.OnGlobalLayoutListener {

    private static CastleGlobalLayoutListener listener = null;

    public static void createInstance(Activity activity) {
        listener = new CastleGlobalLayoutListener(activity);
    }

    public static CastleGlobalLayoutListener getInstance() {
        return listener;
    }

    private final Rect mVisibleViewArea;
    private final int mMinKeyboardHeightDetected;

    private Activity activity;
    private int mKeyboardHeight = 0;

    public CastleGlobalLayoutListener(Activity activity) {
        this.activity = activity;
        DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(activity.getApplicationContext());
        mVisibleViewArea = new Rect();
        mMinKeyboardHeightDetected = (int) PixelUtil.toPixelFromDIP(60);
    }

    @Override
    public void onGlobalLayout() {
        checkForKeyboardEvents();
    }

    public static class ShowKeyboardEvent {
        public final int height;
        public final int visibleAreaHeight;

        protected ShowKeyboardEvent(int height, int visibleAreaHeight) {
            this.height = height;
            this.visibleAreaHeight = visibleAreaHeight;
        }
    }

    public static class HideKeyboardEvent {
    }

    private void checkForKeyboardEvents() {
        final ViewGroup viewGroup = ViewUtils.getActivityView(activity);
        if (viewGroup == null) {
            return;
        }

        viewGroup.getWindowVisibleDisplayFrame(mVisibleViewArea);
        final int heightDiff =
                DisplayMetricsHolder.getWindowDisplayMetrics().heightPixels - mVisibleViewArea.bottom;

        boolean isKeyboardShowingOrKeyboardHeightChanged =
                mKeyboardHeight != heightDiff && heightDiff > mMinKeyboardHeightDetected;
        if (isKeyboardShowingOrKeyboardHeightChanged) {
            mKeyboardHeight = heightDiff;
            EventBus.getDefault().post(new ShowKeyboardEvent(mKeyboardHeight, mVisibleViewArea.bottom));
            return;
        }

        boolean isKeyboardHidden = mKeyboardHeight != 0 && heightDiff <= mMinKeyboardHeightDetected;
        if (isKeyboardHidden) {
            mKeyboardHeight = 0;
            EventBus.getDefault().post(new HideKeyboardEvent());
        }
    }
}