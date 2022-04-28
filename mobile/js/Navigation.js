import React from 'react';
import { LogBox, Platform } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BootSplash from 'react-native-bootsplash';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useSession, maybeFetchNotificationsAsync, setNotifBadge } from './Session';

import { LoginScreen, CreateAccountScreen, ForgotPasswordScreen } from './auth/AuthScreens';
import { InitialAuthScreen } from './auth/InitialAuthScreen';
import { CreateScreen } from './create/CreateScreen';
import { CreateChooseKitScreen } from './create/CreateChooseKitScreen';
import { CreateDeckNavigator } from './create/CreateDeckNavigator';
import { useAppState } from './ghost/GhostAppState';
import { HomeScreen } from './home/HomeScreen';
import { ExploreScreen } from './explore/ExploreScreen';
import { ExploreFeed } from './explore/ExploreFeed';
import { FeedbackScreen } from './feedback/FeedbackScreen';
import { NotificationsScreen } from './notifications/NotificationsScreen';
import { PlayDeckScreen } from './play/PlayDeckScreen';
import { ProfileScreen } from './profile/ProfileScreen';
import { ShareDeckScreen } from './share/ShareDeckScreen';
import { UserListScreen } from './components/UserListScreen';
import { ViewSourceNavigator } from './create/ViewSourceNavigator';
import { DeckRemixesScreen } from './play/DeckRemixesScreen';

import createTopTabNavigator from './navigator/createTopTabNavigator';

import * as DeepLinks from './DeepLinks';
import * as PushNotifications from './PushNotifications';
import * as Constants from './Constants';

import FastImage from 'react-native-fast-image';

enableScreens();
const Stack = createNativeStackNavigator();
const Tab = createTopTabNavigator();

const ICON_SIZE = 22;

// we don't need the react-nav feature which would be broken according to this warning
LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

// App UI layout

// specific options for all instances of the PlayDeck screen
const engineNavigationOptions = {
  gestureEnabled: false,
  animation: Platform.OS === 'android' ? 'none' : 'default',
};

const BrowseNavigator = () => (
  <Stack.Navigator
    initialRouteName="HomeScreen"
    screenOptions={{
      headerShown: false,
    }}>
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
    <Stack.Screen name="PlayDeck" component={PlayDeckScreen} options={engineNavigationOptions} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen
      name="ViewSource"
      component={ViewSourceNavigator}
      options={engineNavigationOptions}
    />
    <Stack.Screen name="DeckRemixes" component={DeckRemixesScreen} />
  </Stack.Navigator>
);

const ExploreNavigator = () => (
  <Stack.Navigator
    initialRouteName="Explore"
    screenOptions={{
      headerShown: false,
    }}>
    <Stack.Screen name="Explore" component={ExploreScreen} />
    <Stack.Screen name="ExploreFeed" component={ExploreFeed} />
    <Stack.Screen name="PlayDeck" component={PlayDeckScreen} options={engineNavigationOptions} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="Feedback" component={FeedbackScreen} />
    <Stack.Screen
      name="ViewSource"
      component={ViewSourceNavigator}
      options={engineNavigationOptions}
    />
    <Stack.Screen name="DeckRemixes" component={DeckRemixesScreen} />
  </Stack.Navigator>
);

const CreateNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}>
    <Stack.Screen
      name="Create"
      component={CreateScreen}
      options={{
        title: 'Create',
      }}
    />
    <Stack.Screen
      name="CreateDeck"
      component={CreateDeckNavigator}
      options={engineNavigationOptions}
    />
    <Stack.Screen name="ShareDeck" component={ShareDeckScreen} />
  </Stack.Navigator>
);

const NotificationsNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ title: 'Notifications' }}
    />
    <Stack.Screen name="UserList" component={UserListScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="PlayDeck" component={PlayDeckScreen} options={engineNavigationOptions} />
    <Stack.Screen
      name="ViewSource"
      component={ViewSourceNavigator}
      options={engineNavigationOptions}
    />
    <Stack.Screen name="DeckRemixes" component={DeckRemixesScreen} />
  </Stack.Navigator>
);

