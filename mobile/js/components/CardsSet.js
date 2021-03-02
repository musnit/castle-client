import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CardCell } from './CardCell';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import Feather from 'react-native-vector-icons/Feather';

import * as Constants from '../Constants';
import * as LocalId from '../common/local-id';
import * as Utilities from '../common/utilities';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {},
  gridContainer: {
    paddingLeft: 8,
    flex: 1,
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
    <View style={styles.gridContainer}>
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
    </View>
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
  const [state, setState] = React.useState({ mode: 'grid' });
  const [sortOrder, setSortOrder] = React.useState(SortOrder.LAST_MODIFIED_DESC);
  const { deck, lightBackground } = props;

  let cards, initialCard, titles;
  if (deck) {
    cards = sortCards(deck.cards, sortOrder);
    initialCard = deck.initialCard;
    titles = Utilities.makeCardPreviewTitles(deck);
  }

  const setMode = (mode) =>
    setState({
      mode,
    });

  // TODO: state.mode == 'gallery'
  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {state.mode === 'grid' ? (
          <CardsGrid cards={cards} titles={titles} initialCard={initialCard} {...props} />
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
};
