package xyz.castle.navigation;

import android.content.Context;
import android.os.Bundle;
import android.view.MotionEvent;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.JSTouchDispatcher;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;

public class CastleReactView extends RNGestureHandlerEnabledRootView {

    private final ReactInstanceManager reactInstanceManager;
    private final String componentId;
    private final String componentName;
    private boolean isAttachedToReactInstance = false;
    private final JSTouchDispatcher jsTouchDispatcher;

    public CastleReactView(Context context, ReactInstanceManager reactInstanceManager, String componentId, String componentName) {
        super(context);
        this.reactInstanceManager = reactInstanceManager;
        this.componentId = componentId;
        this.componentName = componentName;
        jsTouchDispatcher = new JSTouchDispatcher(this);
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        start();
    }

    public void start() {
        if (isAttachedToReactInstance) return;
        isAttachedToReactInstance = true;
        final Bundle opts = new Bundle();
        opts.putString("componentId", componentId);
        startReactApplication(reactInstanceManager, componentName, opts);
    }

    //@Override
    public boolean isReady() {
        return isAttachedToReactInstance;
    }

    //@Override
    public void destroy() {
        unmountReactApplication();
    }

    //@Override
    public void dispatchTouchEventToJs(MotionEvent event) {
        jsTouchDispatcher.handleTouchEvent(event, getEventDispatcher());
    }

    //@Override
    public boolean isRendered() {
        return getChildCount() >= 1;
    }

    public EventDispatcher getEventDispatcher() {
        ReactContext reactContext = reactInstanceManager.getCurrentReactContext();
        return reactContext == null ? null : reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
    }
}
