import React from 'react';
import { BackHandler, StatusBar, StyleSheet, View } from 'react-native';
import { useIsFocused, useFocusEffect } from '../ReactNavigation';

import { DecksFeed } from '../components/DecksFeed';
import { PopoverProvider } from '../components/PopoverProvider';
import { useNavigation } from '../ReactNavigation';
import { useListen } from '../ghost/GhostEvents';
import { useSafeArea } from 'react-native-safe-area-context';

import * as Constants from '../Constants';
import * as Utilities from '../common/utilities';

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

  const insets = useSafeArea();

  const { pop } = useNavigation();
  if (Constants.Android) {
    const onHardwareBackPress = React.useCallback(() => pop(), [pop]);

    // with no game loaded, use standard back handler
    useFocusEffect(
      React.useCallback(() => {
        BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);

        return () => BackHandler.removeEventListener('hardwareBackPress', onHardwareBackPress);
      }, [onHardwareBackPress])
    );

    // after the game loads, it listens for keyboard events and
    // causes react native's back button event to fail
    useListen({
      eventName: 'CASTLE_SYSTEM_BACK_BUTTON',
      handler: onHardwareBackPress,
    });
  }

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
    }, [])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
    </View>
  );
};
