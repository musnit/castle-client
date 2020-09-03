package com.reactnativenavigation.react;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;

import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.FragmentActivity;
import xyz.castle.MainApplication;
import xyz.castle.navigation.CastleNavigationScreen;
import xyz.castle.navigation.CastleNavigator;
import xyz.castle.navigation.CastleStackNavigator;
import xyz.castle.navigation.CastleTabNavigator;

public class NavigationActivity extends FragmentActivity implements DefaultHardwareBackBtnHandler, PermissionAwareActivity, JsDevReloadHandler.ReloadListener {
    @Nullable
    private PermissionListener mPermissionListener;

    private CastleStackNavigator navigator;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (isFinishing()) {
            return;
        }

        getReactGateway().onActivityCreated(this);

        // Rn screens
        CastleNavigator.addScreenType(new CastleNavigationScreen("NewestDecks", "NewestDecks"));
        CastleNavigator.addScreenType(new CastleNavigationScreen("ProfileScreen", "ProfileScreen"));
        CastleNavigator.addScreenType(new CastleNavigationScreen("PlayDeck", "PlayDeckScreen"));


        CastleNavigator.addScreenType(new CastleNavigationScreen("Recent", new CastleStackNavigator(this, "NewestDecks")));
        CastleNavigator.addScreenType(new CastleNavigationScreen("History", new CastleStackNavigator(this, "NewestDecks")));
        CastleNavigator.addScreenType(new CastleNavigationScreen("RootTabScreen", (Activity activity) -> {
            CastleTabNavigator homeNavigator = new CastleTabNavigator(activity, CastleTabNavigator.TABS_TOP);
            homeNavigator.addTab("Recent", "Recent");
            homeNavigator.addTab("History", "History");
            return homeNavigator;
        }));

        CastleNavigator.addScreenType(new CastleNavigationScreen("LoggedInRoot", (Activity activity) -> {
            CastleTabNavigator nav = new CastleTabNavigator(this, CastleTabNavigator.TABS_BOTTOM);
            nav.addTab("RootTabScreen", "Home");
            nav.addTab("ProfileScreen", "Profile");
            return nav;
        }));

        navigator = new CastleStackNavigator(this, "LoggedInRoot");
        navigator.setId("LoggedInRoot");
        navigator.bindViews(null);
    }

    @Override
    public void onPostCreate(@Nullable Bundle savedInstanceState) {
        super.onPostCreate(savedInstanceState);
        //navigator.setContentLayout(findViewById(android.R.id.content));
    }

    @Override
    protected void onResume() {
        super.onResume();
        getReactGateway().onActivityResumed(this);
    }

    @Override
    public void onNewIntent(Intent intent) {
        if (!getReactGateway().onNewIntent(intent)) {
            super.onNewIntent(intent);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        getReactGateway().onActivityPaused(this);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (navigator != null) {
            navigator.destroy();
        }
        getReactGateway().onActivityDestroyed(this);
    }

    @Override
    public void invokeDefaultOnBackPressed() {
        if (!navigator.handleBack()) {
            super.onBackPressed();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        getReactGateway().onActivityResult(this, requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        getReactGateway().onBackPressed();
    }

    @Override
    public boolean onKeyUp(final int keyCode, final KeyEvent event) {
        return getReactGateway().onKeyUp(keyCode) || super.onKeyUp(keyCode, event);
    }

    public ReactGateway getReactGateway() {
        return app().getReactGateway();
    }

    private MainApplication app() {
        return (MainApplication) getApplication();
    }

    /*public Navigator getNavigator() {
        return navigator;
    }*/

    @TargetApi(Build.VERSION_CODES.M)
    public void requestPermissions(String[] permissions, int requestCode, PermissionListener listener) {
        mPermissionListener = listener;
        requestPermissions(permissions, requestCode);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        //NavigationApplication.instance.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (mPermissionListener != null && mPermissionListener.onRequestPermissionsResult(requestCode, permissions, grantResults)) {
            mPermissionListener = null;
        }
    }

    @Override
    public void onReload() {
        navigator.destroyViews();
    }

    public void onCatalystInstanceDestroy() {
        runOnUiThread(() -> navigator.destroyViews());
    }
}
