import * as React from 'react';
import { gql } from '@apollo/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DecksGrid } from '../components/DecksGrid';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { UserAvatar } from '../components/UserAvatar';
import { useNavigation } from '../ReactNavigation';

import debounce from 'lodash.debounce';

import * as Constants from '../Constants';
import * as Session from '../Session';

const styles = StyleSheet.create({
  container: {},
  heading: {
    fontSize: 16,
    color: Constants.colors.white,
    fontWeight: 'bold',
  },
  headingRow: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  users: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
    padding: 16,
    paddingLeft: 24,
    alignItems: 'center',
  },
  pressedRow: {
    backgroundColor: '#333',
  },
  rowLabel: {
    color: Constants.colors.white,
  },
  avatar: {
    width: 24,
    marginRight: 8,
  },
});

const search = async (query) => {
  const result = await Session.apolloClient.query({
    query: gql`
      query ($text: String!) {
        exploreSearch(text: $text) {
          users {
            id
            userId
            username
            photo {
              url
            }
          }
          decks {
            ${Constants.FEED_ITEM_DECK_FRAGMENT}
          }
        }
      }
    `,
    variables: { text: query },
  });
  return result.data?.exploreSearch;
};

const UserSearchResult = ({ user, onSelectUser }) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed ? styles.pressedRow : null]}
      onPress={() => onSelectUser(user)}>
      <UserAvatar url={user?.photo?.url} style={styles.avatar} />
      <Text style={styles.rowLabel}>{user.username}</Text>
    </Pressable>
  );
};

const UsersResults = ({ users, onSelectUser, limit, query }) => (
  <>
    <View style={styles.headingRow}>
      <Text style={styles.heading}>Users</Text>
    </View>
    <View style={styles.users}>
      {users?.length ? (
        users
          .slice(0, limit)
          .map((user) => (
            <UserSearchResult key={`user-${user.id}`} user={user} onSelectUser={onSelectUser} />
          ))
      ) : query?.length ? (
        <View style={styles.row}>
          <Text style={styles.rowLabel}>No matching users</Text>
        </View>
      ) : null}
    </View>
  </>
);

export const SearchResults = ({ query, onCancel, initialResults }) => {
  const { navigate } = useNavigation();
  const [results, setResults] = React.useState(initialResults);
  const searchDebounce = React.useRef();
  React.useEffect(() => {
    searchDebounce.current = debounce(async (query) => {
      const results = await search(query);
      setResults(results);
    }, 500);
  }, []);
  React.useEffect(() => {
    if (query?.length && searchDebounce.current) {
      searchDebounce.current(query);
    } else {
      setResults(initialResults);
    }
  }, [query, initialResults]);

  const onSelectUser = React.useCallback(
    (user) => navigate('Profile', { userId: user.userId }),
    []
  );
  const onSelectDeck = React.useCallback(
    (deck) => {
      navigate(
        'PlayDeck',
        {
          decks: [deck],
          initialDeckIndex: 0,
          title: 'Search results',
        },
        {
          isFullscreen: true,
        }
      );
    },
    [navigate]
  );

  const usersLimit = results.decks?.length ? 3 : 20; // limit users shown if there are decks too

  if (results.decks?.length) {
    // everything is a header to the DecksGrid FlatList
    // https://stackoverflow.com/questions/58243680/react-native-another-virtualizedlist-backed-container
    const flatlistHeader = () => (
      <>
        <UsersResults
          users={results?.users}
          limit={usersLimit}
          query={query}
          onSelectUser={onSelectUser}
        />
        <View style={styles.headingRow}>
          <Text style={styles.heading}>Decks</Text>
        </View>
      </>
    );
    return (
      <DecksGrid
        keyboardAware
        keyboardShouldPersistTaps="always"
        decks={results.decks}
        contentContainerStyle={{ paddingBottom: 72 }}
        onPressDeck={onSelectDeck}
        ListHeaderComponent={flatlistHeader}
      />
    );
  } else {
    return (
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="always">
        <UsersResults
          users={results?.users}
          limit={usersLimit}
          query={query}
          onSelectUser={onSelectUser}
        />
        {query?.length ? (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>No matching decks</Text>
          </View>
        ) : null}
      </KeyboardAwareScrollView>
    );
  }
};
