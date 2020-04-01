// Assemble all the `*Screen`s together using `*Navigator`s. Confine navigation things to this
// module so that the app's navigation flow is always clear.

import React, { Fragment } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import createSpaceNavigator from './SpaceNavigator/createSpaceNavigator';
import { Text, View, Image } from 'react-native';
import FastImage from 'react-native-fast-image';

import * as Constants from './Constants';
import { useSession } from './Session';

import { LoginScreen, CreateAccountScreen, ForgotPasswordScreen } from './AuthScreens';
import CreateScreen from './CreateScreen';
import CreateDeckNavigator from './CreateDeckNavigator';
import DecksFlipper from './DecksFlipper';
import * as DeepLinks from './DeepLinks';
import HomeScreen from './HomeScreen';
import PlayDeckScreen from './PlayDeckScreen';
import ProfileScreen from './ProfileScreen';
import ProfileGamesScreen from './ProfileGamesScreen';

const Stack = createStackNavigator();
const Space = createSpaceNavigator();

const ICON_SIZE = 24;

// App UI layout

let HomeNavigator;

if (Constants.USE_CARDS_PROTOTYPE) {
  HomeNavigator = DecksFlipper;
} else {
  HomeNavigator = () => (
    <Stack.Navigator
      headerLayoutPreset="left"
      options={{
        headerTitle: (
          <View style={{ paddingHorizontal: 16, flexDirection: 'row', alignItems: 'flex-end' }}>
            <FastImage
              style={{
                width: 30,
                aspectRatio: 1,
                marginBottom: 4,
                marginRight: 8,
              }}
              source={require('../assets/images/castle-classic-yellow.png')}
            />
            <Text style={{ fontSize: 24, letterSpacing: 0.5, fontFamily: 'RTAliasGrotesk-Bold' }}>
              Castle
            </Text>
          </View>
        ),
      }}>
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          headerStyle: {
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.2,
            shadowRadius: 1.41,
            elevation: 2,
          },
        }}
      />
    </Stack.Navigator>
  );
}

const CreateNavigator = () => (
  <Stack.Navigator headerMode="none">
    <Stack.Screen
      name="Create"
      component={CreateScreen}
      options={{
        title: 'Create',
      }}
    />
    <Stack.Screen name="CreateDeck" component={CreateDeckNavigator} />
  </Stack.Navigator>
);

const ProfileNavigator = () => (
  <Stack.Navigator headerMode="none">
    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    <Stack.Screen name="PlayDeck" component={PlayDeckScreen} />
  </Stack.Navigator>
);

const SpaceNavigator = () => (
  <Space.Navigator>
    <Space.Screen name="Play" component={HomeNavigator} />
    {Constants.USE_CARDS_PROTOTYPE && <Space.Screen name="Create" component={CreateNavigator} />}
    <Space.Screen
      name="Profile"
      component={Constants.USE_CARDS_PROTOTYPE ? ProfileNavigator : ProfileGamesScreen}
    />
  </Space.Navigator>
);

const AuthNavigator = () => (
  <Stack.Navigator headerMode="none">
    <Stack.Screen name="LoginScreen" component={LoginScreen} />
    <Stack.Screen name="CreateAccountScreen" component={CreateAccountScreen} />
    <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

export const RootNavigator = () => {
  const { isSignedIn } = useSession();
  return (
    <NavigationContainer ref={DeepLinks.setNavigationRef}>
      {isSignedIn ? <SpaceNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
