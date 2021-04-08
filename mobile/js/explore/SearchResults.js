import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserAvatar } from '../components/UserAvatar';

import * as Constants from '../Constants';

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

const DUMMY_RESULT = {
  id: '235',
  username: 'irondavy',
  photo: {
    url:
      'https://castle.imgix.net/ddaaa55b15faeb0fdf0784c75b7281b7?auto=compress&fit=crop&min-w=420',
  },
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
  return (
    <View style={styles.container}>
      {query?.length ? (
        <>
          <SearchResult user={DUMMY_RESULT} />
          <SearchResult user={DUMMY_RESULT} />
          <SearchResult user={DUMMY_RESULT} />
        </>
      ) : null}
    </View>
  );
};
