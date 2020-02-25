// Assemble all the `*Screen`s together using `*Navigator`s. Confine navigation things to this
// module so that the app's navigation flow is always clear.

import React, { Fragment } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Image } from 'react-native';
import FastImage from 'react-native-fast-image';

import * as Constants from './Constants';
import * as Session from './Session';

import { LoginScreen, CreateAccountScreen, ForgotPasswordScreen } from './AuthScreens';
// TODO: BEN import CardTransition from './NavigationCardTransition';
import CreateScreen from './CreateScreen';
import CreateDeckNavigator from './CreateDeckNavigator';
import DecksScreen from './DecksScreen';
import HomeScreen from './HomeScreen';
import PlayCardScreen from './PlayCardScreen';
import ProfileScreen from './ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// App UI layout

let HomeNavigator;

if (Constants.USE_CARDS_PROTOTYPE) {
  // TODO: BEN
  // transitionConfig: () => CardTransition,
  HomeNavigator = () => (
    <Stack.Navigator headerMode="none">
      <Stack.Screen name="HomeScreen" component={DecksScreen} />
      <Stack.Screen name="PlayCard" component={PlayCardScreen} />
    </Stack.Navigator>
  );
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

const TabNavigator = () => (
  <Tab.Navigator
    tabBarOptions={{
      activeTintColor: '#9955c8',
      inactiveTintColor: '#aaa',
      style: {
        height: 60,
      },
      tabStyle: {
        padding: 6,
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
                  width: 28,
                  height: 28,
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
            tabBarVisible: !route.state || route.state.index == 0,
            tabBarIcon: ({ focused, color }) => {
              return (
                <Image
                  style={{
                    width: 28,
                    height: 28,
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
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ focused, color }) => {
          return (
            <Image
              style={{
                width: 28,
                height: 28,
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

// TODO: reenable deep linking for react nav 5.x
// ref={DeepLinks.setRootNavigatorRef} enableURLHandling={false}
export const RootNavigator = () => (
  <NavigationContainer>
    {Session.isSignedIn() ? <TabNavigator /> : <AuthNavigator />}
  </NavigationContainer>
);
