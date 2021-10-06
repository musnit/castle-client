// Copyright 2015-present 650 Industries. All rights reserved.

package ghost;

import org.libsdl.app.SDLActivity;

public class CoreGameActivity extends SDLActivity {

    private boolean pausedState = false;
    public void setPaused(boolean paused) {
        if (paused == pausedState ){
            return;
        }

        pausedState = paused;

        NativeState newNativeState = paused? NativeState.PAUSED : NativeState.RESUMED;
        if (mNextNativeState != newNativeState) {
            mNextNativeState = newNativeState;
            SDLActivity.handleNativeState();
        }
    }

    @Override
    protected String[] getLibraries() {
        return new String[]{
                "c++_shared",
                "castle-core",
        };
    }

    public static double ghostScreenScaling = 1;

    public static double getGhostScreenScaling() {
        return ghostScreenScaling;
    }

    public static boolean ghostApplyScreenScaling = true;

    public static boolean getGhostApplyScreenScaling() {
        return ghostApplyScreenScaling;
    }

    public static native void castleCoreViewSetInitialParams(String s);
}
