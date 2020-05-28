import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { ApolloProvider } from '@apollo/react-hooks';
import { RootNavigator } from './Navigation';
import BootSplash from 'react-native-bootsplash';
import DevMenu from '@terrysahaidak/react-native-devmenu';
import * as GhostEvents from './ghost/GhostEvents';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as Constants from './Constants';
import * as Session from './Session';
import { androidTextCutoffKludge } from './utilities';

let bootSplashHidden = false;

const Main = () => {
  const { initialized } = Session.useSession();

  if (Constants.Android) {
    React.useEffect(() => {
      // https://github.com/facebook/react-native/issues/15114
      androidTextCutoffKludge();
    }, [Text]);
  }

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
      <DevMenu numberOfTouches={4}>
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
      </DevMenu>
    </View>
  );
};

export default MainProvider;
