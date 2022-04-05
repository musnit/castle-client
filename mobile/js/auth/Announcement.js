import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  announcement: {
    padding: 16,
    paddingTop: 12,
    backgroundColor: Constants.colors.white,
    borderRadius: 4,
    marginBottom: 16,
    flexDirection: 'column',
  },
  announcementHeadline: {
    fontWeight: 'bold',
    color: Constants.colors.black,
    fontSize: 16,
    marginBottom: 4,
  },
  announcementBody: {
    color: Constants.colors.black,
    lineHeight: 20,
  },
});

export const Announcement = (props) => {
  return (
    <View style={styles.announcement}>
      {props.headline ? <Text style={styles.announcementHeadline}>{props.headline}</Text> : null}
      <Text style={styles.announcementBody}>{props.body}</Text>
    </View>
  );
};
