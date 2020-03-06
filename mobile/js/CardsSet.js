import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import * as Constants from './Constants';
import * as Utilities from './utilities';

import CardCell from './CardCell';

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
  listContainer: {
    borderTopWidth: 1,
    borderColor: '#888',
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#888',
    padding: 16,
  },
  cardTitle: {
    fontSize: 14,
    color: '#fff',
    paddingVertical: 4,
  },
  newCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#888',
    width: '100%',
    aspectRatio: 0.5625,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 8,
  },
  newCardTitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sortLabel: {
    color: '#ccc',
    textTransform: 'uppercase',
  },
  layoutPicker: {
    flexDirection: 'row',
  },
  layoutButton: {
    margin: 6,
  },
  searchContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#888',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    padding: 12,
    paddingLeft: 40,
    color: '#fff',
    width: '100%',
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

const SearchInput = (props) => {
  const { label } = props;
  return (
    <View style={styles.searchContainer}>
      <FastImage
        style={{
          width: 16,
          aspectRatio: 1,
          marginLeft: 12,
          marginRight: -28,
        }}
        source={require('../assets/images/search.png')}
      />
      <TextInput
        style={styles.input}
        placeholderTextColor="#999"
        returnKeyType="done"
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
};

const CardListItem = ({ card, onPress }) => (
  <TouchableOpacity style={styles.listItem} onPress={onPress}>
    <Text style={styles.cardTitle}>{Utilities.makeCardPreviewTitle(card)}</Text>
  </TouchableOpacity>
);

const CardsList = ({ cards, initialCard, onPress, searchQuery }) => {
  if (cards) {
    cards =
      searchQuery && searchQuery.length
        ? cards.filter((card) => Utilities.cardMatchesSearchQuery(card, searchQuery))
        : cards;
  }
  return (
    <View style={styles.listContainer}>
      {cards &&
        cards.map((card) => (
          <CardListItem key={card.cardId} card={card} onPress={() => onPress(card)} />
        ))}
    </View>
  );
};

const NewCardCell = ({ onPress }) => (
  <TouchableOpacity style={styles.newCard} onPress={onPress}>
    <Text style={styles.newCardTitle}>Add a card to this deck</Text>
  </TouchableOpacity>
);

const CardsGrid = ({ cards, initialCard, onPress, onShowCardOptions, showNewCard }) => {
  return (
    <View style={styles.gridContainer}>
      {showNewCard && (
        <View style={styles.cellContainer} key="new">
          <NewCardCell onPress={() => onPress({ cardId: Constants.CREATE_NEW_CARD_ID })} />
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
            <Text style={styles.cardTitle}>{Utilities.makeCardPreviewTitle(card)}</Text>
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

const SortOrderLabels = {
  [SortOrder.LAST_MODIFIED_DESC]: 'Recently Modified',
  [SortOrder.LAST_MODIFIED_ASC]: 'Least Recently Modified',
};

const sortCards = (cards, order) => {
  if (!cards || !cards.length) {
    return cards;
  }
  switch (order) {
    case SortOrder.LAST_MODIFIED_ASC:
      return cards.sort((a, b) => {
        return Date.parse(a.updatedTime) - Date.parse(b.updatedTime);
      });
    case SortOrder.LAST_MODIFIED_DESC:
    default:
      return cards.sort((a, b) => {
        return Date.parse(b.updatedTime) - Date.parse(a.updatedTime);
      });
  }
};

const CardsSet = (props) => {
  const [state, setState] = React.useState({ mode: 'grid', searchQuery: '' });
  const [sortOrder, setSortOrder] = React.useState(SortOrder.LAST_MODIFIED_DESC);
  const { deck } = props;

  let cards, initialCard;
  if (deck) {
    cards = sortCards(deck.cards, sortOrder);
    initialCard = deck.initialCard;
  }

  const setMode = (mode) =>
    setState({
      mode,
      searchQuery: '',
    });

  const setQuery = (searchQuery) =>
    setState({
      ...state,
      searchQuery,
    });

  return (
    <View style={styles.container}>
      {state.mode === 'list' && (
        <SearchInput placeholder="Search" value={state.searchQuery} onChangeText={setQuery} />
      )}
      <View style={styles.settingsRow}>
        <Text style={styles.sortLabel}>Sort: {SortOrderLabels[sortOrder]}</Text>
        <View style={styles.layoutPicker}>
          <TouchableOpacity
            style={styles.layoutButton}
            onPress={() => setMode('grid')}
            hitSlop={{ top: 2, left: 2, bottom: 2, right: 2 }}>
            <FastImage
              style={{
                width: 12,
                aspectRatio: 1,
              }}
              source={require('../assets/images/layout-grid.png')}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.layoutButton}
            onPress={() => setMode('list')}
            hitSlop={{ top: 2, left: 2, bottom: 2, right: 2 }}>
            <FastImage
              style={{
                width: 12,
                aspectRatio: 1,
              }}
              source={require('../assets/images/layout-list.png')}
            />
          </TouchableOpacity>
        </View>
      </View>
      <KeyboardAwareScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {state.mode === 'grid' ? (
          <CardsGrid cards={cards} initialCard={initialCard} {...props} />
        ) : (
          <CardsList
            cards={cards}
            initialCard={initialCard}
            searchQuery={state.searchQuery}
            {...props}
          />
        )}
      </KeyboardAwareScrollView>
    </View>
  );
};

export default CardsSet;
