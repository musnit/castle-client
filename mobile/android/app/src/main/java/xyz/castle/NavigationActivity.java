package xyz.castle;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.nfc.NfcAdapter;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;

import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;
import com.reactnativenavigation.react.JsDevReloadHandler;
import com.reactnativenavigation.react.ReactGateway;

import org.greenrobot.eventbus.EventBus;
import org.greenrobot.eventbus.Subscribe;
import org.greenrobot.eventbus.ThreadMode;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.FragmentActivity;
import xyz.castle.api.API;
import xyz.castle.api.GraphQLOperation;
import xyz.castle.navigation.CastleNavigator;
import xyz.castle.views.FeedNativeView;
import xyz.castle.views.PlayDeckNativeView;
import xyz.castle.navigation.CastleNavigationScreen;
import xyz.castle.navigation.CastleStackNavigator;
import xyz.castle.navigation.CastleSwapNavigator;
import xyz.castle.navigation.CastleTabNavigator;

public class NavigationActivity extends FragmentActivity implements DefaultHardwareBackBtnHandler, PermissionAwareActivity, JsDevReloadHandler.ReloadListener {
    @Nullable
    private PermissionListener mPermissionListener;

    private CastleSwapNavigator navigator;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (isFinishing()) {
            return;
        }

        CastleSharedPreferences.initialize(this);
        getReactGateway().onActivityCreated(this);
        Fresco.initialize(this);

        new CastleNavigationScreen("Featured", (Activity activity) -> (new CastleStackNavigator(this, "FeaturedDecks"))).register();
        new CastleNavigationScreen("Newest", (Activity activity) -> (new CastleStackNavigator(this, "NewestDecks"))).register();
        new CastleNavigationScreen("Recent", (Activity activity) -> (new CastleStackNavigator(this, "RecentDecks"))).register();
        new CastleNavigationScreen("RootTabScreen", (Activity activity) -> {
            CastleTabNavigator homeNavigator = new CastleTabNavigator(activity, CastleTabNavigator.TABS_TOP);
            homeNavigator.addTab("Featured", "Featured", R.drawable.bottomtabs_browse);
            homeNavigator.addTab("Newest", "Newest", R.drawable.bottomtabs_browse);
            homeNavigator.addTab("Recent", "History", R.drawable.bottomtabs_browse);
            homeNavigator.doneAddingTabs();
            return homeNavigator;
        }).register();

        new CastleNavigationScreen("LoggedInRoot", (Activity activity) -> {
            CastleTabNavigator nav = new CastleTabNavigator(this, CastleTabNavigator.TABS_BOTTOM);
            nav.addTab("RootTabScreen", null, R.drawable.bottomtabs_browse);
            nav.addTab("CreateScreen", null, R.drawable.bottomtabs_create);
            nav.addTab("ProfileScreen", null, R.drawable.bottomtabs_profile);
            nav.doneAddingTabs();
            return nav;
        }).register();
        new CastleNavigationScreen("LoggedInRootStack", (Activity activity) -> {
            CastleStackNavigator nav = new CastleStackNavigator(this, "LoggedInRoot");
            nav.setId("LoggedInRootStack");
            return nav;
        }).register();

        new CastleNavigationScreen("TestScreen", (Activity activity) -> (new View(activity))).register();
        new CastleNavigationScreen("PlayDeckNative", (Activity activity) -> new PlayDeckNativeView(activity)).register();
        new CastleNavigationScreen("FeedNative", (Activity activity) -> new FeedNativeView(activity)).register();

        new CastleNavigationScreen("LoginStack", (Activity activity) -> (new CastleStackNavigator(this, "LoginScreen"))).register();

        String authToken = CastleSharedPreferences.getAuthToken();
        boolean isLoggedIn = authToken != null && authToken.length() > 0;

        navigator = new CastleSwapNavigator(this, isLoggedIn ? "LoggedInRootStack" : "LoginStack");
        navigator.setId("Root");
        navigator.bindViews(null, 0, 0);

