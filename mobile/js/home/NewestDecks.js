import React from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { CardCell } from '../components/CardCell';
import { useLazyQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect, useScrollToTop } from '@react-navigation/native';
import gql from 'graphql-tag';

const REFETCH_FEED_INTERVAL_MS = 30 * 1000;

const styles = StyleSheet.create({
  scrollView: {
    paddingLeft: 16,
    paddingTop: 16,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  deckCell: {
    width: '33%',
    paddingRight: 16,
    paddingBottom: 16,
  },
});

export const NewestDecks = ({ focused }) => {
  const { navigate } = useNavigation();
  const [lastFetchedTime, setLastFetchedTime] = React.useState(null);
  const [decks, setDecks] = React.useState(undefined);
  const [fetchDecks, query] = useLazyQuery(
    gql`
      query {
        allDecks {
          id
          deckId
          title
          creator {
            userId
            username
            photo {
              url
            }
          }
          initialCard {
            id
            cardId
            title
            backgroundImage {
              url
              smallUrl
              privateCardUrl
              overlayUrl
              primaryColor
            }
          }
          variables
        }
      }
    `,
    { fetchPolicy: 'no-cache' }
  );

  const onRefresh = React.useCallback(() => {
    fetchDecks();
    setLastFetchedTime(Date.now());
  }, [fetchDecks, setLastFetchedTime]);

  useFocusEffect(
    React.useCallback(() => {
      if (!lastFetchedTime || Date.now() - lastFetchedTime > REFETCH_FEED_INTERVAL_MS) {
        onRefresh();
      }
    }),
    []
  );

  React.useEffect(() => {
    if (query.called && !query.loading && !query.error && query.data) {
      setDecks(query.data.allDecks);
    }
  }, [query.called, query.loading, query.error, query.data]);

  const scrollViewRef = React.useRef(null);
  useScrollToTop(scrollViewRef);

  const refreshControl = (
    <RefreshControl
      refreshing={lastFetchedTime && query.loading}
      onRefresh={onRefresh}
      tintColor="#fff"
      colors={['#fff', '#ccc']}
    />
  );

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={styles.scrollView}
      refreshControl={refreshControl}>
      {decks
        ? decks.map((deck, ii) => (
            <View key={`deck-${deck.deckId}`} style={styles.deckCell}>
              <CardCell
                card={deck.initialCard}
                onPress={() =>
                  navigate('PlayDeck', {
                    decks,
                    initialDeckIndex: ii,
                    title: 'Newest',
                  })
                }
              />
            </View>
          ))
        : null}
    </ScrollView>
  );
};
