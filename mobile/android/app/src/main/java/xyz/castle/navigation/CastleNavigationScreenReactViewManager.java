// Copyright 2015-present 650 Industries. All rights reserved.

package xyz.castle.navigation;

import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import javax.annotation.Nullable;

import androidx.annotation.NonNull;

public class CastleNavigationScreenReactViewManager extends SimpleViewManager<ViewGroup> {

    private FrameLayout mLayout;
    private String mNavigatorId = null;
    private String mScreenType = null;

    @NonNull
    @Override
    public String getName() {
        return "CastleNavigationScreen";
    }

    @NonNull
    @Override
    protected ViewGroup createViewInstance(@NonNull ThemedReactContext reactContext) {
        mLayout = new FrameLayout(reactContext);
        mLayout.setLayoutParams(new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        return mLayout;
    }

    private void update() {
        if (mNavigatorId == null || mScreenType == null) {
            return;
        }

        CastleNavigationScreen.Instance instance = CastleNavigator.screenForType(mScreenType);
        if (instance == null) {
            return;
        }

        CastleNavigator navigator = CastleNavigator.castleNavigatorForId(mNavigatorId);
        if (navigator == null) {
            return;
        }

        instance.bind(navigator, mLayout, 0, 0, 0);
    }

    @ReactProp(name = "navigatorId")
    public void setNavigatorId(ViewGroup view, @Nullable String navigatorId) {
        if (navigatorId.equals(mNavigatorId)) {
            return;
        }

        mNavigatorId = navigatorId;
        update();
    }

    @ReactProp(name = "screenType")
    public void setType(ViewGroup view, @Nullable String screenType) {
        if (screenType.equals(mScreenType)) {
            return;
        }

        mScreenType = screenType;
        update();
    }
}
