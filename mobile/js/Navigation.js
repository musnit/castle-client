// Assemble all the `*Screen`s together using `*Navigator`s. Confine navigation things to this
// module so that the app's navigation flow is always clear.

import React, { Fragment } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import createSpaceNavigator from './SpaceNavigator/createSpaceNavigator';
import { Text, View, Image } from 'react-native';
import FastImage from 'react-native-fast-image';

import { useSession } from './Session';

import { LoginScreen, CreateAccountScreen, ForgotPasswordScreen } from './AuthScreens';
import CreateScreen from './CreateScreen';
import CreateDeckNavigator from './CreateDeckNavigator';
import DecksFlipper from './DecksFlipper';
import * as DeepLinks from './DeepLinks';
import PlayDeckScreen from './PlayDeckScreen';
import ProfileScreen from './ProfileScreen';
import * as GhostChannels from './ghost/GhostChannels';

const Stack = createStackNavigator();
const Space = createSpaceNavigator();

const ICON_SIZE = 24;

// App UI layout

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

const SpaceNavigator = () => (
  <Space.Navigator initialRouteName="Play">
    <Space.Screen name="Profile" component={ProfileNavigator} />
    <Space.Screen name="Play" component={DecksFlipper} />
    <Space.Screen name="Create" component={CreateNavigator} />
  </Space.Navigator>
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
      {isSignedIn ? <SpaceNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
