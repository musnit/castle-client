// Assemble all the `*Screen`s together using `*Navigator`s. Confine navigation things to this
// module so that the app's navigation flow is always clear.

import React, { Fragment } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Image } from 'react-native';
import FastImage from 'react-native-fast-image';

import * as Constants from './Constants';
import { useSession } from './Session';

import { LoginScreen, CreateAccountScreen, ForgotPasswordScreen } from './AuthScreens';
import CreateScreen from './CreateScreen';
import CreateDeckNavigator from './CreateDeckNavigator';
import DecksFlipper from './DecksFlipper';
import DecksScreen from './DecksScreen';
import * as DeepLinks from './DeepLinks';
import HomeScreen from './HomeScreen';
import PlayDeckNavigator from './PlayDeckNavigator';
import ProfileScreen from './ProfileScreen';
import ProfileGamesScreen from './ProfileGamesScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

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
    <Stack.Screen name="PlayDeck" component={PlayDeckNavigator} />
  </Stack.Navigator>
);

const TabNavigator = () => (
  <Tab.Navigator
    tabBarOptions={{
      activeTintColor: '#fff',
      inactiveTintColor: '#fffa',
      style: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0008',
        borderTopWidth: 0,
        elevation: 0,
      },
    }}>
    <Tab.Screen
      name="Play"
      component={HomeNavigator}
      options={({ route }) => {
        return {
          tabBarVisible: !route.state || route.state.index == 0,
          tabBarIcon: ({ focused, color }) => {
            return (
              <Image
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  tintColor: color,
                }}
                source={require('../assets/images/chess-figures.png')}
              />
            );
          },
        };
      }}
    />
    {Constants.USE_CARDS_PROTOTYPE && (
      <Tab.Screen
        name="Create"
        component={CreateNavigator}
        options={({ route }) => {
          return {
            tabBarVisible: (!route.state || route.state.index == 0) && !route.params,
            tabBarIcon: ({ focused, color }) => {
              return (
                <Image
                  style={{
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    tintColor: color,
                  }}
                  source={require('../assets/images/add-card.png')}
                />
              );
            },
          };
        }}
      />
    )}
    <Tab.Screen
      name="Profile"
      component={Constants.USE_CARDS_PROTOTYPE ? ProfileNavigator : ProfileGamesScreen}
      options={{
        tabBarIcon: ({ focused, color }) => {
          return (
            <Image
              style={{
                width: ICON_SIZE,
                height: ICON_SIZE,
                tintColor: color,
              }}
              source={require('../assets/images/single-neutral-shield.png')}
            />
          );
        },
      }}
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

export const RootNavigator = () => {
  const { isSignedIn } = useSession();
  return (
    <NavigationContainer ref={DeepLinks.setNavigationRef}>
      {isSignedIn ? <TabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
