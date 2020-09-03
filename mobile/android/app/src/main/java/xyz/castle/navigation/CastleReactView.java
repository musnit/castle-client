package xyz.castle.navigation;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.view.MotionEvent;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.JSTouchDispatcher;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.reactnativenavigation.react.NavigationActivity;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;

import java.util.HashMap;
import java.util.Map;

public class CastleReactView extends RNGestureHandlerEnabledRootView {

    private final ReactInstanceManager reactInstanceManager;
    private final String componentId;
    private final String componentName;
    private boolean isAttachedToReactInstance = false;
    private final JSTouchDispatcher jsTouchDispatcher;
    private Map<String, String> options = new HashMap<>();

    public CastleReactView(Activity activity, String componentName) {
        this(activity, ((NavigationActivity) activity).getReactGateway().reactInstanceManager(), componentName, componentName);
    }

    public CastleReactView(Context context, ReactInstanceManager reactInstanceManager, String componentId, String componentName) {
        super(context);

        this.reactInstanceManager = reactInstanceManager;
        this.componentId = componentId;
        this.componentName = componentName;
        jsTouchDispatcher = new JSTouchDispatcher(this);
    }

    public void addReactOpt(final String key, final String value) {
        options.put(key, value);
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

        for (Map.Entry<String, String> entry : options.entrySet()) {
            opts.putString(entry.getKey(), entry.getValue());
        }

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
