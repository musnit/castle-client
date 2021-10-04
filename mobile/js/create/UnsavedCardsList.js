import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery, useMutation, gql } from '@apollo/client';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {},
  row: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#666',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: '#fff',
  },
  restoreButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#fff',
  },
  restoreButtonLabel: {
    color: '#fff',
  },
});

let formatDate;

if (Constants.iOS && typeof Intl !== 'undefined') {
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });

  formatDate = (dateString) => {
    return dateFormatter.format(new Date(dateString));
  };
} else {
  formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
}

export const UnsavedCardsList = ({ onCardChosen }) => {
  const [cards, setCards] = React.useState();
  const query = useQuery(
    gql`
      query {
        unsavedCards {
          cardId
          updatedTime
        }
      }
    `,
    { fetchPolicy: 'no-cache' }
  );

  React.useEffect(() => {
    if (query.called && !query.loading) {
      if (query.data) {
        setCards(query.data.unsavedCards);
      } else {
        setCards();
      }
    }
  }, [query.called, query.loading, query.error, query.data]);

  const [restoreCard] = useMutation(
    gql`
      mutation RestoreCard($cardId: ID!) {
        restoreCard(cardId: $cardId) {
          cardId
        }
      }
    `
  );

  const onPressCard = React.useCallback(
    async (cardId) => {
      await restoreCard({
        variables: { cardId },
      });
      onCardChosen();
    },
    [onCardChosen, restoreCard]
  );

  const refreshControl = (
    <RefreshControl
      refreshing={query.loading}
      onRefresh={query.refetch}
      tintColor="#fff"
      colors={['#fff', '#ccc']}
    />
  );

  if (cards?.length === 0) {
    return (
      <View style={Constants.styles.empty}>
        <Text style={Constants.styles.emptyTitle}>Nothing here 🎉</Text>
        <Text style={Constants.styles.emptyText}>
          If you accidentally lost unsaved cards, they would appear here.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={refreshControl}>
      {cards?.length
        ? cards.map((card) => (
            <View style={styles.row}>
              <Text style={styles.cardLabel}>{formatDate(card.updatedTime)}</Text>
              <Pressable style={styles.restoreButton} onPress={() => onPressCard(card.cardId)}>
                <Text style={styles.restoreButtonLabel}>Restore</Text>
              </Pressable>
            </View>
          ))
        : null}
    </ScrollView>
  );
};
