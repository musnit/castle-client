import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { gql } from '@apollo/client';

import * as Session from '../Session';

const MAX_AUTOCOMPLETE_RESULTS = 6;

const styles = StyleSheet.create({
  users: {
    position: 'absolute',
    bottom: 48,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 3,
    backgroundColor: '#fff',
    marginHorizontal: 16,
  },
  userRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
  },
});

const autocompleteUsers = (text) =>
  Session.apolloClient.query({
    query: gql`
      query($text: String!) {
        autocomplete(text: $text) {
          users {
            userId
            username
          }
        }
      }
    `,
    variables: { text },
  });

export const AutocompleteTextInput = ({ onChangeText, updateCache, ...props }) => {
  const [query, setQuery] = React.useState();
  const [autocomplete, setAutocomplete] = React.useState({
    type: null,
  });

  // detect trailing words beginning with @ to determine autocomplete query
  const onChangeTextAutocomplete = React.useCallback(
    (text) => {
      if (text?.length) {
        const matches = text.match(/([@][\w_-]+)$/g);
        if (matches?.length) {
          setQuery(matches[0]);
        } else {
          setQuery();
        }
      } else {
        setQuery();
      }
      return onChangeText(text);
    },
    [onChangeText]
  );

  // search for users when we have a query
  React.useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(async () => {
      if (mounted) {
        if (query?.length) {
          const result = await autocompleteUsers(query);
          if (result?.data.autocomplete.users.length) {
            setAutocomplete({
              type: 'users',
              users: result.data.autocomplete.users.slice(0, MAX_AUTOCOMPLETE_RESULTS),
            });
          } else {
            setAutocomplete({ type: null });
          }
        } else {
          setAutocomplete({ type: null });
        }
      }
    }, 100);
    return () => {
      clearTimeout(timeout);
      mounted = false;
    };
  }, [query]);

  const onSelectAutocomplete = React.useCallback(
    (autocomplete) => {
      if (autocomplete.type === 'user') {
        const { user, query } = autocomplete;
        onChangeText(props.value.replace(query, `@${user.username} `));
        setQuery();
        if (updateCache) {
          updateCache({
            type: 'addUser',
            user,
          });
        }
      }
    },
    [props.value, onChangeText, updateCache]
  );

  return (
    <>
      <TextInput onChangeText={onChangeTextAutocomplete} {...props} />
      {autocomplete.users ? (
        <View style={styles.users}>
          {autocomplete.users.map((user) => (
            <Pressable
              key={`user-${user.userId}`}
              style={styles.userRow}
              onPress={() => onSelectAutocomplete({ type: 'user', user, query })}>
              <Text>{user.username}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </>
  );
};
