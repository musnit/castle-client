import * as React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { CardCell } from '../components/CardCell';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SegmentedNavigation } from '../components/SegmentedNavigation';
import { useLazyQuery } from '@apollo/react-hooks';
import {
  useNavigation,
  useIsFocused,
  useFocusEffect,
  useScrollToTop,
} from '@react-navigation/native';
import gql from 'graphql-tag';

import * as Constants from '../Constants';
import * as Utilities from '../utilities';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: '#666',
    paddingTop: 16,
  },
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

const REFETCH_FEED_INTERVAL_MS = 30 * 1000;

const MODE_ITEMS = [
  {
    name: 'Newest',
    value: 'newest',
  },
];

export const HomeScreen = () => {
  const { navigate } = useNavigation();
  const [lastFetchedTime, setLastFetchedTime] = React.useState(null);
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
            blocks {
              id
              cardBlockId
              cardBlockUpdateId
              type
              title
              destinationCardId
            }
          }
          variables
        }
      }
    `,
    { fetchPolicy: 'no-cache' }
  );

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      Constants.Android && StatusBar.setTranslucent(true); // needed for tab navigator
      if (!lastFetchedTime || Date.now() - lastFetchedTime > REFETCH_FEED_INTERVAL_MS) {
        fetchDecks();
        setLastFetchedTime(Date.now());
      }
    }, [lastFetchedTime])
  );

  let decks;
  if (query.called && !query.loading && !query.error && query.data) {
    decks = query.data.allDecks;
  }

  const scrollViewRef = React.useRef(null);
  useScrollToTop(scrollViewRef);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <SegmentedNavigation
          items={MODE_ITEMS}
          selectedItem={MODE_ITEMS[0]}
          onSelectItem={() => {}}
        />
      </View>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollView}>
        {decks
          ? decks.map((deck, ii) => (
              <View key={`deck-${deck.deckId}`} style={styles.deckCell}>
                <CardCell
                  card={deck.initialCard}
                  onPress={() =>
                    navigate('PlayDeck', {
                      deckId: deck.deckId,
                      cardId: deck.initialCard.cardId,
                      initialDeckState: Utilities.makeInitialDeckState(deck),
                    })
                  }
                />
              </View>
            ))
          : null}
      </ScrollView>
    </SafeAreaView>
  );
};
