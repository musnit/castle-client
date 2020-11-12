// Copyright 2015-present 650 Industries. All rights reserved.

package ghost;

import android.view.ViewGroup;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.ArrayList;
import java.util.List;

import javax.annotation.Nullable;

import androidx.annotation.NonNull;

public class CastleBottomSheetManager extends ViewGroupManager<CastleBottomSheet> {

    @NonNull
    @Override
    public String getName() {
        return "CastleBottomSheet";
    }

    @NonNull
    @Override
    protected CastleBottomSheet createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new CastleBottomSheet(reactContext, reactContext.getCurrentActivity());
    }

    @ReactProp(name = "viewId")
    public void setViewId(ViewGroup view, @Nullable int viewId) {
        ((CastleBottomSheet) view).setViewId(viewId);
    }

    @ReactProp(name = "isOpen")
    public void setIsOpen(ViewGroup view, @Nullable boolean isOpen) {
        ((CastleBottomSheet) view).setIsOpen(isOpen);
    }

    @ReactProp(name = "snapPoints")
    public void setSnapPoints(ViewGroup view, @Nullable ReadableArray snapPoints) {
        List<Integer> listSnapPoints = new ArrayList<>();
        for (int i = 0; i < snapPoints.size(); i++) {
            listSnapPoints.add(snapPoints.getInt(i));
        }
        ((CastleBottomSheet) view).setSnapPoints(listSnapPoints);
    }

    @ReactProp(name = "initialSnap")
    public void setInitialSnap(ViewGroup view, @Nullable int initialSnap) {
        ((CastleBottomSheet) view).setInitialSnap(initialSnap);
    }

    @ReactProp(name = "persistLastSnapWhenOpened")
    public void setPersistLastSnapWhenOpened(ViewGroup view, @Nullable boolean persistLastSnapWhenOpened) {
        ((CastleBottomSheet) view).setPersistLastSnapWhenOpened(persistLastSnapWhenOpened);
    }

    @ReactProp(name = "headerHeight")
    public void setHeaderHeight(ViewGroup view, @Nullable int headerHeight) {
        ((CastleBottomSheet) view).setHeaderHeight(headerHeight);
    }

    @ReactProp(name = "screenHeight")
    public void setScreenHeight(ViewGroup view, @Nullable int screenHeight) {
        ((CastleBottomSheet) view).setScreenHeight(screenHeight);
    }

    @ReactProp(name = "textInputHeight")
    public void setTextInputHeight(ViewGroup view, @Nullable int textInputHeight) {
        ((CastleBottomSheet) view).setTextInputHeight(textInputHeight);
    }

    /*
    @Override
    public void addView(CastleBottomSheet parent, View child, int index) {
    }*/
}
