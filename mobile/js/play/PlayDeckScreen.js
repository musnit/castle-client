import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeArea, SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';

import { CardCell } from '../components/CardCell';
import { PlayDeckActions } from './PlayDeckActions';
import { PlayDeckNavigator } from './PlayDeckNavigator';
import { useNavigation } from '@react-navigation/native';
import { useListen } from '../ghost/GhostEvents';

import Viewport from '../viewport';

import * as Constants from '../Constants';
import * as Utilities from '../utilities';

const { vw, vh } = Viewport;

// if the screen is too stubby, add horizontal padding to the feed
// such that the aspect-fit cards are 87% of the screen height
const STUBBY_SCREEN_ITEM_HORIZ_PADDING = Viewport.isCardWide
  ? 0
  : (87 * vh * Constants.CARD_RATIO - 100 * vw) / -2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  itemContainer: {
    width: '100%',
    alignItems: 'center',
  },
  itemCard: {
    aspectRatio: Constants.CARD_RATIO,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  absoluteFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  title: {
    fontSize: 16,
    color: Constants.colors.white,
    fontWeight: 'bold',
  },
});

const makeCardAspectFitStyles = () => {
  if (Viewport.isCardWide) {
    return styles.itemContainer;
  }
  return [
    styles.itemContainer,
    {
      paddingHorizontal: STUBBY_SCREEN_ITEM_HORIZ_PADDING,
    },
  ];
};

const cardAspectFitStyles = makeCardAspectFitStyles();

// renders the current focused deck in the feed
// including the interactive scene.
const CurrentDeckCell = ({ deck, paused }) => {
  const isFocused = useIsFocused();

  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    let timeout;
    let active = true;
    if (deck) {
      timeout = setTimeout(() => {
        active && isFocused && setReady(true);
      }, 10);
    } else {
      active && setReady(false);
    }
    return () => {
      setReady(false);
      active = false;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [deck, isFocused]);

  return (
    <View style={styles.itemCard}>
      <CardCell card={deck.initialCard} isFullSize={true} />
      {ready ? (
        <View style={styles.absoluteFill}>
          <PlayDeckNavigator
            deckId={deck.deckId}
            initialCardId={deck.initialCard && deck.initialCard.cardId}
            initialDeckState={Utilities.makeInitialDeckState(deck)}
            paused={paused}
          />
        </View>
      ) : null}
      <PlayDeckActions deck={deck} />
    </View>
  );
};

export const PlayDeckScreen = ({ decks, title, route }) => {
  const [currentCardIndex, setCurrentCardIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  if (!decks && route?.params) {
    decks = route.params.decks;
    title = route.params.title;
  }

  const { popToTop } = useNavigation();
  if (Constants.Android) {
    // after the game loads, it listens for keyboard events and
    // causes react native's back button event to fail
    useListen({
      eventName: 'CASTLE_SYSTEM_BACK_BUTTON',
      handler: popToTop,
    });
  }

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
    }, [])
  );

  if (!decks) {
    return <View style={styles.container} />;
  }

  const currentDeck = decks[currentCardIndex];
  const prevCard = currentCardIndex > 0 ? decks[currentCardIndex - 1].initialCard : null;
  const nextCard =
    currentCardIndex < decks.length - 1 ? decks[currentCardIndex + 1].initialCard : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={cardAspectFitStyles}>
        <CurrentDeckCell deck={currentDeck} paused={paused} />
      </View>
    </SafeAreaView>
  );
};
