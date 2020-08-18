import React from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { CardCell } from '../components/CardCell';
import { useLazyQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect, useScrollToTop } from '@react-navigation/native';
import gql from 'graphql-tag';

import * as Constants from '../Constants';
import * as History from '../common/history';
import * as Session from '../Session';

const styles = StyleSheet.create({
  empty: {
    width: '100%',
    padding: 8,
    paddingTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
});

export const RecentDecks = ({ focused }) => {
  const { navigate } = useNavigation();
  const [lastFetchedTime, setLastFetchedTime] = React.useState(null);
  const [decks, setDecks] = React.useState(undefined);
  const [loading, setLoading] = React.useState(false);

  const fetchDecks = React.useCallback(async () => {
    setLoading(true);
    const historyItems = await History.getItems();
    const deckIds = historyItems.map((item) => item.deckId);
    const decks = await Session.getDecksByIds(deckIds, Constants.FEED_ITEM_DECK_FRAGMENT);
    setDecks(decks);
    setLoading(false);
  }, [setDecks, setLoading]);

  const onRefresh = React.useCallback(() => {
    fetchDecks();
    setLastFetchedTime(Date.now());
    return () => setLoading(false);
  }, [fetchDecks, setLastFetchedTime, setLoading]);

  useFocusEffect(onRefresh);

  const scrollViewRef = React.useRef(null);
  useScrollToTop(scrollViewRef);

  const refreshControl = (
    <RefreshControl
      refreshing={lastFetchedTime && loading}
      onRefresh={onRefresh}
      tintColor="#fff"
      colors={['#fff', '#ccc']}
    />
  );

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={Constants.styles.gridContainer}
      refreshControl={refreshControl}>
      {decks?.length ? (
        decks.map((deck, ii) => (
          <View key={`deck-${deck.deckId}`} style={Constants.styles.gridItem}>
            <CardCell
              card={deck.initialCard}
              onPress={() =>
                navigate('PlayDeck', {
                  decks,
                  initialDeckIndex: ii,
                  title: 'Recent',
                })
              }
            />
          </View>
        ))
      ) : lastFetchedTime && !loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>You haven't played any decks recently.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};
