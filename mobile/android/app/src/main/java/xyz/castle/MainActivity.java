package xyz.castle;

import android.content.Context;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.zoontek.rnbootsplash.RNBootSplash;

import org.love2d.android.GameActivity;

import ghost.CoreGameActivity;

public class MainActivity extends NavigationActivity {

    private static final boolean SCENE_CREATOR_USE_PROD_SCENE_CREATOR = true;
    private static final String SCENE_CREATOR_DEV_URI = "http://192.168.1.146:8080/Client.lua";
    public static final String SCENE_CREATOR_API_VERSION = "103";

    public static CoreGameActivity gameActivity;
    public static FrameLayout gameLayout;

    public static boolean isPopoverOpen = false;

    public static ViewGroup recreateGameLayout(Context context) {
        gameLayout = new FrameLayout(context);
        gameLayout.addView(gameActivity.getView());

        return gameLayout;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // https://github.com/software-mansion/react-native-screens/issues/17#issuecomment-424704067
        super.onCreate(null);

        //GameActivity.ghostRootUri = SCENE_CREATOR_USE_PROD_SCENE_CREATOR ? "" : SCENE_CREATOR_DEV_URI;
        //GameActivity.sceneCreatorApiVersion = SCENE_CREATOR_API_VERSION;
        GameActivity.setMetricsFromDisplay(getWindowManager().getDefaultDisplay());

        // Test with "don't keep activities" if you cahnge this
        if (gameActivity == null) {
            gameActivity = new CoreGameActivity();
            gameActivity.setContexts(this, this.getApplicationContext());
            gameActivity.loadLibraries();

            gameActivity.resetNative();
            gameActivity.startNative();
            gameActivity.resume();
        }

        RNBootSplash.init(R.drawable.splash_screen, this);
    }

    @Override
    protected void onResume() {
        super.onResume();
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
