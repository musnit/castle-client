// Assemble all the `*Screen`s together using `*Navigator`s. Confine navigation things to this
// module so that the app's navigation flow is always clear.

import React, { Fragment } from 'react';
import { NavigationContainer } from '@react-navigation/native';
// TODO: BEN import { createSwitchNavigator, createAppContainer } from 'react-navigation';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Image } from 'react-native';
import FastImage from 'react-native-fast-image';

import * as Constants from './Constants';
import * as Session from './Session';

import { LoginScreen, CreateAccountScreen, ForgotPasswordScreen } from './AuthScreens';
// TODO: BEN import CardTransition from './NavigationCardTransition';
import CreateScreen from './CreateScreen';
import CreateCardScreen from './CreateCardScreen';
import CreateDeckScreen from './CreateDeckScreen';
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
  // headerMode: 'none',
  // transitionConfig: () => CardTransition,
  HomeNavigator = () => (
    <Stack.Navigator
      sceneOptions={({ navigation }) => {
        return {
          tabBarVisible: navigation.state.index == 0,
        };
      }}>
      <Stack.Screen name="HomeScreen" component={DecksScreen} />
      <Stack.Screen name="PlayCard" component={PlayCardScreen} />
    </Stack.Navigator>
  );
} else {
  // TODO: BEN
  //    headerLayoutPreset: 'left',
  // home HeaderTitle
  /*
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
  */
  HomeNavigator = () => (
    <Stack.Navigator>
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

// TODO: BEN
// CreateDeckScreen was formerly CreateDeckNavigator,
// a switch nav between deck and card
const CreateNavigator = () => (
  <Stack.Navigator
    screenOptions={({ navigation }) => {
      return {
        headerMode: 'none',
        tabBarVisible: navigation.state.index == 0,
      };
    }}>
    <Stack.Screen
      name="Create"
      component={CreateScreen}
      options={{
        title: 'Create',
      }}
    />
    <Stack.Screen name="CreateDeck" component={CreateDeckScreen} />
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
      options={{
        tabBarIcon: ({ focused, tintColor }) => {
          return (
            <Image
              style={{
                width: 28,
                height: 28,
                tintColor: tintColor,
              }}
              source={require('../assets/images/chess-figures.png')}
            />
          );
        },
      }}
    />
    {Constants.USE_CARDS_PROTOTYPE && (
      <Tab.Screen
        name="Create"
        component={CreateNavigator}
        options={{
          tabBarIcon: ({ focused, tintColor }) => {
            return (
              <Image
                style={{
                  width: 28,
                  height: 28,
                  tintColor: tintColor,
                }}
                source={require('../assets/images/add-card.png')}
              />
            );
          },
        }}
      />
    )}
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ focused, tintColor }) => {
          return (
            <Image
              style={{
                width: 28,
                height: 28,
                tintColor: tintColor,
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
  <Stack.Navigator screenOptions={{ headerMode: 'none' }}>
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
