import React from 'react';
import {
  InteractionManager,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeArea, SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';

import { CardCell } from '../components/CardCell';
import { PlayDeckActions } from './PlayDeckActions';
import { PlayDeckNavigator } from './PlayDeckNavigator';
import { useNavigation } from '@react-navigation/native';
import { useListen } from '../ghost/GhostEvents';

import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Viewport from '../common/viewport';

import * as Constants from '../Constants';
import * as Utilities from '../common/utilities';

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
    justifyContent: 'center',
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
    justifyContent: 'space-between',
    minHeight: 54,
  },
  title: {
    fontSize: 16,
    color: Constants.colors.white,
    fontWeight: 'bold',
    paddingHorizontal: 16,
  },
  navControlButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    flexShrink: 0,
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  centerHeading: {
    width: '100%',
    height: '100%',
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1, // required to prevent negative margin from blocking back button
    marginLeft: -54, // required to center properly with back button
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
  const [ready, setReady] = React.useState(false);
  useFocusEffect(
    React.useCallback(() => {
      let timeout;
      const task = InteractionManager.runAfterInteractions(() => {
        if (deck) {
          timeout = setTimeout(() => {
            setReady(true);
          }, 10);
        } else {
          setReady(false);
        }
      });
      return () => {
        if (timeout) {
          clearTimeout(timeout);
          timeout = undefined;
        }
        setReady(false);
        task.cancel();
      };
    }, [deck])
  );

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

export const PlayDeckScreen = ({ decks, initialDeckIndex = 0, title, route }) => {
  if (!decks && route?.params) {
    decks = route.params.decks;
    title = route.params.title;
    initialDeckIndex = route.params.initialDeckIndex ?? 0;
  }

  const [deckIndex, setDeckIndex] = React.useState(initialDeckIndex);
  const [paused, setPaused] = React.useState(false);

  const { pop } = useNavigation();
  if (Constants.Android) {
    // after the game loads, it listens for keyboard events and
    // causes react native's back button event to fail
    useListen({
      eventName: 'CASTLE_SYSTEM_BACK_BUTTON',
      handler: () => pop(),
    });
  }

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
    }, [])
  );

  const onPressPrevious = React.useCallback(() => {
    if (deckIndex > 0) {
      setDeckIndex(deckIndex - 1);
    }
  }, [deckIndex]);

  const onPressNext = React.useCallback(() => {
    if (deckIndex < decks.length - 1) {
      setDeckIndex(deckIndex + 1);
    }
  }, [deckIndex]);

  const currentDeck = decks[deckIndex];
  const prevDeck = deckIndex > 0 ? decks[deckIndex - 1] : null;
  const nextDeck = deckIndex < decks.length - 1 ? decks[deckIndex + 1] : null;

  if (!decks) {
    return <View style={styles.container} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => pop()}>
          <Icon name="arrow-back" size={32} color="#fff" />
        </TouchableOpacity>
        <View style={styles.centerHeading}>
          <TouchableOpacity onPress={onPressPrevious} style={styles.navControlButton}>
            <Icon name="skip-previous" color={prevDeck ? '#fff' : '#666'} size={40} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onPressNext} style={styles.navControlButton}>
            <Icon name="skip-next" color={nextDeck ? '#fff' : '#666'} size={40} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={cardAspectFitStyles}>
        <CurrentDeckCell deck={currentDeck} paused={paused} />
      </View>
    </SafeAreaView>
  );
};
