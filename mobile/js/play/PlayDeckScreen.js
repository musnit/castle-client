import React from 'react';
import { View, StatusBar, StyleSheet } from 'react-native';
import { useFocusEffect } from '../ReactNavigation';
import { useGameViewAndroidBackHandler } from '../common/GameViewAndroidBackHandler';
import { CommentsSheet } from '../comments/CommentsSheet';
import { PopoverProvider } from '../components/PopoverProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { useNavigation } from '../ReactNavigation';
import { NativeDecksFeed } from '../components/NativeDecksFeed';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export const PlayDeckScreen = ({ decks, initialDeckIndex = 0, title, route, paginateFeedId }) => {
  if (!decks && route?.params) {
    decks = route.params.decks;
    title = route.params.title;
    paginateFeedId = route.params.paginateFeedId;
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

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
    }, [])
  );

  const [isCommentsVisible, setIsCommentsVisible] = React.useState(false);
  const [commentsDeck, setCommentsDeck] = React.useState(null);
  const openComments = React.useCallback(({ deck }) => {
    if (deck) {
      setCommentsDeck(deck);
    }
    setIsCommentsVisible(true);
  }, []);
  const closeComments = React.useCallback(() => setIsCommentsVisible(false), []);

  React.useEffect(closeComments, [decks]);

  React.useEffect(() => {
    setCommentsDeck(deck);
  }, [deck]);

  const { pop, getState } = useNavigation();
  let previousScreenName;
  if (getState) {
    const { index, routes } = getState() || {};
    if (index > 0 && routes?.length >= index) {
      previousScreenName = routes[index - 1].name;
    }
  }
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
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <PopoverProvider>
        <ScreenHeader title={title} borderless />
        <NativeDecksFeed
          onPressComments={openComments}
          isCommentsOpen={isCommentsVisible}
          onCloseComments={closeComments}
          deckIds={decks.map((deck) => deck.deckId)}
          initialDeckIndex={initialDeckIndex}
          screenId={title}
          paginateFeedId={paginateFeedId}
          previousScreenName={previousScreenName}
        />
        <CommentsSheet
          isFullScreen
          isOpen={isCommentsVisible}
          onClose={closeComments}
          deck={commentsDeck}
        />
      </PopoverProvider>
    </SafeAreaView>
  );
};
