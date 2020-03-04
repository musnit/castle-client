import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

import { RootNavigator } from './Navigation';
import GameScreen, { goToGame } from './GameScreen';
import { TouchableOpacity } from 'react-native-gesture-handler';

export let switchTo = () => {};

export let setGameRunning = () => {};

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: -1,
  },
  fullscreen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  windowed: {
    position: 'absolute',
    bottom: 74,
    left: 16,
    zIndex: 1,
    backgroundColor: '#000',
    width: 135,
    aspectRatio: 9 / 16,
    borderRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
});

export const MainSwitcherContext = React.createContext({ mode: 'navigator' });

const MainSwitcher = () => {
  // `mode` is one of `'game'` or `'navigator'`
  const [mode, setMode] = useState('navigator');

  let gameRunning;
  [gameRunning, setGameRunning] = useState(false);

  switchTo = async (newMode) => {
    if (mode !== newMode) {
      if (mode === 'game') {
        goToGame({});
        await new Promise((resolve) => setTimeout(resolve, 200));
        setMode('navigator');
      }
      setMode(newMode);
    }
  };

  return (
    <MainSwitcherContext.Provider value={{ mode }}>
      <View style={{ flex: 1, backgroundColor: 'white', position: 'relative' }}>
        <View style={{ flex: 1 }}>
          <View
            style={
              !gameRunning ? styles.hidden : mode === 'game' ? styles.fullscreen : styles.windowed
            }>
            <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
              <GameScreen windowed={mode !== 'game'} />
              {mode === 'navigator' && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                  }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (gameRunning) {
                        setMode('game');
                      }
                    }}>
                    <View
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                    />
                  </TouchableOpacity>
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                    }}>
                    <TouchableOpacity
                      onPress={() => {
                        goToGame({});
                      }}
                      style={{ padding: 8 }}>
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 28,
                          backgroundColor: '#000000aa',
                          borderWidth: 2,
                          borderColor: '#ffffffcc',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                        <Text style={{ color: '#ffffffcc', fontSize: 24, top: -2 }}>×</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </SafeAreaView>
          </View>
          <RootNavigator />
        </View>
      </View>
    </MainSwitcherContext.Provider>
  );
};

export default MainSwitcher;
