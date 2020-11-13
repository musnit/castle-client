// Copyright 2015-present 650 Industries. All rights reserved.

package ghost;

import android.app.Activity;
import android.content.Context;
import android.graphics.Point;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.inputmethod.InputMethodManager;
import android.widget.LinearLayout;
import android.widget.ScrollView;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import org.greenrobot.eventbus.EventBus;
import org.greenrobot.eventbus.Subscribe;
import org.greenrobot.eventbus.ThreadMode;

import java.util.ArrayList;
import java.util.List;

import xyz.castle.CastleGlobalLayoutListener;
import xyz.castle.MainActivity;
import xyz.castle.NavigationActivity;
import xyz.castle.ViewUtils;

public class CastleBottomSheet extends LinearLayout {

    private static final int TOP_SNAP_POINT_PADDING = 20;

    private Activity activity;

    private int lastY;

    private float position = 100000;
    private boolean initialized = false;
    private Integer lastOpenSnap = null;
    private Integer minSnapPoint = 100000;

    private Integer viewId = null;
    private Boolean isOpen = null;
    private List<Integer> snapPoints = null;
    private List<Integer> screenSpaceSnapPoints = null;
    private Integer initialSnap = null;
    private Boolean persistLastSnapWhenOpened = null;
    private Integer headerHeight = null;
    private Integer screenHeight = null;
    private Integer textInputHeight = null;

    private Integer lastScrollY = null;

    public CastleBottomSheet(Context context, Activity activity) {
        super(context);
        this.activity = activity;

        setOrientation(VERTICAL);
        snapToPosition();
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();

        EventBus.getDefault().register(this);
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();

        EventBus.getDefault().unregister(this);
    }

    private ScrollView findScrollView(ViewGroup group) {
        for (int i = 0; i < group.getChildCount(); i++) {
            View child = group.getChildAt(i);
            if (child instanceof ScrollView) {
                return (ScrollView) child;
            } else if (child instanceof ViewGroup) {
                ScrollView result = findScrollView((ViewGroup) child);
                if (result != null) {
                    return result;
                }
            }
        }

        return null;
    }

    private void scrollToView(final ScrollView scrollViewParent, final View view) {
        // Get deepChild Offset
        Point childOffset = new Point();
        if (getDeepChildOffset(scrollViewParent, view.getParent(), view, childOffset)) {
            // Scroll to child.
            scrollViewParent.smoothScrollTo(0, childOffset.y);
        }
    }

    private boolean getDeepChildOffset(final ViewGroup mainParent, final ViewParent parent, final View child, final Point accumulatedOffset) {
        if (!(parent instanceof ViewGroup)) {
            return false;
        }

        ViewGroup parentGroup = (ViewGroup) parent;
        accumulatedOffset.x += child.getLeft();
        accumulatedOffset.y += child.getTop();
        if (parentGroup.equals(mainParent)) {
            return true;
        }
        return getDeepChildOffset(mainParent, parentGroup.getParent(), parentGroup, accumulatedOffset);
    }

    @Subscribe(threadMode = ThreadMode.MAIN)
    public void onShowKeyboardEvent(final CastleGlobalLayoutListener.ShowKeyboardEvent event) {
        if (!isReady() || !isOpen || MainActivity.isPopoverOpen) {
            return;
        }

        int[] locationOnScreen = new int[2];
        getLocationOnScreen(locationOnScreen);

        int positionDiff = locationOnScreen[1] - (int) position;
        int newPosition = event.visibleAreaHeight - positionDiff - headerHeight - textInputHeight;

        if (newPosition < position) {
            position = newPosition;
            snapToPosition();
        }

        View view = activity.getCurrentFocus();
        ScrollView scrollView = findScrollView(this);

        if (view != null && scrollView != null) {
            lastScrollY = scrollView.getScrollY();

            // Not sure why we need so much extra padding. Without the extra 100, a text input
            // on the last row will get hidden
            updateRNScrollViewPadding(event.height + 100);

            // have to wait until padding is updated
            ViewUtils.runOnUiThreadDelay(() -> {
                scrollToView(scrollView, view);
            }, 300);
        }
    }

    @Subscribe(threadMode = ThreadMode.MAIN)
    public void onHideKeyboardEvent(final CastleGlobalLayoutListener.HideKeyboardEvent event) {
        if (!isReady() || !isOpen || MainActivity.isPopoverOpen) {
            return;
        }

        if (lastOpenSnap != null) {
            position = screenSpaceSnapPoints.get(lastOpenSnap);
        } else {
            position = screenSpaceSnapPoints.get(initialSnap);
        }

        ScrollView scrollView = findScrollView(this);
        if (scrollView != null) {
            updateRNScrollViewPadding(0);

            if (lastScrollY != null) {
                // have to wait until padding is updated
                ViewUtils.runOnUiThreadDelay(() -> {
                    scrollView.scrollTo(0, lastScrollY);
                    lastScrollY = null;
                }, 300);
            }
        }

        snapToPosition();
    }

    private boolean isReady() {
        return viewId != null && isOpen != null && snapPoints != null && initialSnap != null && persistLastSnapWhenOpened != null && headerHeight != null && screenHeight != null && textInputHeight != null;
    }

