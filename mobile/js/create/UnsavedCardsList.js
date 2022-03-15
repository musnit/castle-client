import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { useQuery, useMutation, gql } from '@apollo/client';
import Icon from 'react-native-vector-icons/MaterialIcons';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {},
  row: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: '#fff',
    fontSize: 16,
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
        ? cards.map((card, ii) => (
            <View style={styles.row} key={`card-${ii}`}>
              <Text style={styles.cardLabel}>{formatDate(card.updatedTime)}</Text>
              <Pressable onPress={() => onPressCard(card.cardId)}>
                <Icon name="restore" size={24} color={Constants.colors.grayOnBlackText} />
              </Pressable>
            </View>
          ))
        : null}
    </ScrollView>
  );
};
