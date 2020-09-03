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
            backgroundColor: 'red',
          }}
        />
      );
    }

    return React.Children.only(props.children);
  };

  const WrapWithProviders = (props) => {
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

  const NewestDecksWrapped = (props) => {
    return (
      <WrapWithProviders navigatorId={props.navigatorId}>
        <NewestDecks />
      </WrapWithProviders>
    );
  };

  const PlayDeckScreenWrapped = (props) => {
    return (
      <WrapWithProviders navigatorId={props.navigatorId}>
        <PlayDeckScreen {...JSON.parse(props.navigationScreenOptions)} />
      </WrapWithProviders>
    );
  };

  const ProfileScreenWrapped = (props) => {
    return (
      <WrapWithProviders navigatorId={props.navigatorId}>
        <ProfileScreen />
      </WrapWithProviders>
    );
  };

  AppRegistry.registerComponent('NewestDecks', () => NewestDecksWrapped);
  AppRegistry.registerComponent('PlayDeckScreen', () => PlayDeckScreenWrapped);
  AppRegistry.registerComponent('ProfileScreen', () => ProfileScreenWrapped);
}

export default MainProvider;