const ProfileNavigator = () => (
  <Stack.Navigator
    initialRouteName="Profile"
    screenOptions={{
      headerShown: false,
    }}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="PlayDeck" component={PlayDeckScreen} options={engineNavigationOptions} />
    <Stack.Screen
      name="ViewSource"
      component={ViewSourceNavigator}
      options={engineNavigationOptions}
    />
    <Stack.Screen name="DeckRemixes" component={DeckRemixesScreen} />
  </Stack.Navigator>
);

export const getIsTabBarVisible = ({ route, navigation }) => {
  let tabState = navigation.getState();
  if (tabState.type === 'stack') {
    // if we got a stack, try moving to parent tab navigator
    tabState = navigation.getParent().getState();
  }
  let isVisible = true;
  if (tabState?.routes) {
    const currentTabState = tabState.routes[tabState.index];
    const stackIndex = currentTabState?.state?.index;
    isVisible = !stackIndex || stackIndex === 0;

    if (tabState.index === 0) {
      // home tab
      let isPlayingFeedDeck = false;
      if (currentTabState?.state?.routes && currentTabState.state.routes.length) {
        isPlayingFeedDeck = currentTabState.state.routes[0].params?.deckId !== undefined;
      }
      isVisible = isVisible && !isPlayingFeedDeck;
    } else if (tabState.index === 2) {
      // create tab
      let isEditing = false;
      if (currentTabState?.state?.routes && currentTabState.state.routes.length > 1) {
        isEditing = currentTabState.state.routes[1].params?.cardIdToEdit;
      }
      return isVisible || !isEditing;
    }
  }
  return isVisible;
};

const TabNavigator = () => {
  const { notificationsBadgeCount, isNuxCompleted, isNativeFeedNuxCompleted } = useSession();
  // fetch notifications when a notif arrives while we're running
  const handlePushNotification = React.useCallback(({ data, clicked }) => {
    if (data?.numUnseenNotifications && !clicked) {
      // Update badge so we don't have to wait on maybeFetchNotificationsAsync() to do it
      setNotifBadge(data.numUnseenNotifications);
    }
    if (clicked) {
      let navigatingToDeck = false;
      if ((data.type === 'new_deck' || data.type === 'suggested_deck') && data.deckId) {
        navigatingToDeck = true;

        // on initial load, we have to wait for rootNavRef
        setTimeout(() => {
          if (rootNavRef.current) {
            rootNavRef.current.navigate('BrowseTab', {
              screen: 'HomeScreen',
              params: {
                deepLinkDeckId: data.deckId,
              },
            });
          }
        }, 100);
      }

      if (!navigatingToDeck && rootNavRef.current) {
        // pass the `screen` param to ensure we pop to the top of the stack
        rootNavRef.current.navigate('NotificationsTab', { screen: 'Notifications' });
      }
    }
    setTimeout(maybeFetchNotificationsAsync, 250);
  }, []);
  PushNotifications.usePushNotifications({
    onClicked: (data) => handlePushNotification({ data, clicked: true }),
    onReceived: (data) => handlePushNotification({ data, clicked: false }),
  });

  const initialPushData = PushNotifications.getInitialData();
  if (initialPushData) {
    handlePushNotification({ data: initialPushData, clicked: true });
    PushNotifications.clearInitialData();
  }

  return (
    <Tab.Navigator
      initialRouteName="BrowseTab"
      screenOptions={(props) => {
        const isTabBarVisible = getIsTabBarVisible(props);
        return {
          tabBarNuxHideIcons: !isNuxCompleted || !isNativeFeedNuxCompleted,
          headerShown: false,
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#888',
          tabBarStyle: {
            borderTopColor: '#888',
            backgroundColor: '#000',
            display: isTabBarVisible ? undefined : 'none',
          },
          tabBarLabelPosition: 'beside-icon',
          tabBarIconStyle: {
            width: 18,
          },
        };
      }}>
      <Tab.Screen
        name="BrowseTab"
        component={BrowseNavigator}
        options={{
          tabBarIcon: ({ focused, color }) => {
            return (
              <FastImage
                tintColor={color}
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                }}
                source={require('../assets/images/BottomTabs-browse.png')}
              />
            );
          },
          tabBarLabel: 'Home',
          tabBarItemStyle: { paddingLeft: 12 },
        }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ExploreNavigator}
        options={{
          tabBarIcon: ({ focused, color }) => {
            return (
              <FastImage
                tintColor={color}
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                }}
                source={require('../assets/images/BottomTabs-explore.png')}
              />
            );
          },
          tabBarLabel: 'Explore',
        }}
      />
      <Tab.Screen
        name="CreateTab"
        component={CreateNavigator}
        options={{
          tabBarIcon: ({ focused, color }) => {
            return (
              <FastImage
                tintColor={color}
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                }}
                source={require('../assets/images/BottomTabs-create.png')}
              />
            );
          },
          tabBarLabel: 'Create',
          tabBarItemStyle: { flex: 1 },
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsNavigator}
        options={{
          tabBarBadge: notificationsBadgeCount > 0 ? notificationsBadgeCount : null,
          tabBarIcon: ({ focused, color }) => {
            return (
              <FastImage
                tintColor={color}
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                }}
                source={require('../assets/images/BottomTabs-notifications.png')}
              />
            );
          },
          tabBarShowLabel: false,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          tabBarIcon: ({ focused, color }) => {
            return (
              <FastImage
                tintColor={color}
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                }}
                source={require('../assets/images/BottomTabs-profile.png')}
              />
            );
          },
          tabBarShowLabel: false,
          tabBarItemStyle: { paddingRight: 12 },
        }}
      />
    </Tab.Navigator>
  );
};

const InitialAuthNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}>
    <Stack.Screen name="InitialAuthScreen" component={InitialAuthScreen} />
  </Stack.Navigator>
);

const makeModalHeaderStyles = ({ navigation }) => ({
  headerTintColor: '#fff',
  headerLeft: () => (
    <Constants.CastleIcon name="close" size={24} color="#fff" onPress={() => navigation.pop()} />
  ),
  headerTitleAlign: 'center',
  headerStyle: {
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  headerTitleStyle: {
    fontFamily: 'Basteleur-Bold',
    fontSize: 20,
  },
});

const ModalCreateDeckNavigator = () => (
  <Stack.Navigator screenOptions={makeModalHeaderStyles}>
    <Stack.Screen
      name="CreateChooseKitScreen"
      component={CreateChooseKitScreen}
      options={{ title: 'New Deck' }}
    />
  </Stack.Navigator>
);

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={makeModalHeaderStyles}>
    <Stack.Screen
      name="LoginScreen"
      component={LoginScreen}
      options={{ title: 'Log in to Castle' }}
    />
    <Stack.Screen
      name="CreateAccountScreen"
      component={CreateAccountScreen}
      options={{ title: 'Sign up for Castle' }}
    />
    <Stack.Screen
      name="ForgotPasswordScreen"
      component={ForgotPasswordScreen}
      options={{ title: 'Reset password' }}
    />
  </Stack.Navigator>
);

function onNavigationStateChange(state) {
  // This was causing decks to freeze after a deep link
  // Probably don't need anymore?
  // GhostChannels.globalPause();
}

// https://reactnavigation.org/docs/themes/
const NavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#000',
    notification: '#fff',
  },
};

const rootNavRef = React.createRef();
const navRefCallback = (r) => {
  rootNavRef.current = r;
  DeepLinks.setNavigationRef(r);
};

const MainAppNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      presentation: 'modal',
    }}>
    <Stack.Screen name="TabNavigator" component={TabNavigator} />
    <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
    <Stack.Screen name="ModalCreateDeckNavigator" component={ModalCreateDeckNavigator} />
  </Stack.Navigator>
);

export const RootNavigator = () => {
  const { isSignedIn } = useSession();

  // fetch notifs when we first notice a signed in user (including every app InitialAuth)
  React.useEffect(() => {
    if (isSignedIn) {
      maybeFetchNotificationsAsync();
    }
  }, [isSignedIn]);

  // fetch notifs when the app foregrounds
  useAppState(
    React.useCallback((state) => {
      if (state === 'active') {
        maybeFetchNotificationsAsync();
      }
    }, [])
  );

  let navigator;
  if (isSignedIn) {
    navigator = <MainAppNavigator />;
  } else {
    navigator = <InitialAuthNavigator />;
  }

  return (
    <NavigationContainer
      onReady={() => BootSplash.hide({ fade: true })}
      theme={NavigationTheme}
      ref={navRefCallback}
      onStateChange={onNavigationStateChange}>
      {navigator}
    </NavigationContainer>
  );
};