    private boolean initialize() {
        if (initialized) {
            return true;
        }

        if (!isReady()) {
            return false;
        }

        initialized = true;

        updateSnapPoints();
        updateIsOpen();

        return false;
    }

    private void updateIsOpen() {
        if (isOpen) {
            if (persistLastSnapWhenOpened && lastOpenSnap != null) {
                position = screenSpaceSnapPoints.get(lastOpenSnap);
            } else {
                position = screenSpaceSnapPoints.get(initialSnap);
            }
        } else {
            position = screenHeight + ViewUtils.dpToPx(1);
            hideKeyboard();
        }

        animateToPosition();
    }

    private void updateSnapPoints() {
        screenSpaceSnapPoints = new ArrayList<>();
        minSnapPoint = 10000;

        for (int i = 0; i < snapPoints.size(); i++) {
            int point = screenHeight - ViewUtils.dpToPx(snapPoints.get(i));
            if (point < minSnapPoint) {
                minSnapPoint = point;
            }
            screenSpaceSnapPoints.add(point);
        }
    }

    public void setViewId(Integer viewId) {
        this.viewId = viewId;
        initialize();
    }

    public void setIsOpen(boolean isOpen) {
        this.isOpen = isOpen;

        if (initialize()) {
            updateIsOpen();
        }
    }

    public void setSnapPoints(List<Integer> snapPoints) {
        this.snapPoints = snapPoints;

        if (initialize()) {
            updateSnapPoints();
        }
    }

    public void setInitialSnap(int initialSnap) {
        this.initialSnap = initialSnap;
        initialize();
    }

    public void setPersistLastSnapWhenOpened(boolean persistLastSnapWhenOpened) {
        this.persistLastSnapWhenOpened = persistLastSnapWhenOpened;
        initialize();
    }

    public void setHeaderHeight(int headerHeight) {
        this.headerHeight = ViewUtils.dpToPx(headerHeight);
        initialize();
    }

    public void setScreenHeight(int screenHeight) {
        this.screenHeight = ViewUtils.dpToPx(screenHeight);

        if (initialize()) {
            updateSnapPoints();
        }
    }

    public void setTextInputHeight(int textInputHeight) {
        this.textInputHeight = ViewUtils.dpToPx(textInputHeight);
        initialize();
    }

    private void updateRNHeight(float height) {
        if (height < 10) {
            height = 10;
        }

        WritableMap payload = Arguments.createMap();
        payload.putInt("viewId", viewId);
        payload.putString("type", "height");
        payload.putInt("height", ViewUtils.pxToDp((int) height + 1));

        EventBus.getDefault().post(new NavigationActivity.RNEvent("CastleBottomSheetEvent", payload));
    }

    private void updateRNScrollViewPadding(float padding) {
        WritableMap payload = Arguments.createMap();
        payload.putInt("viewId", viewId);
        payload.putString("type", "scrollViewPadding");
        payload.putInt("padding", ViewUtils.pxToDp((int) padding));

        EventBus.getDefault().post(new NavigationActivity.RNEvent("CastleBottomSheetEvent", payload));
    }

    private void snapToPosition() {
        float pos = position;
        if (pos < minSnapPoint - TOP_SNAP_POINT_PADDING) {
            pos = minSnapPoint - TOP_SNAP_POINT_PADDING;
        }

        animate().y(pos).setDuration(0).start();
    }

    private void animateToPosition() {
        animate().y(position).setDuration(200).withEndAction(new Runnable() {
            @Override
            public void run() {
                updateRNHeight(screenHeight - position);
            }
        }).start();

        updateRNHeight(screenHeight);
    }

    private void animateToClosest() {
        if (!isReady()) {
            return;
        }

        float distance = 10000000;
        int idx = 0;

        for (int i = 0; i < screenSpaceSnapPoints.size(); i++) {
            float currentDistance = Math.abs(screenSpaceSnapPoints.get(i) - position);
            if (currentDistance < distance) {
                distance = currentDistance;
                idx = i;
            }
        }

        position = screenSpaceSnapPoints.get(idx);
        animateToPosition();
        lastOpenSnap = idx;
    }

    public void hideKeyboard() {
        View view = activity.getCurrentFocus();
        if (view != null) {
            InputMethodManager inputManager = (InputMethodManager) activity.getSystemService(Context.INPUT_METHOD_SERVICE);
            inputManager.hideSoftInputFromWindow(view.getWindowToken(), InputMethodManager.HIDE_NOT_ALWAYS);
        }
    }

    @Override
    public boolean onInterceptTouchEvent(MotionEvent event) {
        final int y = (int) event.getY();

        if (event.getAction() != MotionEvent.ACTION_DOWN) {
            return false;
        }

        if (y < headerHeight) {
            return true;
        } else {
            return false;
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        final int y = (int) event.getRawY();

        switch (event.getAction() & MotionEvent.ACTION_MASK) {
            case MotionEvent.ACTION_DOWN:
                updateRNHeight(screenHeight);
                lastY = y;
                break;
            case MotionEvent.ACTION_UP:
                animateToClosest();
                break;
            case MotionEvent.ACTION_POINTER_DOWN:
                break;
            case MotionEvent.ACTION_POINTER_UP:
                break;
            case MotionEvent.ACTION_MOVE:
                position += y - lastY;
                lastY = y;

                snapToPosition();
                break;
        }

        return true;
    }
}
