import React from 'react';
import { LogBox, Platform } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import { NuxScreen } from './nux/NuxScreen';
import { PlayDeckScreen } from './play/PlayDeckScreen';
import { ProfileScreen } from './profile/ProfileScreen';
import { ShareDeckScreen } from './share/ShareDeckScreen';
import { UserListScreen } from './components/UserListScreen';
import { ViewSourceNavigator } from './create/ViewSourceNavigator';
import { DeckRemixesScreen } from './play/DeckRemixesScreen';

import createTopTabNavigator from './navigator/createTopTabNavigator';
import Icon from 'react-native-vector-icons/MaterialIcons';

import * as DeepLinks from './DeepLinks';
import * as GhostChannels from './ghost/GhostChannels';
import * as PushNotifications from './PushNotifications';
import * as Constants from './Constants';

import FastImage from 'react-native-fast-image';

enableScreens();
const Stack = createNativeStackNavigator();
const Tab = createTopTabNavigator();

// we access the navigation route's "secret" index in order to decide whether to show the tab bar.
// the solution recommended by the react-nav authors isn't sufficient for our case,
// so just suppress these warnings.
// see further discussion: https://github.com/react-navigation/react-navigation/issues/9056
LogBox.ignoreLogs([
  "Accessing the 'state' property of the 'route' object is not supported. If you want to get the focused route name, use the 'getFocusedRouteNameFromRoute' helper instead: https://reactnavigation.org/docs/5.x/screen-options-resolution/#setting-parent-screen-options-based-on-child-navigators-state",
]);

const ICON_SIZE = 28;

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

const getIsTabBarVisible = ({ route, navigation }) => {
  const tabState = navigation.getState();
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
  const { notificationsBadgeCount } = useSession();
  // fetch notifications when a notif arrives while we're running
  const handlePushNotification = React.useCallback(({ data, clicked }) => {
    if (data?.numUnseenNotifications && !clicked) {
      // Update badge so we don't have to wait on maybeFetchNotificationsAsync() to do it
      setNotifBadge(data.numUnseenNotifications);
    }
    if (clicked && rootNavRef.current) {
      // pass the `screen` param to ensure we pop to the top of the stack
      rootNavRef.current.navigate('Notifications', { screen: 'Notifications' });
    }
    setTimeout(maybeFetchNotificationsAsync, 250);
  }, []);
  PushNotifications.usePushNotifications({
    onClicked: (data) => handlePushNotification({ data, clicked: true }),
    onReceived: (data) => handlePushNotification({ data, clicked: false }),
  });

  const initialPushData = PushNotifications.getInitialData();
  return (
    <Tab.Navigator
      initialRouteName={initialPushData ? 'Notifications' : 'Browse'}
      screenOptions={(props) => {
        const isTabBarVisible = getIsTabBarVisible(props);
        return {
          tabBarNuxHideIcons: false, // TODO: set to `true` if nux not completed
          headerShown: false,
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#888',
          tabBarStyle: {
            borderTopColor: '#888',
            backgroundColor: '#000',
            display: isTabBarVisible ? undefined : 'none',
          },
          tabBarShowLabel: false,
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

const NuxNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="NuxScreen" component={NuxScreen} />
  </Stack.Navigator>
);

const ModalCreateDeckNavigator = () => (
  <Stack.Navigator
    screenOptions={({ navigation }) => ({
      headerTintColor: '#fff',
      headerLeft: () => (
        <Constants.CastleIcon
          name="close"
          size={24}
          color="#fff"
          onPress={() => navigation.pop()}
        />
      ),
      headerStyle: {
        backgroundColor: '#000',
        justifyContent: 'center',
      },
      headerTitleStyle: {
        fontFamily: 'Basteleur-Bold',
        fontSize: 20,
      },
    })}>
    <Stack.Screen
      name="CreateChooseKitScreen"
      component={CreateChooseKitScreen}
      options={{ title: 'New Deck' }}
    />
  </Stack.Navigator>
);

const AuthNavigator = () => (
  <Stack.Navigator
    screenOptions={({ navigation }) => ({
      headerTintColor: '#fff',
      headerLeft: () => (
        <Icon name="close" size={24} color="#fff" onPress={() => navigation.pop()} />
      ),
      headerStyle: {
        backgroundColor: '#000',
      },
    })}>
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
  GhostChannels.globalPause();
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
      theme={NavigationTheme}
      ref={navRefCallback}
      onStateChange={onNavigationStateChange}>
      {navigator}
    </NavigationContainer>
  );
};
