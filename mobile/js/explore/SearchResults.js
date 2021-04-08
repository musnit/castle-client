import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserAvatar } from '../components/UserAvatar';

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
        autocomplete(text: $text) {
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
  return result.data?.autocomplete;
};

const SearchResult = ({ user }) => {
  return (
    <View style={styles.row}>
      <UserAvatar url={user?.photo?.url} style={styles.avatar} />
      <Text style={styles.rowLabel}>{user.username}</Text>
    </View>
  );
};

export const SearchResults = ({ query, onCancel }) => {
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

  return (
    <View style={styles.container}>
      {results?.users?.length
        ? results.users.map((user) => <SearchResult key={`user-${user.id}`} user={user} />)
        : null}
    </View>
  );
};
