package games.castle;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.KeyEvent;
import android.widget.FrameLayout;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;

import org.love2d.android.GameActivity;

public class MainActivity extends ReactActivity {

    private static final boolean SCENE_CREATOR_USE_PROD_SCENE_CREATOR = true;
    private static final String SCENE_CREATOR_DEV_URI = "http://192.168.1.146:8080/Client.lua";


    private static GameActivity gameActivity;
    public static FrameLayout gameLayout;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        GameActivity.ghostRootUri = SCENE_CREATOR_USE_PROD_SCENE_CREATOR ? "" : SCENE_CREATOR_DEV_URI;
        gameActivity = new GameActivity();
        gameActivity.setContexts(this, getApplicationContext());
        gameActivity.handleIntent(new Intent(this, GameActivity.class));
        GameActivity.setMetricsFromDisplay(getWindowManager().getDefaultDisplay());
        gameActivity.loadLibraries();
        gameActivity.resetNative();
        gameActivity.startNative();
        gameActivity.resume();

        gameLayout = new FrameLayout(this);
        gameLayout.addView(gameActivity.getView());
    }

    // Name of main component for React Native
    @Override
    protected String getMainComponentName() {
        return "Castle";
    }

    // For 'react-native-gesture-handler'
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegate(this, getMainComponentName()) {
            @Override
            protected ReactRootView createRootView() {
                return new RNGestureHandlerEnabledRootView(MainActivity.this);
            }
        };
    }

    // System behavior for volume, camera, zoom buttons
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int keyCode = event.getKeyCode();
        if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN ||
                keyCode == KeyEvent.KEYCODE_VOLUME_UP ||
                keyCode == KeyEvent.KEYCODE_CAMERA ||
                keyCode == KeyEvent.KEYCODE_ZOOM_IN ||
                keyCode == KeyEvent.KEYCODE_ZOOM_OUT) {
            return false;
        }
        return super.dispatchKeyEvent(event);
    }

    // Called from JNI by Love's code
    public void setImmersiveMode(boolean immersive_mode) {
    }
    public boolean getImmersiveMode() {
        return false;
    }
}
