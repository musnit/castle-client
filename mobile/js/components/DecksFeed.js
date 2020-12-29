import React from 'react';
import {
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { CardCell } from './CardCell';
import { useSafeArea, SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';

import Viewport from '../common/viewport';

import * as Constants from '../Constants';
import * as Utilities from '../common/utilities';

const { vw, vh } = Viewport;

const FEED_HEADER_HEIGHT = 56;

// if the screen is too stubby, add horizontal padding to the feed
// such that the aspect-fit cards are 87% of the screen height
const STUBBY_SCREEN_ITEM_HORIZ_PADDING = Viewport.isCardWide
  ? 0
  : (87 * vh * Constants.CARD_RATIO - 100 * vw) / -2;

const DECK_FEED_ITEM_MARGIN = 64;
const DECK_FEED_ITEM_HEIGHT =
  (1 / Constants.CARD_RATIO) * (100 * vw - STUBBY_SCREEN_ITEM_HORIZ_PADDING * 2) + // height of card
  DECK_FEED_ITEM_MARGIN; // margin below cell

const FLIP_MIN_TRANSLATE_Y = DECK_FEED_ITEM_HEIGHT * 0.35;
const FLIP_MIN_VELOCITY_Y = 72;

const SPRING_CONFIG = {
  tension: 150,
  friction: 50,
  overshootClamping: true,
  restDisplacementThreshold: 1,
  restSpeedThreshold: 1,
  useNativeDriver: true,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  itemContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: DECK_FEED_ITEM_MARGIN,
  },
  itemCard: {
    aspectRatio: Constants.CARD_RATIO,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  cardPlaceholder: {
    position: 'absolute',
    top: -DECK_FEED_ITEM_HEIGHT - DECK_FEED_ITEM_MARGIN,
    width: '100%',
    height: DECK_FEED_ITEM_HEIGHT,
    backgroundColor: '#ff0',
    backgroundColor: '#666',
    borderRadius: 6,
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
const CurrentDeckCell = ({ deck, isPlaying, onSelectPlay }) => {
  const initialCard = deck?.initialCard;
  if (!initialCard) return null;

  // TODO:
  // outer view
  // collapsed: cardAspectFitStyles
  // expanded: full screen dimensions, center children
  //
  // inside: absolute header/footer, card view
  //
  // card view:
  // styles.itemCard
  // collapsed: CardCell, touchable to set isPlaying
  // expanded: PlayDeckNavigator

  const containerStyles = isPlaying
    ? { backgroundColor: '#f00', width: '100%', height: vh * 100, justifyContent: 'center' }
    : cardAspectFitStyles;

  return (
    <View style={containerStyles}>
      <View style={styles.itemCard}>
        <CardCell card={initialCard} previewVideo={deck?.previewVideo} onPress={onSelectPlay} />
      </View>
    </View>
  );
};

// TODO: refreshing, onRefresh, onPressDeck
export const DecksFeed = ({ decks }) => {
  const [currentCardIndex, setCurrentCardIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    setCurrentCardIndex(0);
  }, [decks]);

  const insets = useSafeArea();
  let centerContentY = insets.top + FEED_HEADER_HEIGHT;

  // state from scrolling the feed up and down
  let translateY = React.useRef(new Animated.Value(0)).current;

  // state from expanding/collapsing a deck to play it
  let playingOffsetY = React.useRef(new Animated.Value(0)).current;

  let baseContainerY = Animated.add(translateY, centerContentY - DECK_FEED_ITEM_HEIGHT);
  let containerY = Animated.add(playingOffsetY, baseContainerY);
  const onPanGestureEvent = Animated.event([{ nativeEvent: { translationY: translateY } }], {
    useNativeDriver: true,
  });

  React.useEffect(() => {
    translateY.setValue(0);
    setIsPlaying(false);
  }, [currentCardIndex]);

  React.useEffect(() => {
    let toValue = 0;
    if (isPlaying) {
      // when playing starts, put the current cell at y-position zero
      // because that cell is going to become full screen height.
      toValue = -centerContentY;
    }
    Animated.spring(playingOffsetY, { toValue, ...SPRING_CONFIG }).start();
  }, [isPlaying]);

  const snapTo = React.useCallback(
    (toValue, futureCardIndex = null) => {
      Animated.spring(translateY, { toValue, ...SPRING_CONFIG }).start(({ finished }) => {
        if (finished) {
          if (futureCardIndex !== null) {
            setCurrentCardIndex(futureCardIndex);
          } else {
            translateY.setValue(0);
          }
        }
      });
    },
    [translateY, currentCardIndex]
  );

  const snapToNext = React.useCallback(() => {
    if (decks && currentCardIndex < decks.length - 1) {
      snapTo(-DECK_FEED_ITEM_HEIGHT, currentCardIndex + 1);
    } else {
      snapTo(0);
    }
  }, [decks, currentCardIndex, snapTo]);

  const snapToPrevious = React.useCallback(() => {
    if (currentCardIndex > 0) {
      snapTo(DECK_FEED_ITEM_HEIGHT, currentCardIndex - 1);
    } else {
      snapTo(0);
    }
  }, [currentCardIndex, snapTo]);

  const onPanStateChange = React.useCallback(
    (event) => {
      if (event.nativeEvent.oldState === State.ACTIVE) {
        const { translationY, velocityY } = event.nativeEvent;
        if (translationY < -FLIP_MIN_TRANSLATE_Y || velocityY < -FLIP_MIN_VELOCITY_Y) {
          snapToNext();
        } else if (translationY > FLIP_MIN_TRANSLATE_Y || velocityY > FLIP_MIN_VELOCITY_Y) {
          snapToPrevious();
        } else {
          snapTo(0);
        }
      }
      if (event.nativeEvent.state === State.BEGAN) {
        // TODO: legacy setPaused(true);
      }
    },
    [snapTo, snapToNext, snapToPrevious]
  );

  if (!decks) {
    return <View style={styles.container} />;
  }

  const currentDeck = decks[currentCardIndex];
  const prevCard = currentCardIndex > 0 ? decks[currentCardIndex - 1].initialCard : null;
  const nextCard =
    currentCardIndex < decks.length - 1 ? decks[currentCardIndex + 1].initialCard : null;

  // the edge of the 'next-next' card is shown briefly during the snap animation
  // before the swap occurs.
  const nextNextCard =
    currentCardIndex < decks.length - 2 ? decks[currentCardIndex + 2].initialCard : null;

  return (
    <View style={styles.container}>
      <PanGestureHandler
        minDist={8}
        onGestureEvent={onPanGestureEvent}
        onHandlerStateChange={onPanStateChange}>
        <Animated.View style={{ transform: [{ translateY: containerY }] }}>
          <View style={cardAspectFitStyles}>
            <View style={styles.itemCard}>{prevCard && <CardCell card={prevCard} />}</View>
          </View>
          <CurrentDeckCell
            deck={currentDeck}
            isPlaying={isPlaying}
            onSelectPlay={() => setIsPlaying(true)}
          />
          <Animated.View style={cardAspectFitStyles}>
            <TouchableWithoutFeedback onPress={snapToNext}>
              <View style={styles.itemCard}>{nextCard && <CardCell card={nextCard} />}</View>
            </TouchableWithoutFeedback>
          </Animated.View>
          {nextNextCard && (
            <View style={cardAspectFitStyles}>
              <View style={styles.itemCard}>
                <CardCell card={nextNextCard} />
              </View>
            </View>
          )}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};
