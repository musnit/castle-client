import React, { useState, useEffect } from 'react';
import { View, StatusBar } from 'react-native';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { ApolloProvider } from '@apollo/react-hooks';
import BootSplash from 'react-native-bootsplash';
import DevMenu from '@terrysahaidak/react-native-devmenu';

import * as Session from './Session';
import MainSwitcher from './MainSwitcher';

let bootSplashHidden = false;

const Main = () => {
  // Session not yet initialized? Just show a loading screen...
  // TODO: BEN: restore
  /* if (!sessionHook.initialized) {
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
  } */

  if (!bootSplashHidden) {
    setTimeout(() => BootSplash.hide({ duration: 150 }), 100);
    bootSplashHidden = true;
  }

  return (
    <View style={{ flex: 1 }}>
      <DevMenu numberOfTouches={4}>
        <StatusBar backgroundColor="white" barStyle="dark-content" />
        <Session.Provider>
          <ApolloProvider client={Session.apolloClient}>
            <ActionSheetProvider>
              <MainSwitcher />
            </ActionSheetProvider>
          </ApolloProvider>
        </Session.Provider>
      </DevMenu>
    </View>
  );
};

export default Main;
