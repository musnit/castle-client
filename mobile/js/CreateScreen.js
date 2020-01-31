import React from 'react';
import { View, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
import gql from 'graphql-tag';
import SafeAreaView from 'react-native-safe-area-view';
import { useQuery } from '@apollo/react-hooks';
import { NavigationActions } from 'react-navigation';
import { useNavigation, useNavigationEvents } from 'react-navigation-hooks';

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
    fontSize: 32,
    width: '100%',
    textAlign: 'center',
  },
  cellContainer: {
    paddingBottom: 8,
    paddingRight: 8,
    width: '33%',
    height: 192, // TODO: correct ratio
  },
  cellTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  createCell: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    width: '100%',
    height: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: 8,
    backgroundColor: '#bbb',
  },
});

const EditDeckCell = (props) => {
  const { deck, onPress } = props;
  const title = deck && deck.title ? deck.title : 'Untitled Deck';
  return (
    <View style={styles.cellContainer}>
      <CardCell card={deck.initialCard} onPress={onPress} title={title} />
    </View>
  );
};

const CreateDeckCell = (props) => {
  return (
    <View style={styles.cellContainer}>
      <TouchableOpacity style={styles.createCell} onPress={props.onPress}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FastImage
            style={{
              width: 8,
              aspectRatio: 1,
              marginRight: 4,
            }}
            source={require('../assets/images/add.png')}
          />
          <Text style={styles.cellTitle}>Create Deck</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const CreateScreen = () => {
  const [lastFocusedTime, setLastFocusedTime] = React.useState(null);
  const navigation = useNavigation();
  const query = useQuery(gql`
    query Me {
      me {
        userId
        decks {
          deckId
          title
          initialCard {
            cardId
            title
            backgroundImage {
              url
            }
          }
        }
      }
    }
  `);
  useNavigationEvents((event) => {
    if (event.type == 'didFocus') {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      if (lastFocusedTime) {
        query.refetch();
      }
      setLastFocusedTime(Date.now());
    }
  });

  let decks;
  if (!query.loading && !query.error && query.data) {
    decks = query.data.me.decks;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.sectionTitle}>My Decks</Text>
        <View style={styles.decks}>
          <CreateDeckCell
            key="create"
            onPress={() => {
              navigation.push(
                'CreateDeck',
                {},
                NavigationActions.navigate({ routeName: 'CreateCard' })
              );
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
