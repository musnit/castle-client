import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { useFocusEffect } from '../ReactNavigation';
import { useGameViewAndroidBackHandler } from '../common/GameViewAndroidBackHandler';
import { DecksFeed } from '../components/DecksFeed';
import { PopoverProvider } from '../components/PopoverProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '../ReactNavigation';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

// TODO: support list of decks
// and distinguish "go back out of this screen" from "collapse current deck but
// stay on this screen"
export const PlayDeckScreen = ({ decks, initialDeckIndex = 0, title, route }) => {
  if (!decks && route?.params) {
    decks = route.params.decks;
    title = route.params.title;
    initialDeckIndex = route.params.initialDeckIndex ?? 0;
  }
  // TODO: BEN: respect initialDeckIndex

  const { pop } = useNavigation();
  const onHardwareBackPress = React.useCallback(() => pop(), [pop]);
  useGameViewAndroidBackHandler({ onHardwareBackPress });

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PopoverProvider>
        <DecksFeed
          decks={decks}
          isPlaying={true}
          onPressDeck={({ deckId }) => {
            if (deckId) {
              throw new Error(`Changing deckId from PlayDeckScreen is not yet supported`);
            }
            pop();
          }}
        />
      </PopoverProvider>
    </SafeAreaView>
  );
};
