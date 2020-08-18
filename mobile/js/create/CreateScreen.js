import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CardCell } from '../components/CardCell';
import FastImage from 'react-native-fast-image';
import gql from 'graphql-tag';
import { useSafeArea } from 'react-native-safe-area-context';
import { useLazyQuery } from '@apollo/react-hooks';
import { CommonActions, useNavigation, useFocusEffect } from '@react-navigation/native';

import * as Constants from '../Constants';
import * as LocalId from '../common/local-id';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.colors.black,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: Constants.colors.grayOnBlackBorder,
    paddingTop: 16,
  },
  decks: {
  },
  sectionTitle: {
    color: Constants.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginVertical: 8,
  },
  cellTitle: {
    fontSize: 16,
    color: Constants.colors.white,
    textAlign: 'center',
  },
  createCell: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Constants.colors.white,
    width: '100%',
    aspectRatio: Constants.CARD_RATIO,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 8,
  },
});

const EditDeckCell = (props) => {
  const { deck, onPress } = props;
  return (
    <View style={Constants.styles.gridItem}>
      <CardCell card={deck.initialCard} onPress={onPress} isPrivate={!deck.isVisible} />
    </View>
  );
};

const CreateDeckCell = (props) => {
  return (
    <View style={Constants.styles.gridItem}>
      <TouchableOpacity style={styles.createCell} onPress={props.onPress}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.cellTitle}>Create a new deck</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export const CreateScreen = () => {
  const insets = useSafeArea();
  const navigation = useNavigation();
  const [decks, setDecks] = React.useState(undefined);
  const [fetchDecks, query] = useLazyQuery(
    gql`
      query Me {
        me {
          id
          userId
          decks {
            id
            deckId
            title
            isVisible
            lastModified
            initialCard {
              id
              cardId
              title
              backgroundImage {
                url
                smallUrl
                privateCardUrl
              }
            }
          }
        }
      }
    `,
    { fetchPolicy: 'no-cache' }
  );

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      fetchDecks();
    }, [])
  );

  React.useEffect(() => {
    if (query.called && !query.loading && !query.error && query.data) {
      const decks = query.data.me.decks;
      if (decks && decks.length) {
        setDecks(decks.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified)));
      }
    }
  }, [query.called, query.loading, query.error, query.data]);

  const refreshControl = (
    <RefreshControl
      refreshing={query.loading}
      onRefresh={fetchDecks}
      tintColor="#fff"
      colors={['#fff', '#ccc']}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Your Decks</Text>
      </View>
      <ScrollView contentContainerStyle={Constants.styles.gridContainer} refreshControl={refreshControl}>
        <CreateDeckCell
          key="create"
          onPress={() => {
            navigation.push('CreateDeck', {
              deckIdToEdit: LocalId.makeId(),
              cardIdToEdit: LocalId.makeId(),
            });
          }}
        />
        {decks &&
          decks.map((deck) => (
            <EditDeckCell
              key={deck.deckId}
              deck={deck}
              onPress={() => {
                navigation.push('CreateDeck', {
                  deckIdToEdit: deck.deckId,
                });
              }}
            />
          ))}
      </ScrollView>
    </View>
  );
};
