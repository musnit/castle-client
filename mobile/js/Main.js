import React, { useState, useEffect } from 'react';
import { View, AppRegistry, Platform } from 'react-native';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { ApolloProvider } from '@apollo/react-hooks';
import { RootNavigator, AndroidNavigationContext } from './Navigation';
import BootSplash from 'react-native-bootsplash';
import * as GhostEvents from './ghost/GhostEvents';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableAndroidFontFix } from './AndroidFontFix';

import { NewestDecks } from './home/NewestDecks';
import { PlayDeckScreen } from './play/PlayDeckScreen';
import { ProfileScreen } from './profile/ProfileScreen';
import { LoginScreen, CreateAccountScreen, ForgotPasswordScreen } from './AuthScreens';

import * as Session from './Session';

let bootSplashHidden = false;

// Fixes the problem with font rendering on OnePlus phones, like Charlie's
enableAndroidFontFix();

const Main = () => {
  const { initialized } = Session.useSession();

  // Session not yet initialized? Just show a loading screen...
  if (!initialized) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
        }}
      />
    );
  }

  if (!bootSplashHidden) {
    setTimeout(() => BootSplash.hide({ duration: 150 }), 100);
    bootSplashHidden = true;
  }
  return <RootNavigator />;
};

const MainProvider = () => {
  return (
    <View style={{ flex: 1 }}>
      <Session.Provider>
        <GhostEvents.Provider>
          <ApolloProvider client={Session.apolloClient}>
            <ActionSheetProvider>
              <SafeAreaProvider>
                <Main />
              </SafeAreaProvider>
            </ActionSheetProvider>
          </ApolloProvider>
        </GhostEvents.Provider>
      </Session.Provider>
    </View>
  );
};

if (Platform.OS === 'android') {
  const WaitForSession = (props) => {
    const { initialized } = Session.useSession();

    // Session not yet initialized? Just show a loading screen...
    if (!initialized) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'black',
          }}
        />
      );
    }

    return React.Children.only(props.children);
  };

  const AddProviders = (props) => {
    return (
      <View style={{ flex: 1 }}>
        <AndroidNavigationContext.Provider value={{ navigatorId: props.navigatorId }}>
          <Session.Provider>
            <GhostEvents.Provider>
              <ApolloProvider client={Session.apolloClient}>
                <SafeAreaProvider>
                  <WaitForSession>{React.Children.only(props.children)}</WaitForSession>
                </SafeAreaProvider>
              </ApolloProvider>
            </GhostEvents.Provider>
          </Session.Provider>
        </AndroidNavigationContext.Provider>
      </View>
    );
  };

  const WrapComponent = (Component) => {
    return () => {
      return (props) => {
        let childProps = {};
        if (props.navigationScreenOptions) {
          childProps = JSON.parse(props.navigationScreenOptions);
        }

        return (
          <AddProviders navigatorId={props.navigatorId}>
            <Component {...childProps} />
          </AddProviders>
        );
      };
    };
  };

  AppRegistry.registerComponent('NewestDecks', WrapComponent(NewestDecks));
  AppRegistry.registerComponent('PlayDeck', WrapComponent(PlayDeckScreen));
  AppRegistry.registerComponent('ProfileScreen', WrapComponent(ProfileScreen));
  AppRegistry.registerComponent('LoginScreen', WrapComponent(LoginScreen));
  AppRegistry.registerComponent('CreateAccountScreen', WrapComponent(CreateAccountScreen));
  AppRegistry.registerComponent('ForgotPasswordScreen', WrapComponent(ForgotPasswordScreen));
}

export default MainProvider;
