import React, { useState, useEffect } from 'react';
import {
  View,
  AppRegistry,
  Platform,
  DeviceEventEmitter,
  Dimensions,
  PixelRatio,
  BackHandler,
} from 'react-native';
// https://github.com/software-mansion/react-native-gesture-handler/issues/320#issuecomment-443815828
import 'react-native-gesture-handler';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { ApolloProvider } from '@apollo/client';
import { RootNavigator } from './Navigation';
import { AndroidNavigationContext, ANDROID_USE_NATIVE_NAVIGATION } from './ReactNavigation';
import { DeckRemixesScreen } from './play/DeckRemixesScreen';
import * as CoreEvents from './core/CoreEvents';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableAndroidFontFix } from './AndroidFontFix';
import { ExploreScreen } from './explore/ExploreScreen';
import { ExploreFeed } from './explore/ExploreFeed';
import { FeedbackScreen } from './feedback/FeedbackScreen';
import { HomeScreen } from './home/HomeScreen';
import { FeaturedDecks } from './home/FeaturedDecks';
import { RecentDecks } from './home/RecentDecks';
import { PlayDeckScreen } from './play/PlayDeckScreen';
import { ProfileScreen } from './profile/ProfileScreen';
import { LoginScreen, CreateAccountScreen, ForgotPasswordScreen } from './auth/AuthScreens';
import { CreateScreen } from './create/CreateScreen';
import { CreateDeckNavigator } from './create/CreateDeckNavigator';
import { InitialAuthScreen } from './auth/InitialAuthScreen';
import { CreateChooseKitScreen } from './create/CreateChooseKitScreen';
import { ViewSourceNavigator } from './create/ViewSourceNavigator';
import { ShareDeckScreen } from './share/ShareDeckScreen';
import { NotificationsScreen } from './notifications/NotificationsScreen';
import { UserListScreen } from './components/UserListScreen';

import * as Session from './Session';
import * as PushNotifications from './PushNotifications';
import * as GameViewAndroidBackHandler from './common/GameViewAndroidBackHandler';

if (Platform.OS == 'android') {
  let oldAddEventListener = BackHandler.addEventListener;
  let oldRemoveEventListener = BackHandler.removeEventListener;

  BackHandler.addEventListener = (...args) => {
    GameViewAndroidBackHandler.backHandlerAddEventListener(...args);
    return oldAddEventListener(...args);
  };

  BackHandler.removeEventListener = (...args) => {
    GameViewAndroidBackHandler.backHandlerRemoveEventListener(...args);
    return oldRemoveEventListener(...args);
  };
}

// Fixes the problem with font rendering on OnePlus phones, like Charlie's
enableAndroidFontFix();

const Main = () => {
  const { initialized } = Session.useSession();
  GameViewAndroidBackHandler.listen();

  // Session not yet initialized? Just show a loading screen...
  if (!initialized) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
        }}
      />
    );
  }

  return <RootNavigator />;
};

const MainProvider = (props) => {
  if (props.initialPushNotificationDataString) {
    PushNotifications.setInitialData(props.initialPushNotificationDataString);
  }

  return (
    <View style={{ flex: 1 }}>
      <Session.Provider>
        <CoreEvents.Provider>
          <ApolloProvider client={Session.apolloClient}>
            <ActionSheetProvider>
              <SafeAreaProvider>
                <Main />
              </SafeAreaProvider>
            </ActionSheetProvider>
          </ApolloProvider>
        </CoreEvents.Provider>
      </Session.Provider>
    </View>
  );
};

