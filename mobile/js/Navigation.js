import React, { Fragment, useEffect } from 'react';
import { enableScreens } from 'react-native-screens';
import { createNativeStackNavigator } from 'react-native-screens/native-stack';
import {
  NavigationContainer,
  useNavigation as realUseNavigation,
  useFocusEffect as realUseFocusEffect,
  useScrollToTop as realUseScrollToTop,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Image } from 'react-native';
import FastImage from 'react-native-fast-image';

import { useSession } from './Session';

import { LoginScreen, CreateAccountScreen, ForgotPasswordScreen } from './AuthScreens';
import { CreateScreen } from './create/CreateScreen';
import { CreateDeckNavigator } from './create/CreateDeckNavigator';
import { PlayDeckScreen } from './play/PlayDeckScreen';
import { HomeScreen } from './home/HomeScreen';
import { ViewSourceNavigator } from './create/ViewSourceNavigator';
import * as DeepLinks from './DeepLinks';
import { ProfileScreen } from './profile/ProfileScreen';
import * as GhostChannels from './ghost/GhostChannels';

enableScreens();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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

const TabNavigator = () => (
  <Tab.Navigator
    initialRouteName="Browse"
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
      options={({ route }) => ({
        tabBarVisible: !route.state || route.state.index == 0,
        tabBarIcon: ({ focused, color }) => {
          return (
            <Image
              style={{
                width: ICON_SIZE,
                height: ICON_SIZE,
                tintColor: color,
              }}
              source={require('../assets/images/BottomTabs-browse.png')}
            />
          );
        },
      })}
    />
    <Tab.Screen
      name="Create"
      component={CreateNavigator}
      options={({ route }) => ({
        tabBarVisible: !route.state || route.state.index == 0,
        tabBarIcon: ({ focused, color }) => {
          return (
            <Image
              style={{
                width: ICON_SIZE,
                height: ICON_SIZE,
                tintColor: color,
              }}
              source={require('../assets/images/BottomTabs-create.png')}
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
            <Image
              style={{
                width: ICON_SIZE,
                height: ICON_SIZE,
                tintColor: color,
              }}
              source={require('../assets/images/BottomTabs-profile.png')}
            />
          );
        },
      })}
    />
  </Tab.Navigator>
);

const AuthNavigator = () => (
  <Stack.Navigator headerMode="none">
    <Stack.Screen name="LoginScreen" component={LoginScreen} />
    <Stack.Screen name="CreateAccountScreen" component={CreateAccountScreen} />
    <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

function onNavigationStateChange(state) {
  GhostChannels.globalPause();
}

export const RootNavigator = () => {
  const { isSignedIn } = useSession();
  return (
    <NavigationContainer ref={DeepLinks.setNavigationRef} onStateChange={onNavigationStateChange}>
      {isSignedIn ? <TabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export const AndroidNavigationContext = React.createContext({});

export const useNavigation = (...args) => {
  if (Platform.OS === 'ios') {
    return realUseNavigation(...args);
  } else {
    const { navigatorId } = React.useContext(AndroidNavigationContext);

    return {
      navigate: (screenType, navigationScreenOptions) => {
        GhostChannels.navigate(navigatorId, screenType, JSON.stringify(navigationScreenOptions));
      },

      pop: () => {
        GhostChannels.navigateBack();
      },

      push: (screenType, navigationScreenOptions) => {
        GhostChannels.navigate(navigatorId, screenType, JSON.stringify(navigationScreenOptions));
      },

      dangerouslyGetState: () => {
        return {
          index: 0,
        };
      },
    };
  }
};

export const useFocusEffect = (...args) => {
  if (Platform.OS === 'ios') {
    return realUseFocusEffect(...args);
  } else {
    return useEffect(args[0], []);
  }
};

export const useScrollToTop = (...args) => {
  if (Platform.OS === 'ios') {
    return realUseScrollToTop(...args);
  } else {
  }
};
