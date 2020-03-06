import React from 'react';
import { View, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
import gql from 'graphql-tag';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLazyQuery } from '@apollo/react-hooks';
import { CommonActions, useNavigation, useFocusEffect } from '@react-navigation/native';

import CardCell from './CardCell';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    padding: 16,
  },
  decks: {
    marginTop: 16,
    paddingLeft: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sectionTitle: {
    color: '#fff',
    marginVertical: 8,
    fontSize: 22,
    fontWeight: 'bold',
    width: '100%',
    textAlign: 'center',
  },
  cellContainer: {
    paddingBottom: 8,
    paddingRight: 8,
    width: '33%',
  },
  cellTitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  createCell: {
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
});

const EditDeckCell = (props) => {
  const { deck, onPress } = props;
  return (
    <View style={styles.cellContainer}>
      <CardCell card={deck.initialCard} onPress={onPress} isPrivate={!deck.isVisible} />
    </View>
  );
};

const CreateDeckCell = (props) => {
  return (
    <View style={styles.cellContainer}>
      <TouchableOpacity style={styles.createCell} onPress={props.onPress}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.cellTitle}>Create a new card</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const CreateScreen = () => {
  const navigation = useNavigation();
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
            initialCard {
              id
              cardId
              title
              backgroundImage {
                url
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

  let decks;
  if (query.called && !query.loading && !query.error && query.data) {
    decks = query.data.me.decks;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.sectionTitle}>Your Cards</Text>
        <View style={styles.decks}>
          <CreateDeckCell
            key="create"
            onPress={() => {
              navigation.push('CreateDeck');
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateScreen;
