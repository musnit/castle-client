import React from 'react';
import { LogBox } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { createNativeStackNavigator } from 'react-native-screens/native-stack';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSession, maybeFetchNotificationsAsync, setNotifBadge } from './Session';

import { LoginScreen, CreateAccountScreen, ForgotPasswordScreen } from './auth/AuthScreens';
import { InitialAuthScreen } from './auth/InitialAuthScreen';
import { CreateScreen } from './create/CreateScreen';
import { CreateDeckNavigator } from './create/CreateDeckNavigator';
import { useAppState } from './ghost/GhostAppState';
import { HomeScreen } from './home/HomeScreen';
import { ExploreScreen } from './explore/ExploreScreen';
import { ExploreFeed } from './explore/ExploreFeed';
import { NotificationsScreen } from './notifications/NotificationsScreen';
import { PlayDeckScreen } from './play/PlayDeckScreen';
import { ProfileScreen } from './profile/ProfileScreen';
import { ShareDeckScreen } from './share/ShareDeckScreen';
import { UserListScreen } from './components/UserListScreen';
import { ViewSourceNavigator } from './create/ViewSourceNavigator';

import Icon from 'react-native-vector-icons/MaterialIcons';

import * as DeepLinks from './DeepLinks';
import * as GhostChannels from './ghost/GhostChannels';
import * as PushNotifications from './PushNotifications';

import FastImage from 'react-native-fast-image';

enableScreens();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// we access the navigation route's "secret" index in order to decide whether to show the tab bar.
// the solution recommended by the react-nav authors isn't sufficient for our case,
// so just suppress these warnings.
// see further discussion: https://github.com/react-navigation/react-navigation/issues/9056
LogBox.ignoreLogs([
  "Accessing the 'state' property of the 'route' object is not supported. If you want to get the focused route name, use the 'getFocusedRouteNameFromRoute' helper instead: https://reactnavigation.org/docs/screen-options-resolution/#setting-parent-screen-options-based-on-child-navigators-state",
]);

const ICON_SIZE = 28;

// App UI layout

const BrowseNavigator = () => (
  <Stack.Navigator
    initialRouteName="HomeScreen"
    screenOptions={{
      headerShown: false,
    }}>
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
    <Stack.Screen name="PlayDeck" component={PlayDeckScreen} options={{ gestureEnabled: false }} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen
      name="ViewSource"
      component={ViewSourceNavigator}
      options={{ gestureEnabled: false }}
    />
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
    <Stack.Screen name="PlayDeck" component={PlayDeckScreen} options={{ gestureEnabled: false }} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen
      name="ViewSource"
      component={ViewSourceNavigator}
      options={{ gestureEnabled: false }}
    />
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
      options={{ gestureEnabled: false }}
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
    <Stack.Screen name="PlayDeck" component={PlayDeckScreen} options={{ gestureEnabled: false }} />
    <Stack.Screen
      name="ViewSource"
      component={ViewSourceNavigator}
      options={{ gestureEnabled: false }}
    />
  </Stack.Navigator>
);

const ProfileNavigator = () => (
  <Stack.Navigator
    initialRouteName="Profile"
    screenOptions={{
      headerShown: false,
    }}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="PlayDeck" component={PlayDeckScreen} options={{ gestureEnabled: false }} />
    <Stack.Screen
      name="ViewSource"
      component={ViewSourceNavigator}
      options={{ gestureEnabled: false }}
    />
  </Stack.Navigator>
);

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
      tabBarOptions={{
        activeTintColor: '#fff',
        inactiveTintColor: '#888',
        style: {
          borderTopColor: '#888',
          backgroundColor: '#000',
        },
        showLabel: false,
      }}>
      <Tab.Screen
        name="Browse"
        component={BrowseNavigator}
        options={({ route }) => {
          const isHome = route.state?.index === 0;
          let isPlayingFeedDeck = false;
          if (route?.state?.routes && route.state.routes.length) {
            isPlayingFeedDeck = route.state.routes[0].params?.deckId !== undefined;
          }
          return {
            tabBarVisible: !route.state || (isHome && !isPlayingFeedDeck),
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
          };
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreNavigator}
        options={({ route }) => {
          return {
            tabBarVisible: !route.state || route.state.index == 0,
            tabBarIcon: ({ focused, color }) => {
              return (
                <FastImage
                  tintColor={color}
                  style={{
                    width: ICON_SIZE + 2,
                    height: ICON_SIZE + 2,
                  }}
                  source={require('../assets/images/BottomTabs-explore.png')}
                />
              );
            },
          };
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateNavigator}
        options={({ route }) => ({
          tabBarVisible: !route.state || route.state.index == 0,
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
        })}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsNavigator}
        options={({ route }) => ({
          tabBarVisible: !route.state || route.state.index == 0,
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
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={({ route }) => ({
          tabBarVisible: !route.state || route.state.index == 0,
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
        })}
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
      stackPresentation: 'modal',
    }}>
    <Stack.Screen name="TabNavigator" component={TabNavigator} />
    <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
  </Stack.Navigator>
);

export const RootNavigator = () => {
  const { isSignedIn, isAnonymous } = useSession();

  // fetch notifs when we first notice a signed in user (including every app InitialAuth)
  React.useEffect(() => {
    if (isSignedIn && !isAnonymous) {
      maybeFetchNotificationsAsync();
    }
  }, [isSignedIn, isAnonymous]);

  // fetch notifs when the app foregrounds
  useAppState(
    React.useCallback(
      (state) => {
        if (state === 'active' && !isAnonymous) {
          maybeFetchNotificationsAsync();
        }
      },
      [isAnonymous]
    )
  );

  return (
    <NavigationContainer
      theme={NavigationTheme}
      ref={navRefCallback}
      onStateChange={onNavigationStateChange}>
      {isSignedIn ? <MainAppNavigator /> : <InitialAuthNavigator />}
    </NavigationContainer>
  );
};