if (Platform.OS === 'android' && ANDROID_USE_NATIVE_NAVIGATION) {
  const WaitForSession = (props) => {
    const { initialized } = Session.useSession();
    GameViewAndroidBackHandler.listen();

    // Session not yet initialized? Just show a loading screen...
    if (!initialized) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'black',
          }}
        />
      );
    }

    return React.Children.only(props.children);
  };

  const AddProviders = (props) => {
    return (
      <View style={{ flex: 1 }}>
        <AndroidNavigationContext.Provider
          value={{
            navigatorId: props.navigatorId,
            viewId: props.viewId,
            navigatorWindowHeight: props.navigatorWindowHeight,
            globalNavigatorHeightOffset: props.globalNavigatorHeightOffset,
            navigatorStackDepth: props.navigatorStackDepth,
          }}>
          <Session.Provider>
            <CoreEvents.Provider>
              <ApolloProvider client={Session.apolloClient}>
                <ActionSheetProvider>
                  <SafeAreaProvider>
                    <WaitForSession>{React.Children.only(props.children)}</WaitForSession>
                  </SafeAreaProvider>
                </ActionSheetProvider>
              </ApolloProvider>
            </CoreEvents.Provider>
          </Session.Provider>
        </AndroidNavigationContext.Provider>
      </View>
    );
  };

  const windowHeight = Dimensions.get('window').height;

  let globalVerticalSpaceTaken = null;

  const WrapComponent = (Component, opts = {}) => {
    return () => {
      return (props) => {
        const [newProps, setNewProps] = useState({});

        useEffect(() => {
          let subscription = DeviceEventEmitter.addListener(
            'CastleNativeNavigationProp',
            (event) => {
              let componentId = event.componentId;
              if (componentId == props.componentId) {
                let newProps = {};
                if (event.props.navigationScreenOptions) {
                  newProps = JSON.parse(event.props.navigationScreenOptions);
                }

                setNewProps(newProps);
              }
            }
          );

          return () => {
            subscription.remove();
          };
        });

        let childProps = {};
        if (props.navigationScreenOptions) {
          childProps = JSON.parse(props.navigationScreenOptions);
        }

        let verticalSpaceTaken = 0;
        if (props.navigationHeight) {
          verticalSpaceTaken += props.navigationHeight / PixelRatio.get();
        }

        if (props.initialPushNotificationDataString) {
          PushNotifications.setInitialData(props.initialPushNotificationDataString);
        }

        if (!globalVerticalSpaceTaken) {
          // Viewport.vh is set globally instead of for each root view,
          // so we just use the first measurement for doing calculations that involve vh
          globalVerticalSpaceTaken = verticalSpaceTaken;
        }

        return (
          <View style={{ flex: 1 }}>
            <AddProviders
              navigatorId={props.navigatorId}
              viewId={props.viewId}
              navigatorWindowHeight={windowHeight - verticalSpaceTaken}
              globalNavigatorHeightOffset={globalVerticalSpaceTaken}
              navigatorStackDepth={props.stackDepth}>
              <Component {...{ ...childProps, ...newProps }} />
            </AddProviders>

            {opts.addTabBarPadding && <View style={{ height: 50 }} />}
          </View>
        );
      };
    };
  };

  AppRegistry.registerComponent('HomeScreen', WrapComponent(HomeScreen));
  AppRegistry.registerComponent('FeaturedDecks', WrapComponent(FeaturedDecks));
  AppRegistry.registerComponent('RecentDecks', WrapComponent(RecentDecks));
  AppRegistry.registerComponent('PlayDeck', WrapComponent(PlayDeckScreen));
  AppRegistry.registerComponent(
    'ProfileScreen',
    WrapComponent(ProfileScreen, { addTabBarPadding: true })
  );
  AppRegistry.registerComponent(
    'Profile',
    WrapComponent(ProfileScreen, { addTabBarPadding: true })
  );
  AppRegistry.registerComponent(
    'ExploreScreen',
    WrapComponent(ExploreScreen, { addTabBarPadding: true })
  );
  AppRegistry.registerComponent('ExploreFeed', WrapComponent(ExploreFeed));
  AppRegistry.registerComponent('Feedback', WrapComponent(FeedbackScreen));
  AppRegistry.registerComponent('InitialAuthScreen', WrapComponent(InitialAuthScreen));
  AppRegistry.registerComponent('CreateChooseKitScreen', WrapComponent(CreateChooseKitScreen));
  AppRegistry.registerComponent('LoginScreen', WrapComponent(LoginScreen));
  AppRegistry.registerComponent('CreateAccountScreen', WrapComponent(CreateAccountScreen));
  AppRegistry.registerComponent('ForgotPasswordScreen', WrapComponent(ForgotPasswordScreen));
  AppRegistry.registerComponent('Create', WrapComponent(CreateScreen, { addTabBarPadding: true }));
  AppRegistry.registerComponent('DeckRemixes', WrapComponent(DeckRemixesScreen));
  AppRegistry.registerComponent('CreateDeck', WrapComponent(CreateDeckNavigator));
  AppRegistry.registerComponent('ShareDeck', WrapComponent(ShareDeckScreen));
  AppRegistry.registerComponent('ViewSource', WrapComponent(ViewSourceNavigator));
  AppRegistry.registerComponent(
    'Notifications',
    WrapComponent(NotificationsScreen, { addTabBarPadding: true })
  );
  AppRegistry.registerComponent('UserList', WrapComponent(UserListScreen));

  const handlePushNotification = ({ data, clicked }) => {
    if (data?.numUnseenNotifications && !clicked) {
      // Update badge so we don't have to wait on maybeFetchNotificationsAsync() to do it
      Session.setNotifBadge(data.numUnseenNotifications);
    }
    Session.maybeFetchNotificationsAsync();
  };
  PushNotifications.addClickedListener((data) => handlePushNotification({ data, clicked: true }));
  PushNotifications.addReceivedListener((data) => handlePushNotification({ data, clicked: false }));

  (async () => {
    await Session.loadAuthTokenAsync();
    await Session.maybeFetchNotificationsAsync();
  })();

  DeviceEventEmitter.addListener('onAppStateChange', async (state) => {
    if (state == 'active') {
      await Session.maybeFetchNotificationsAsync();
    }
  });
} // Platform.OS == 'Android'

export default MainProvider;
