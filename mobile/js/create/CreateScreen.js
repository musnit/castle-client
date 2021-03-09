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
import { AuthPrompt } from '../auth/AuthPrompt';
import { CardCell } from '../components/CardCell';
import { CommonActions, useNavigation, useFocusEffect } from '../ReactNavigation';
import { EmptyFeed } from '../home/EmptyFeed';
import { ScreenHeader } from '../components/ScreenHeader';
import { useLazyQuery } from '@apollo/react-hooks';
import { useSafeArea, SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../Session';

import FastImage from 'react-native-fast-image';
import gql from 'graphql-tag';
import Viewport from '../common/viewport';

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
  decks: {},
  sectionTitle: {
    color: Constants.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginVertical: 8,
  },
  createDeckButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const EditDeckCell = (props) => {
  const { deck, onPress } = props;
  return (
    <View style={[Constants.styles.gridItem, { width: Viewport.gridItemWidth }]}>
      <CardCell
        card={deck.initialCard}
        onPress={onPress}
        visibility={deck.visibility}
        inGrid={true}
      />
    </View>
  );
};

export const CreateScreen = () => {
  const { isAnonymous } = useSession();

  if (isAnonymous) {
    return (
      <SafeAreaView>
        <AuthPrompt
          title="Create interactive cards"
          message="Make digital toys, living doodles, or tiny games."
        />
      </SafeAreaView>
    );
  } else {
    return <CreateScreenAuthenticated />;
  }
};

const CreateScreenAuthenticated = () => {
  const insets = useSafeArea();
  const navigation = useNavigation();
  const [decks, setDecks] = React.useState(undefined);
  const [error, setError] = React.useState(undefined);
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
            visibility
            lastModified
            initialCard {
              id
              cardId
              title
              backgroundImage {
                url
                smallUrl
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
    if (query.called && !query.loading) {
      if (query.data) {
        const decks = query.data.me.decks;
        if (decks) {
          setDecks(decks.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified)));
        }
        setError(undefined);
      } else if (query.error) {
        setError(query.error);
      }
    } else {
      setError(undefined);
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
      <ScreenHeader title="Your Decks" />

      {decks && decks.length === 0 && (
        <View style={Constants.styles.empty}>
          <Text style={Constants.styles.emptyTitle}>No decks yet</Text>
          <Text style={Constants.styles.emptyText}>
            Create your first deck by starting from a blank deck or remixing an existing one.
          </Text>
        </View>
      )}

      {error ? (
        <EmptyFeed error={error} onRefresh={fetchDecks} />
      ) : (
        (!decks || decks.length > 0) && (
          <ScrollView
            contentContainerStyle={Constants.styles.gridContainer}
            refreshControl={refreshControl}>
            {decks &&
              decks.map((deck) => (
                <EditDeckCell
                  key={deck.deckId}
                  deck={deck}
                  onPress={() => {
                    navigation.push(
                      'CreateDeck',
                      {
                        deckIdToEdit: deck.deckId,
                      },
                      { isFullscreen: true }
                    );
                  }}
                />
              ))}
          </ScrollView>
        )
      )}
      <TouchableOpacity
        style={styles.createDeckButton}
        onPress={() => {
          navigation.push(
            'CreateDeck',
            {
              deckIdToEdit: LocalId.makeId(),
              cardIdToEdit: LocalId.makeId(),
            },
            { isFullscreen: true }
          );
        }}>
        <FastImage
          tintColor="#000"
          style={{
            width: 28,
            height: 28,
          }}
          source={require('../../assets/images/BottomTabs-create.png')}
        />
      </TouchableOpacity>
    </View>
  );
};
