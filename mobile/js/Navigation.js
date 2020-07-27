// Assemble all the `*Screen`s together using `*Navigator`s. Confine navigation things to this
// module so that the app's navigation flow is always clear.

import React, { Fragment } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View, Image } from 'react-native';
import FastImage from 'react-native-fast-image';

import { useSession } from './Session';

import { LoginScreen, CreateAccountScreen, ForgotPasswordScreen } from './AuthScreens';
import { CreateScreen } from './create/CreateScreen';
import { CreateDeckNavigator } from './create/CreateDeckNavigator';
import { HomeScreen } from './home/HomeScreen';
import * as DeepLinks from './DeepLinks';
import PlayDeckScreen from './PlayDeckScreen';
import ProfileScreen from './ProfileScreen';
import * as GhostChannels from './ghost/GhostChannels';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const ICON_SIZE = 24;

// App UI layout

const BrowseNavigator = () => (
  <Stack.Navigator headerMode="none" initialRouteName="HomeScreen">
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
    <Stack.Screen name="PlayDeck" component={PlayDeckScreen} />
  </Stack.Navigator>
);

const CreateNavigator = () => (
  <Stack.Navigator headerMode="none">
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
  <Stack.Navigator headerMode="none" initialRouteName="ProfileScreen">
    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    <Stack.Screen name="PlayDeck" component={PlayDeckScreen} />
  </Stack.Navigator>
);

const TabNavigator = () => (
  <Tab.Navigator
    initialRouteName="Browse"
    tabBarOptions={{
      activeTintColor: '#fff',
      inactiveTintColor: '#fff',
      style: {
        borderColor: '#555',
        backgroundColor: '#000',
        elevation: 0,
      },
    }}>
    <Tab.Screen
      name="Browse"
      component={BrowseNavigator}
      options={({ route }) => ({
        tabBarVisible: !route.state || route.state.index == 0,
      })}
    />
    <Tab.Screen
      name="Create"
      component={CreateNavigator}
      options={({ route }) => ({
        tabBarVisible: !route.state || route.state.index == 0,
      })}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileNavigator}
      options={({ route }) => ({
        tabBarVisible: !route.state || route.state.index == 0,
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