        // TODO: should this be before bindViews? don't want feed to load if we're going to a deep link
        if (isLoggedIn) {
            handleDeepLink(getIntent());
        }
    }

    private void navigateToDeck(JSONObject deck) {
        try {
            JSONObject playDeckOptions = new JSONObject();
            JSONArray decksArray = new JSONArray();
            decksArray.put(deck);

            playDeckOptions.put("decks", decksArray);
            playDeckOptions.put("title", "Shared deck");

            CastleNavigator.castleNavigatorForId("LoggedInRootStack").navigate("PlayDeck", playDeckOptions.toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private void handleDeepLink(Intent intent) {
        String action = intent.getAction();
        Uri uri = intent.getData();

        if (uri != null
                && (Intent.ACTION_VIEW.equals(action)
                || NfcAdapter.ACTION_NDEF_DISCOVERED.equals(action))) {
            String path = uri.getPath();
            if (path.startsWith("/d/")) {
                String deckId = path.substring(3);

                navigator.enableOverlay();

                API.getInstance().graphql(GraphQLOperation.Query("deck")
                        .variable("deckId", "ID!", deckId)
                        .fields(API.DECK_FIELD_LIST)
                        .field("cards", API.CARD_FIELD_LIST)
                        , new API.GraphQLResponseHandler() {
                            @Override
                            public void success(JSONObject result) {
                                navigateToDeck(result);
                                navigator.disableOverlay();
                            }

                            @Override
                            public void failure(Exception e) {
                                // not a big deal, just don't get the deep link
                                navigator.disableOverlay();
                            }
                        });
            }
        }
    }

    @Subscribe(threadMode = ThreadMode.MAIN)
    public void onMessageEvent(CastleSharedPreferences.AuthTokenEvent event) {
        if (event.token == null) {
            navigator.navigate("LoginStack");
        } else {
            navigator.navigate("LoggedInRootStack");
        }
    };

    @Override
    public void onPostCreate(@Nullable Bundle savedInstanceState) {
        super.onPostCreate(savedInstanceState);
        //navigator.setContentLayout(findViewById(android.R.id.content));
    }

    @Override
    protected void onResume() {
        super.onResume();
        getReactGateway().onActivityResumed(this);

        EventBus.getDefault().register(this);

        //navigator.navigate("PlayDeck", "{\"decks\":[{\"id\":\"498dd29f-81df-4481-9207-bf45aab56282\",\"deckId\":\"498dd29f-81df-4481-9207-bf45aab56282\",\"title\":\"deck-498d\",\"creator\":{\"userId\":\"155\",\"username\":\"beepyeah\",\"photo\":{\"url\":\"https://castle.imgix.net/3c5adb8e22240d921c2835025d76e976?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"6f9989b2-8a90-4101-a6af-08954437961e\",\"cardId\":\"6f9989b2-8a90-4101-a6af-08954437961e\",\"title\":\"card-6f99\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/1bb7818f4dd102d8081ec60956de3836?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/1bb7818f4dd102d8081ec60956de3836?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/1bb7818f4dd102d8081ec60956de3836?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/1bb7818f4dd102d8081ec60956de3836?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#696a33\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-09-02T20:46:10.156Z\",\"variables\":[{\"id\":\"bb600199-0e5c-4e87-b65b-b643639a8942\",\"name\":\"rmr\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"44e8c9a8-57b1-4dfa-8d36-5f2356753c94\",\"name\":\"rml\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"72a627ae-cc7c-4678-a2c6-e5a59f99dd7f\",\"name\":\"rmm\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"d903d4a0-127a-4543-99c8-8cb0bf5c2a03\",\"name\":\"cmr\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"421f6d72-5797-4b26-a7c6-fb5307fe3b5a\",\"name\":\"cmm\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"2665527c-8ebc-448f-a360-097db6ca7fa6\",\"name\":\"cml\",\"type\":\"number\",\"value\":0,\"initialValue\":0}],\"__typename\":\"Deck\"},{\"id\":\"fb3a60d4-e833-412a-a2fb-23d4525e839b\",\"deckId\":\"fb3a60d4-e833-412a-a2fb-23d4525e839b\",\"title\":\"deck-fb3a\",\"creator\":{\"userId\":\"155\",\"username\":\"beepyeah\",\"photo\":{\"url\":\"https://castle.imgix.net/3c5adb8e22240d921c2835025d76e976?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"f247638c-5a41-409f-bc25-920e06816c1f\",\"cardId\":\"f247638c-5a41-409f-bc25-920e06816c1f\",\"title\":\"card-f247\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/e975f59394735ad2b29f9e4363b02ac6?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/e975f59394735ad2b29f9e4363b02ac6?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/e975f59394735ad2b29f9e4363b02ac6?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/e975f59394735ad2b29f9e4363b02ac6?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#bf54a0\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-09-02T20:12:30.203Z\",\"variables\":[{\"id\":\"2d0ddb54-43c2-448b-8d61-0fca8a1aac5c\",\"name\":\"didWin\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"f8498ef0-07bd-4f0a-9cf5-ba072a917477\",\"name\":\"doRot\",\"type\":\"number\",\"value\":0,\"initialValue\":0}],\"__typename\":\"Deck\"},{\"id\":\"527daa2b-d784-4bc4-9749-a9f1073281c9\",\"deckId\":\"527daa2b-d784-4bc4-9749-a9f1073281c9\",\"title\":\"deck-527d\",\"creator\":{\"userId\":\"6\",\"username\":\"ben\",\"photo\":{\"url\":\"https://castle.imgix.net/aad41bcc8b1b2cebeac14d33ab4bb141?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"54bd2d64-285a-4d9c-8820-49638d39f0fb\",\"cardId\":\"54bd2d64-285a-4d9c-8820-49638d39f0fb\",\"title\":\"card-54bd\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/52a7f629f1690e9c7b3dc552513a0a97?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/52a7f629f1690e9c7b3dc552513a0a97?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/52a7f629f1690e9c7b3dc552513a0a97?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/52a7f629f1690e9c7b3dc552513a0a97?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#726aaf\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-09-02T16:29:29.853Z\",\"variables\":[{\"id\":\"bc4d7b42-ce0e-4136-93da-a5d647ec304a\",\"name\":\"limit\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"f91d0381-4ce6-4737-9f5a-68b66b2889c3\",\"name\":\"revolutions\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"3ab4d850-c5aa-49e2-b35d-6cafdd2bdcac\",\"name\":\"crank\",\"type\":\"number\",\"value\":0,\"initialValue\":0}],\"__typename\":\"Deck\"},{\"id\":\"c7d9a7ff-157e-4641-9251-96a6baf38c2a\",\"deckId\":\"c7d9a7ff-157e-4641-9251-96a6baf38c2a\",\"title\":\"Fireworks\",\"creator\":{\"userId\":\"40\",\"username\":\"trasevol-dog\",\"photo\":{\"url\":\"https://castle.imgix.net/ff855a81ed3e63592dcffa4414cd6625?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"db8232a2-8edf-4e9a-83ea-fc2b7f93cef6\",\"cardId\":\"db8232a2-8edf-4e9a-83ea-fc2b7f93cef6\",\"title\":\"card-db82\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/83296c65c56ec27062c43a50e430c96c?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/83296c65c56ec27062c43a50e430c96c?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/83296c65c56ec27062c43a50e430c96c?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/83296c65c56ec27062c43a50e430c96c?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#3a4648\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-09-02T09:46:19.202Z\",\"variables\":[],\"__typename\":\"Deck\"},{\"id\":\"b27da0e3-f7ae-432f-9078-fef3aed91f41\",\"deckId\":\"b27da0e3-f7ae-432f-9078-fef3aed91f41\",\"title\":\"Keep Up!\",\"creator\":{\"userId\":\"1149\",\"username\":\"Nybble\",\"photo\":{\"url\":\"https://castlegames-assets.s3-us-west-2.amazonaws.com/default-avatar.png\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"055c0ce4-899d-4988-9e39-c5ab8a2a9ce4\",\"cardId\":\"055c0ce4-899d-4988-9e39-c5ab8a2a9ce4\",\"title\":\"card-055c\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/7a96fca011b10b142b50fdf581c7683d?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/7a96fca011b10b142b50fdf581c7683d?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/7a96fca011b10b142b50fdf581c7683d?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/7a96fca011b10b142b50fdf581c7683d?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#1e7d42\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-09-02T00:31:39.733Z\",\"variables\":[{\"id\":\"8d6a2036-44e1-4ec0-9c58-85c191318656\",\"name\":\"score\",\"type\":\"number\",\"value\":0,\"initialValue\":0}],\"__typename\":\"Deck\"},{\"id\":\"33af0baf-0ba7-4573-853d-a0209ba31023\",\"deckId\":\"33af0baf-0ba7-4573-853d-a0209ba31023\",\"title\":\"deck-33af\",\"creator\":{\"userId\":\"102\",\"username\":\"jess\",\"photo\":{\"url\":\"https://castle.imgix.net/54b4dd6151fdfaef0380553f1a52999d?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"816230a7-2d58-4cc8-b675-8a6166a253c0\",\"cardId\":\"816230a7-2d58-4cc8-b675-8a6166a253c0\",\"title\":\"card-8162\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/f001af64220de15258fa632ca5ef57bc?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/f001af64220de15258fa632ca5ef57bc?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/f001af64220de15258fa632ca5ef57bc?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/f001af64220de15258fa632ca5ef57bc?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#909599\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-09-02T00:09:33.958Z\",\"variables\":[],\"__typename\":\"Deck\"},{\"id\":\"773cdc41-a089-4d28-859e-082bbd8e25d4\",\"deckId\":\"773cdc41-a089-4d28-859e-082bbd8e25d4\",\"title\":\"deck-spin\",\"creator\":{\"userId\":\"66\",\"username\":\"liquidream\",\"photo\":{\"url\":\"https://castle.imgix.net/d833dac3ded044c79fc9e22263c5ec7b?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"134ae0cb-9f0c-4118-bcb9-fa615aab98f7\",\"cardId\":\"134ae0cb-9f0c-4118-bcb9-fa615aab98f7\",\"title\":\"card-134a\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/1c1704e99d727ba088b21db168c962bd?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/1c1704e99d727ba088b21db168c962bd?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/1c1704e99d727ba088b21db168c962bd?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/1c1704e99d727ba088b21db168c962bd?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#24a0e0\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-09-01T19:45:44.937Z\",\"variables\":[],\"__typename\":\"Deck\"},{\"id\":\"f872788a-ae59-44f4-b624-0ee42b9375c5\",\"deckId\":\"f872788a-ae59-44f4-b624-0ee42b9375c5\",\"title\":\"deck-f872\",\"creator\":{\"userId\":\"235\",\"username\":\"irondavy\",\"photo\":{\"url\":\"https://castle.imgix.net/9a2bd0285cd1195112812fa4763a0bd2?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"f3fb1f77-0027-4b1b-aa58-c2aafba3440f\",\"cardId\":\"f3fb1f77-0027-4b1b-aa58-c2aafba3440f\",\"title\":\"card-f3fb\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/19f355ff134070ebc67c58d1b4814ce0?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/19f355ff134070ebc67c58d1b4814ce0?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/19f355ff134070ebc67c58d1b4814ce0?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/19f355ff134070ebc67c58d1b4814ce0?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#77a059\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-08-31T07:52:56.696Z\",\"variables\":[{\"id\":\"f4149a6b-10b7-41d4-915b-dced249d5aad\",\"name\":\"up\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"915c2439-cf66-4840-bab1-da3de9bbce95\",\"name\":\"time\",\"type\":\"number\",\"value\":0,\"initialValue\":0}],\"__typename\":\"Deck\"},{\"id\":\"9dc1ee34-0c8d-4230-88ae-36b0d97f91fb\",\"deckId\":\"9dc1ee34-0c8d-4230-88ae-36b0d97f91fb\",\"title\":\"deck-quest\",\"creator\":{\"userId\":\"66\",\"username\":\"liquidream\",\"photo\":{\"url\":\"https://castle.imgix.net/d833dac3ded044c79fc9e22263c5ec7b?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"0a9ed210-5673-4629-84f1-9814d2bb5eb9\",\"cardId\":\"0a9ed210-5673-4629-84f1-9814d2bb5eb9\",\"title\":\"card-0a9e\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/e12db341b9329e714af15932deccacb3?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/e12db341b9329e714af15932deccacb3?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/e12db341b9329e714af15932deccacb3?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/e12db341b9329e714af15932deccacb3?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#7391b9\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-08-30T17:11:38.103Z\",\"variables\":[{\"id\":\"5dad0623-ef2e-4755-9148-7a615e0e7054\",\"name\":\"lockcount\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"908f46e7-3ad3-4936-8aac-f2f6daf8e71f\",\"name\":\"locked\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"aa21720e-588a-40c5-a3ea-7183e7394369\",\"name\":\"init\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"0e9e715b-6667-4d43-927e-89f1dd3ac7d7\",\"name\":\"done\",\"type\":\"number\",\"value\":0,\"initialValue\":0}],\"__typename\":\"Deck\"},{\"id\":\"a1344ec0-e435-4dcf-bc51-5f197bc41e5e\",\"deckId\":\"a1344ec0-e435-4dcf-bc51-5f197bc41e5e\",\"title\":\"hello\",\"creator\":{\"userId\":\"102\",\"username\":\"jess\",\"photo\":{\"url\":\"https://castle.imgix.net/54b4dd6151fdfaef0380553f1a52999d?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"0e4bb762-c4b3-45c3-83e9-e2e9a3ae5e07\",\"cardId\":\"0e4bb762-c4b3-45c3-83e9-e2e9a3ae5e07\",\"title\":\"card-0e4b\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/29d3dc3ac79ebd86144f0063f9dfc67a?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/29d3dc3ac79ebd86144f0063f9dfc67a?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/29d3dc3ac79ebd86144f0063f9dfc67a?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/29d3dc3ac79ebd86144f0063f9dfc67a?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#afd4ca\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-08-29T01:28:06.665Z\",\"variables\":[],\"__typename\":\"Deck\"},{\"id\":\"9fddbdc4-36fe-4e28-bbe0-18c9c1b25a00\",\"deckId\":\"9fddbdc4-36fe-4e28-bbe0-18c9c1b25a00\",\"title\":\"deck-9fdd\",\"creator\":{\"userId\":\"45\",\"username\":\"revillo\",\"photo\":{\"url\":\"https://castle.imgix.net/0605676a3093c7ba1eb8cd2927b55c5d?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"601a6799-8aa3-420d-9b16-27c382769ef2\",\"cardId\":\"601a6799-8aa3-420d-9b16-27c382769ef2\",\"title\":\"card-601a\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/6c02307648fb5f1de9457a3cc66b886b?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/6c02307648fb5f1de9457a3cc66b886b?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/6c02307648fb5f1de9457a3cc66b886b?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/6c02307648fb5f1de9457a3cc66b886b?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#8eae8c\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-08-27T15:30:47.718Z\",\"variables\":[{\"id\":\"f51416db-6a67-4ef2-893d-886cd31bab3a\",\"name\":\"lives\",\"type\":\"number\",\"value\":0,\"initialValue\":3},{\"id\":\"fcaa276e-c1ea-4bcd-8277-77e175c42eb4\",\"name\":\"score\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"7a32a626-362f-4c7c-a87d-f331ec9309da\",\"name\":\"flip\",\"type\":\"number\",\"value\":0,\"initialValue\":0}],\"__typename\":\"Deck\"},{\"id\":\"586e34e1-2dde-4929-bae7-22a55cf349ca\",\"deckId\":\"586e34e1-2dde-4929-bae7-22a55cf349ca\",\"title\":\"ping\",\"creator\":{\"userId\":\"40\",\"username\":\"trasevol-dog\",\"photo\":{\"url\":\"https://castle.imgix.net/ff855a81ed3e63592dcffa4414cd6625?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"65cba9b3-2f7f-48bc-9006-6acc77e85598\",\"cardId\":\"65cba9b3-2f7f-48bc-9006-6acc77e85598\",\"title\":\"card-65cb\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/07abfbd8848b26a0c11a682198c87ddd?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/07abfbd8848b26a0c11a682198c87ddd?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/07abfbd8848b26a0c11a682198c87ddd?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/07abfbd8848b26a0c11a682198c87ddd?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#954081\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-08-25T17:40:08.831Z\",\"variables\":[{\"id\":\"a7082c6c-1bcd-4d8e-a1d2-d68d69bcf58d\",\"name\":\"over\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"0ab1d78d-0883-4878-9d30-d560b8e0594e\",\"name\":\"score\",\"type\":\"number\",\"value\":0,\"initialValue\":0}],\"__typename\":\"Deck\"},{\"id\":\"d4b03049-d441-4e9c-9cbd-476954f08b38\",\"deckId\":\"d4b03049-d441-4e9c-9cbd-476954f08b38\",\"title\":\"deck-d4b0\",\"creator\":{\"userId\":\"39\",\"username\":\"ccheever\",\"photo\":{\"url\":\"https://castle.imgix.net/c9b85f2e241ea97e3ab5c0c29b24e11b?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"1d25891d-31c1-4dcb-b178-29145d7e3796\",\"cardId\":\"1d25891d-31c1-4dcb-b178-29145d7e3796\",\"title\":\"card-1d25\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/753d6eeb5f6d462bc421f421bd574086?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/753d6eeb5f6d462bc421f421bd574086?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/753d6eeb5f6d462bc421f421bd574086?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/753d6eeb5f6d462bc421f421bd574086?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#d9a96e\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-08-21T08:42:16.263Z\",\"variables\":[{\"id\":\"649de8cb-399d-4377-822e-4af9797323de\",\"name\":\"in\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"75398323-41db-4003-a9e9-7126a56b9cc4\",\"name\":\"strokes\",\"type\":\"number\",\"value\":0,\"initialValue\":0}],\"__typename\":\"Deck\"},{\"id\":\"c165765d-63b0-4fce-af3d-1c4e4315d8ae\",\"deckId\":\"c165765d-63b0-4fce-af3d-1c4e4315d8ae\",\"title\":\"deck-c165\",\"creator\":{\"userId\":\"1110\",\"username\":\"jwang\",\"photo\":{\"url\":\"https://castlegames-assets.s3-us-west-2.amazonaws.com/default-avatar.png\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"29930367-0ea0-4318-9983-23cdff809afa\",\"cardId\":\"29930367-0ea0-4318-9983-23cdff809afa\",\"title\":\"card-2993\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/07239e553323c0967c6f97d447f68fc9?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/07239e553323c0967c6f97d447f68fc9?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/07239e553323c0967c6f97d447f68fc9?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/07239e553323c0967c6f97d447f68fc9?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#74af4e\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-08-19T21:48:06.393Z\",\"variables\":[{\"id\":\"28626820-c074-469a-9f3d-68afe800f674\",\"name\":\"in\",\"type\":\"number\",\"value\":0,\"initialValue\":0}],\"__typename\":\"Deck\"},{\"id\":\"e4df647b-9972-4ea3-ab74-1417a9de0057\",\"deckId\":\"e4df647b-9972-4ea3-ab74-1417a9de0057\",\"title\":\"deck-e4df\",\"creator\":{\"userId\":\"235\",\"username\":\"irondavy\",\"photo\":{\"url\":\"https://castle.imgix.net/9a2bd0285cd1195112812fa4763a0bd2?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"fc3ae6ac-77ba-483c-aeec-ef54a2e2d89c\",\"cardId\":\"fc3ae6ac-77ba-483c-aeec-ef54a2e2d89c\",\"title\":\"card-3743\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/09a4d4754db60440a045e31b034f3bed?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/09a4d4754db60440a045e31b034f3bed?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/09a4d4754db60440a045e31b034f3bed?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/09a4d4754db60440a045e31b034f3bed?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#924784\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-08-16T00:59:54.418Z\",\"variables\":[{\"id\":\"275ab03e-0c9f-4e6b-a62d-c34108cd424c\",\"name\":\"tip_3\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"612689f1-cf3c-4783-97fe-ed60408afcb3\",\"name\":\"tip_2\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"3afb4885-7a24-42d7-8ce1-49b3f856bf1c\",\"name\":\"tip_1\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"1fd7c898-82ee-4ef2-ac26-f9a96566c6f9\",\"name\":\"moving\",\"type\":\"number\",\"value\":0,\"initialValue\":0}],\"__typename\":\"Deck\"},{\"id\":\"79a41c0e-7bb9-4aa5-bd53-59d70c7f69f3\",\"deckId\":\"79a41c0e-7bb9-4aa5-bd53-59d70c7f69f3\",\"title\":\"deck-79a4\",\"creator\":{\"userId\":\"235\",\"username\":\"irondavy\",\"photo\":{\"url\":\"https://castle.imgix.net/9a2bd0285cd1195112812fa4763a0bd2?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"a1dfe8dc-5784-41a0-8627-c92f796c3aa5\",\"cardId\":\"a1dfe8dc-5784-41a0-8627-c92f796c3aa5\",\"title\":\"card-a1df\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/263351120378aef24d9209244ec747e8?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/263351120378aef24d9209244ec747e8?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/263351120378aef24d9209244ec747e8?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/263351120378aef24d9209244ec747e8?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#95ce7a\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-08-15T19:04:18.412Z\",\"variables\":[{\"id\":\"4f384ff6-7a0b-44dd-8c8d-41ee1dfa314b\",\"name\":\"seconds\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"75665864-4fe1-4d8a-a7ae-550a705c27d1\",\"name\":\"boxes\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"3340b90a-3540-41e4-ac49-d0005900bcfd\",\"name\":\"score\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"ef53949e-1415-4085-8366-efee31bc98fe\",\"name\":\"lost\",\"type\":\"number\",\"value\":0,\"initialValue\":0}],\"__typename\":\"Deck\"},{\"id\":\"3617a8b7-7124-4c08-8c74-2eb695ed7aea\",\"deckId\":\"3617a8b7-7124-4c08-8c74-2eb695ed7aea\",\"title\":\"deck-3617\",\"creator\":{\"userId\":\"66\",\"username\":\"liquidream\",\"photo\":{\"url\":\"https://castle.imgix.net/d833dac3ded044c79fc9e22263c5ec7b?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"14a3fc6a-a796-4e65-ab3a-1be9b21c2d71\",\"cardId\":\"14a3fc6a-a796-4e65-ab3a-1be9b21c2d71\",\"title\":\"card-f107\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/3d1d3e5f89716028ba4b93726ad044d8?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/3d1d3e5f89716028ba4b93726ad044d8?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/3d1d3e5f89716028ba4b93726ad044d8?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/3d1d3e5f89716028ba4b93726ad044d8?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#887083\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-08-15T16:33:37.427Z\",\"variables\":[{\"id\":\"7d608fe0-6240-4ec1-932a-2b2304f82bac\",\"name\":\"win\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"70cd8791-bf6e-4120-b20e-2ad70663e256\",\"name\":\"length\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"63d87558-c73f-49ba-8762-b18b964824b7\",\"name\":\"pressed\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"0f612042-25c3-4ee6-9d76-f11cd21fefcb\",\"name\":\"dir\",\"type\":\"number\",\"value\":0,\"initialValue\":1}],\"__typename\":\"Deck\"},{\"id\":\"a4015234-5cf5-413f-b46a-fcb737a7b9c9\",\"deckId\":\"a4015234-5cf5-413f-b46a-fcb737a7b9c9\",\"title\":\"deck-a401\",\"creator\":{\"userId\":\"235\",\"username\":\"irondavy\",\"photo\":{\"url\":\"https://castle.imgix.net/9a2bd0285cd1195112812fa4763a0bd2?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"6db64dc4-346d-4b17-96d2-e15ff15fe5af\",\"cardId\":\"6db64dc4-346d-4b17-96d2-e15ff15fe5af\",\"title\":\"card-6db6\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/1ca3e2a09d1718099554fa88b5af512b?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/1ca3e2a09d1718099554fa88b5af512b?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/1ca3e2a09d1718099554fa88b5af512b?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/1ca3e2a09d1718099554fa88b5af512b?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#9abf9c\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-08-15T02:37:06.245Z\",\"variables\":[{\"id\":\"0c3a821a-e6ff-452f-863b-780f924b9509\",\"name\":\"juiced\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"1760339e-9803-4a65-8913-26c5144af71d\",\"name\":\"filter\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"f7449b7f-4dab-437a-8494-5a912ee66132\",\"name\":\"juicer\",\"type\":\"number\",\"value\":0,\"initialValue\":0}],\"__typename\":\"Deck\"},{\"id\":\"9184d7a2-056d-4361-8505-1f08109f7521\",\"deckId\":\"9184d7a2-056d-4361-8505-1f08109f7521\",\"title\":\"deck-9184\",\"creator\":{\"userId\":\"235\",\"username\":\"irondavy\",\"photo\":{\"url\":\"https://castle.imgix.net/9a2bd0285cd1195112812fa4763a0bd2?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"54814fd4-8f6a-4b39-8861-b9bd747541bb\",\"cardId\":\"54814fd4-8f6a-4b39-8861-b9bd747541bb\",\"title\":\"card-5481\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/b4f4712ba957eaaf4d985e0025671f9c?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/b4f4712ba957eaaf4d985e0025671f9c?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/b4f4712ba957eaaf4d985e0025671f9c?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/b4f4712ba957eaaf4d985e0025671f9c?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#4083be\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-08-13T06:59:51.755Z\",\"variables\":[{\"id\":\"f22eb5e0-6e8c-4b40-a238-9fe6fa392ef5\",\"name\":\"go\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"d4f96c1b-efc5-4be8-a069-84b53286bec5\",\"name\":\"score\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"992965e5-2ed7-476e-8010-a85fd113669a\",\"name\":\"safe\",\"type\":\"number\",\"value\":0,\"initialValue\":1},{\"id\":\"b999ec8a-f662-463f-9dd5-915af4e084ef\",\"name\":\"lost\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"f668ff22-4c68-4b50-8ff7-9db6d2dce917\",\"name\":\"stopped\",\"type\":\"number\",\"value\":0,\"initialValue\":1},{\"id\":\"85e148ca-8d24-4ab7-8e20-7d2e699db439\",\"name\":\"slung\",\"type\":\"number\",\"value\":0,\"initialValue\":0}],\"__typename\":\"Deck\"},{\"id\":\"78e34b4d-bbd5-450a-a0cf-effa29677e13\",\"deckId\":\"78e34b4d-bbd5-450a-a0cf-effa29677e13\",\"title\":\"ENDLS BRKOUT\",\"creator\":{\"userId\":\"40\",\"username\":\"trasevol-dog\",\"photo\":{\"url\":\"https://castle.imgix.net/ff855a81ed3e63592dcffa4414cd6625?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"d918f808-56af-4b3f-bf73-a8c9ed14bd3d\",\"cardId\":\"d918f808-56af-4b3f-bf73-a8c9ed14bd3d\",\"title\":\"card-d918\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/2a71c87c409f9de21d0d216155c6047b?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/2a71c87c409f9de21d0d216155c6047b?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/2a71c87c409f9de21d0d216155c6047b?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/2a71c87c409f9de21d0d216155c6047b?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#2cb4b2\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-08-12T13:19:51.920Z\",\"variables\":[{\"id\":\"12d2d600-31d3-4108-b582-2d011404ac90\",\"name\":\"Game\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"356795e6-fde2-45a6-871f-1d58326d2233\",\"name\":\"Lives\",\"type\":\"number\",\"value\":0,\"initialValue\":3},{\"id\":\"a5a7d164-c412-45ee-9bb7-e0a86759a449\",\"name\":\"Start\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"e3afca1c-7916-4f0e-add0-380366430b06\",\"name\":\"Score\",\"type\":\"number\",\"value\":0,\"initialValue\":0}],\"__typename\":\"Deck\"},{\"id\":\"50cdea98-9c03-4db0-8da2-2f809fe70674\",\"deckId\":\"50cdea98-9c03-4db0-8da2-2f809fe70674\",\"title\":\"deck-50cd\",\"creator\":{\"userId\":\"45\",\"username\":\"revillo\",\"photo\":{\"url\":\"https://castle.imgix.net/0605676a3093c7ba1eb8cd2927b55c5d?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"85663138-4d41-48a6-933b-e7088cc6f11a\",\"cardId\":\"85663138-4d41-48a6-933b-e7088cc6f11a\",\"title\":\"card-8566\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/ce97285c399a50fc0b74b15fd8669336?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/ce97285c399a50fc0b74b15fd8669336?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/ce97285c399a50fc0b74b15fd8669336?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/ce97285c399a50fc0b74b15fd8669336?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#257097\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-08-11T15:01:02.814Z\",\"variables\":[{\"id\":\"46c4d8df-274f-4c50-aed1-0ecc03eecb59\",\"name\":\"timeout\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"b12c364f-e63b-4ce8-b39e-3014f1707918\",\"name\":\"win\",\"type\":\"number\",\"value\":0,\"initialValue\":0},{\"id\":\"a79da4d8-1b26-4c5f-a18a-9659d3e13db3\",\"name\":\"debug\",\"type\":\"number\",\"value\":0,\"initialValue\":0}],\"__typename\":\"Deck\"},{\"id\":\"cc364b3a-8a8b-4dbc-ace9-c96618780476\",\"deckId\":\"cc364b3a-8a8b-4dbc-ace9-c96618780476\",\"title\":\"deck-cc36\",\"creator\":{\"userId\":\"235\",\"username\":\"irondavy\",\"photo\":{\"url\":\"https://castle.imgix.net/9a2bd0285cd1195112812fa4763a0bd2?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"82e07069-edfd-45dd-9ee1-132e0d6b6c55\",\"cardId\":\"82e07069-edfd-45dd-9ee1-132e0d6b6c55\",\"title\":\"card-82e0\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/70f05824f8150dd74d8827789cb5df41?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/70f05824f8150dd74d8827789cb5df41?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/70f05824f8150dd74d8827789cb5df41?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/70f05824f8150dd74d8827789cb5df41?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#47b1ae\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-08-11T06:41:29.607Z\",\"variables\":[],\"__typename\":\"Deck\"},{\"id\":\"a28c7a41-c777-4187-8e8c-f4d26852a52d\",\"deckId\":\"a28c7a41-c777-4187-8e8c-f4d26852a52d\",\"title\":\"feed the thing\",\"creator\":{\"userId\":\"110\",\"username\":\"chriscraws\",\"photo\":{\"url\":\"https://castlegames-assets.s3-us-west-2.amazonaws.com/default-avatar.png\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"a3159ff3-251d-4368-b251-8284c85cf0ad\",\"cardId\":\"a3159ff3-251d-4368-b251-8284c85cf0ad\",\"title\":\"card-a315\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/b18c0ff207af2d16e296ce602ff35368?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/b18c0ff207af2d16e296ce602ff35368?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/b18c0ff207af2d16e296ce602ff35368?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/b18c0ff207af2d16e296ce602ff35368?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#8a959f\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-08-10T08:24:08.416Z\",\"variables\":[],\"__typename\":\"Deck\"},{\"id\":\"81e68baf-e475-4bc8-81a5-2059bfc481fb\",\"deckId\":\"81e68baf-e475-4bc8-81a5-2059bfc481fb\",\"title\":\"deck-81e6\",\"creator\":{\"userId\":\"1089\",\"username\":\"maxb\",\"photo\":{\"url\":\"https://castle.imgix.net/cd9113f22a4f3e41022957f79b0f4781?auto=compress&ar=5:7&fit=crop&min-w=420\",\"__typename\":\"HostedFile\"},\"__typename\":\"User\"},\"initialCard\":{\"id\":\"6c5f9f26-158b-438b-ab29-ed980c7ed6b5\",\"cardId\":\"6c5f9f26-158b-438b-ab29-ed980c7ed6b5\",\"title\":\"card-6c5f\",\"backgroundImage\":{\"url\":\"https://castle.imgix.net/8312d4fdb63c322ee276b4bee3131fda?auto=compress&ar=5:7&fit=crop&min-w=420\",\"smallUrl\":\"https://castle.imgix.net/8312d4fdb63c322ee276b4bee3131fda?auto=compress&ar=5:7&fit=crop&w=420\",\"privateCardUrl\":\"https://castle.imgix.net/8312d4fdb63c322ee276b4bee3131fda?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n\",\"overlayUrl\":\"https://castle.imgix.net/8312d4fdb63c322ee276b4bee3131fda?auto=compress&ar=5:7&fit=crop&w=420&blend-color=000000&blend-alpha=60&blend-mode=multiply\",\"primaryColor\":\"#d83e22\",\"__typename\":\"HostedFile\"},\"__typename\":\"Card\"},\"lastModified\":\"2020-08-09T05:48:26.984Z\",\"variables\":[],\"__typename\":\"Deck\"}],\"initialDeckIndex\":10,\"title\":\"Newest\"}");
    }

    @Override
    public void onNewIntent(Intent intent) {
        if (!getReactGateway().onNewIntent(intent)) {
            super.onNewIntent(intent);
        }

        handleDeepLink(intent);
    }

    @Override
    protected void onPause() {
        super.onPause();
        getReactGateway().onActivityPaused(this);

        EventBus.getDefault().unregister(this);
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
