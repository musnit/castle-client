import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { UserAvatar } from '../components/UserAvatar';
import { useNavigation } from '@react-navigation/native';

import debounce from 'lodash.debounce';
import gql from 'graphql-tag';

import * as Constants from '../Constants';
import * as Session from '../Session';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
    padding: 16,
    alignItems: 'center',
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
      query($text: String!) {
        exploreSearch(text: $text) {
          users {
            id
            userId
            username
            photo {
              url
            }
          }
        }
      }
    `,
    variables: { text: query },
  });
  return result.data?.exploreSearch;
};

const SearchResult = ({ user, onSelectUser }) => {
  return (
    <TouchableOpacity style={styles.row} onPress={() => onSelectUser(user)}>
      <UserAvatar url={user?.photo?.url} style={styles.avatar} />
      <Text style={styles.rowLabel}>{user.username}</Text>
    </TouchableOpacity>
  );
};

export const SearchResults = ({ query, onCancel }) => {
  const { navigate } = useNavigation();
  const [results, setResults] = React.useState();
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
      setResults(undefined);
    }
  }, [query]);

  const onSelectUser = React.useCallback(
    (user) => navigate('Profile', { userId: user.userId }),
    []
  );

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always">
      {results?.users?.length
        ? results.users.map((user) => (
            <SearchResult key={`user-${user.id}`} user={user} onSelectUser={onSelectUser} />
          ))
        : null}
    </KeyboardAwareScrollView>
  );
};
