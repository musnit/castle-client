import React from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CardCell } from './CardCell';

import Feather from 'react-native-vector-icons/Feather';
import Viewport from '../common/viewport';

import * as Constants from '../Constants';
import * as LocalId from '../common/local-id';
import * as Utilities from '../common/utilities';

let CAROUSEL_LEFT_PAD = 24;
let CAROUSEL_ITEM_WIDTH = Viewport.vw * 100 - CAROUSEL_LEFT_PAD * 2;
let CAROUSEL_HEIGHT = CAROUSEL_ITEM_WIDTH * (1.0 / Constants.CARD_RATIO) - 24;

if (CAROUSEL_HEIGHT > Viewport.vh * 75) {
  // height-constrain on short screens (e.g. ipad)
  CAROUSEL_HEIGHT = Viewport.vh * 75;
  CAROUSEL_ITEM_WIDTH = (CAROUSEL_HEIGHT + 24) * Constants.CARD_RATIO;
  CAROUSEL_LEFT_PAD = (Viewport.vw * 100 - CAROUSEL_ITEM_WIDTH) / 2;
}

let CONTAINER_TOP_PADDING = Constants.GRID_PADDING * 2;

const styles = StyleSheet.create({
  gridContainer: {
    paddingTop: CONTAINER_TOP_PADDING,
    paddingLeft: Constants.GRID_PADDING,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellContainer: {
    width: '33.3%',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    paddingTop: 6,
    paddingBottom: 4,
  },
  newCard: {
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
    aspectRatio: Constants.CARD_RATIO,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 8,
  },
  newCardTitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  cardOptions: {
    position: 'absolute',
    backgroundColor: '#fff',
    width: 32,
    height: 32,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    ...Constants.styles.dropShadow,
  },
  cardOptionsCarousel: {
    bottom: 12,
    right: 12,
  },
  cardOptionsGrid: {
    width: 24,
    height: 24,
    bottom: 4,
    right: 4,
  },
  carouselItem: {
    width: CAROUSEL_ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const NewCardCell = ({ onPress, lightBackground }) => (
  <TouchableOpacity
    style={[
      styles.newCard,
      {
        borderColor: lightBackground ? Constants.colors.black : Constants.colors.white,
      },
    ]}
    onPress={onPress}>
    <Text
      style={[
        styles.newCardTitle,
        {
          color: lightBackground ? Constants.colors.black : Constants.colors.white,
        },
      ]}>
      Add a card to this deck
    </Text>
  </TouchableOpacity>
);

const CardsGrid = ({
  cards,
  titles,
  initialCard,
  onPress,
  onShowCardOptions,
  showNewCard,
  lightBackground,
}) => {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.gridContainer}>
      {showNewCard && (
        <View style={[Constants.styles.gridItem, styles.cellContainer]} key="new">
          <NewCardCell
            onPress={() => onPress({ cardId: LocalId.makeId() })}
            lightBackground={lightBackground}
          />
        </View>
      )}
      {cards &&
        cards.map((card) => (
          <View style={[Constants.styles.gridItem, styles.cellContainer]} key={card.cardId}>
            <View>
              <CardCell
                card={card}
                onPress={() => onPress(card)}
                isInitialCard={cards.length > 1 && initialCard && initialCard.cardId === card.cardId}
                inGrid={true}
              />
              {onShowCardOptions && (
                <TouchableOpacity
                  style={[styles.cardOptions, styles.cardOptionsGrid]}
                  onPress={() => onShowCardOptions(card)}>
                  <Feather name='more-horizontal' size={16} color={'#000'} />
                </TouchableOpacity>
              )}
            </View>
            <Text
              style={[
                styles.cardTitle,
                {
                  color: lightBackground ? '#000' : Constants.colors.grayText,
                },
              ]}>
              {titles ? titles[card.cardId] : Utilities.makeCardPreviewTitle(card)}
            </Text>
          </View>
        ))}
    </ScrollView>
  );
};

const getCarouselItemLayout = (data, index) => {
  let length, offset;
  if (index == 0) {
    // dummy first cell
    length = CAROUSEL_LEFT_PAD;
    offset = 0;
  } else {
    length = CAROUSEL_ITEM_WIDTH;
    offset = CAROUSEL_LEFT_PAD + CAROUSEL_ITEM_WIDTH * index;
  }
  return { length, offset, index };
};

const CardsCarousel = ({ cards, titles, initialCard, onPress, onShowCardOptions }) => {
  const paddedCards = [{ cardId: '-1' }].concat(cards);
  const renderItem = React.useCallback(
    ({ item, index }) => {
      const card = item;
      if (!card || card.cardId === '-1') {
        // add a dummy cell at the beginning to ensure the first card
        // is horizontally centered.
        return <View style={{ width: CAROUSEL_LEFT_PAD }} />;
      }
      return (
        <View style={styles.carouselItem}>
          <View style={{ height: '100%', aspectRatio: Constants.CARD_RATIO }}>
            <CardCell
              card={card}
              onPress={() => onPress(card)}
              isInitialCard={cards.length > 1 && initialCard && initialCard.cardId === card.cardId}
            />
            {onShowCardOptions ? (
              <TouchableOpacity
                style={[styles.cardOptions, styles.cardOptionsCarousel]}
                onPress={() => onShowCardOptions(card)}>
                <Feather name='more-horizontal' size={22} color={'#000'} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      );
    },
    [onPress, initialCard]
  );

  // can't use snapToInterval because of odd-width first cell
  const snapToOffsets = paddedCards.map((card, ii) => ii * CAROUSEL_ITEM_WIDTH);

  return (
    <FlatList
      contentContainerStyle={{ height: CAROUSEL_HEIGHT, paddingTop: CONTAINER_TOP_PADDING }}
      horizontal
      data={paddedCards}
      renderItem={renderItem}
      getItemLayout={getCarouselItemLayout}
      keyExtractor={(item, index) => (item ? item.cardId : `card-${index}`)}
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      pagingEnabled
      snapToOffsets={snapToOffsets}
      initialNumToRender={3}
      windowSize={5}
      maxToRenderPerBatch={3}
    />
  );
};

const SortOrder = {
  LAST_MODIFIED_DESC: 'last-modified-desc',
  LAST_MODIFIED_ASC: 'last-modified-asc',
};

const sortCards = (cards, order) => {
  if (!cards || !cards.length) {
    return cards;
  }
  cards = cards.concat(); // return a sorted copy
  switch (order) {
    case SortOrder.LAST_MODIFIED_ASC:
      return cards.sort((a, b) => {
        return Date.parse(a.lastModified) - Date.parse(b.lastModified);
      });
    case SortOrder.LAST_MODIFIED_DESC:
    default:
      return cards.sort((a, b) => {
        return Date.parse(b.lastModified) - Date.parse(a.lastModified);
      });
  }
};

const SortOrderOptions = [SortOrder.LAST_MODIFIED_DESC, SortOrder.LAST_MODIFIED_ASC];

export const CardsSet = (props) => {
  const [sortOrder, setSortOrder] = React.useState(SortOrder.LAST_MODIFIED_DESC);
  const { deck, lightBackground } = props;
  const mode = props.mode ?? 'grid';

  let cards, initialCard, titles;
  if (deck) {
    cards = sortCards(deck.cards, sortOrder);
    initialCard = deck.initialCard;
    titles = Utilities.makeCardPreviewTitles(deck);
  }

  return (
    <>
      {mode === 'grid' ? (
        <CardsGrid cards={cards} titles={titles} initialCard={initialCard} {...props} />
      ) : null}
      {mode === 'carousel' ? (
        <CardsCarousel cards={cards} titles={titles} initialCard={initialCard} {...props} />
      ) : null}
    </>
  );
};
