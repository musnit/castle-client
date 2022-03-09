import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { useFocusEffect } from '../ReactNavigation';
import { useGameViewAndroidBackHandler } from '../common/GameViewAndroidBackHandler';
import { CommentsSheet } from '../comments/CommentsSheet';
import { DecksFeed } from '../components/DecksFeed';
import { PopoverProvider } from '../components/PopoverProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '../ReactNavigation';
import * as Constants from '../Constants';
import { NativeDecksFeed } from '../components/NativeDecksFeed';

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

  let deck = null;
  if (decks) {
    if (initialDeckIndex < decks.length) {
      deck = decks[initialDeckIndex];
    } else {
      deck = decks[0];
    }
  }

  const deckId = deck?.deckId;

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
    }, [])
  );

  const [isCommentsVisible, setIsCommentsVisible] = React.useState(false);
  const openComments = React.useCallback(() => setIsCommentsVisible(true), []);
  const closeComments = React.useCallback(() => setIsCommentsVisible(false), []);

  React.useEffect(closeComments, [decks]);

  const { pop } = useNavigation();
  const onHardwareBackPress = React.useCallback(() => {
    if (isCommentsVisible) {
      closeComments();
      return true;
    }

    pop();
    return true;
  }, [pop, isCommentsVisible, closeComments]);
  useGameViewAndroidBackHandler({ onHardwareBackPress });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PopoverProvider>
        {Constants.USE_NATIVE_FEED ? (
          <NativeDecksFeed
            onPressComments={openComments}
            isCommentsOpen={isCommentsVisible}
            onCloseComments={closeComments}
            deckIds={decks.map(deck => deck.deckId)}
            initialDeckIndex={initialDeckIndex}
            screenId={title}
            title={title}
            showBackButton={true}
          />
        ) : (
          <DecksFeed
            decks={decks}
            isPlaying={true}
            onPressDeck={({ deckId }) => {
              if (deckId) {
                // don't throw: this can happen if we render a singleton DecksFeed
                // via PlayDeckScreen, and the user manages to tap before the `ready` flag is set,
                // which should just be a no-op while we wait for the deck to mount
                console.warn(`Changing deckId from PlayDeckScreen is not yet supported`);
              }
              pop();
            }}
            onPressComments={openComments}
            onCloseComments={closeComments}
            isCommentsOpen={isCommentsVisible}
          />
        )}
        <CommentsSheet
          isFullScreen
          isOpen={isCommentsVisible}
          onClose={closeComments}
          deck={deck}
        />
      </PopoverProvider>
    </SafeAreaView>
  );
};
