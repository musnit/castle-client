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

// TODO: test on many screen sizes
const CAROUSEL_ITEM_WIDTH = Viewport.vw * 100 - 48;
const CAROUSEL_HEIGHT = CAROUSEL_ITEM_WIDTH * (1.0 / Constants.CARD_RATIO) - 24;

const styles = StyleSheet.create({
  container: {},
  gridContainer: {
    paddingLeft: 8,

    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellContainer: {
    paddingBottom: 8,
    paddingRight: 8,
    width: '33%',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    paddingVertical: 4,
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
    padding: 4,
    backgroundColor: '#444',
    borderRadius: 2,
  },
  cardOptionsLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
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
        <View style={styles.cellContainer} key="new">
          <NewCardCell
            onPress={() => onPress({ cardId: LocalId.makeId() })}
            lightBackground={lightBackground}
          />
        </View>
      )}
      {cards &&
        cards.map((card) => (
          <View style={styles.cellContainer} key={card.cardId}>
            <CardCell
              card={card}
              onPress={() => onPress(card)}
              isInitialCard={cards.length > 1 && initialCard && initialCard.cardId === card.cardId}
            />
            <Text
              style={[
                styles.cardTitle,
                {
                  color: lightBackground ? '#000' : '#fff',
                },
              ]}>
              {titles ? titles[card.cardId] : Utilities.makeCardPreviewTitle(card)}
            </Text>
            {onShowCardOptions && (
              <TouchableOpacity style={styles.cardOptions} onPress={() => onShowCardOptions(card)}>
                <Text style={styles.cardOptionsLabel}>...</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
    </ScrollView>
  );
};

const getCarouselItemLayout = (data, index) => ({
  length: CAROUSEL_ITEM_WIDTH,
  offset: CAROUSEL_ITEM_WIDTH * index,
  index,
});

const CardsCarousel = ({ cards, titles, initialCard, onPress, onShowCardOptions }) => {
  const renderItem = React.useCallback(
    ({ item, index }) => {
      const card = item;
      return (
        <View style={styles.carouselItem}>
          <View style={{ height: '100%', aspectRatio: Constants.CARD_RATIO }}>
            <CardCell
              card={card}
              onPress={() => onPress(card)}
              isInitialCard={cards.length > 1 && initialCard && initialCard.cardId === card.cardId}
            />
          </View>
        </View>
      );
    },
    [onPress, initialCard]
  );

  return (
    <FlatList
      contentContainerStyle={{ height: CAROUSEL_HEIGHT }}
      horizontal
      data={cards}
      renderItem={renderItem}
      getItemLayout={getCarouselItemLayout}
      keyExtractor={(item, index) => item?.cardId}
      showsHorizontalScrollIndicator={false}
      snapToAlignment="center"
      snapToInterval={CAROUSEL_ITEM_WIDTH}
      decelerationRate="fast"
      pagingEnabled
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
