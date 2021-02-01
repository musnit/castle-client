import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/react-hooks';
import { SafeAreaView } from 'react-native-safe-area-context';

import gql from 'graphql-tag';
import FastImage from 'react-native-fast-image';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  noticeModalContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeContainer: {
    backgroundColor: '#000',
    borderRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fff',
  },
  noticeHeadline: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  noticeText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    lineHeight: 22,
  },
});

export const AppUpdateNotice = () => {
  const [updateInfo, setUpdateInfo] = React.useState({ isUpdateAvailable: false });
  const loadUpdateInfo = useQuery(
    gql`
      query {
        clientUpdateStatus {
          isUpdateAvailable
          link
        }
      }
    `
  );

  React.useEffect(() => {
    if (!loadUpdateInfo.loading && !loadUpdateInfo.error && loadUpdateInfo.data) {
      setUpdateInfo(loadUpdateInfo.data.clientUpdateStatus);
    }
  }, [loadUpdateInfo.loading, loadUpdateInfo.error, loadUpdateInfo.data]);

  if (!updateInfo.isUpdateAvailable || __DEV__) {
    return null;
  }
  return (
    <SafeAreaView style={styles.noticeModalContainer}>
      <View style={styles.noticeContainer}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center' }}>
            <FastImage
              style={{ height: 28, aspectRatio: 1, marginRight: 12 }}
              source={require('../../assets/images/emoji/wand-white.png')}
            />
            <Text style={styles.noticeHeadline}>New version available</Text>
          </View>
        </View>
        <Text style={styles.noticeText}>
          Update Castle when you have a moment, otherwise new decks won't work correctly!
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 16, justifyContent: 'center' }}>
          <View style={Constants.styles.primaryButton}>
            <Text
              style={Constants.styles.primaryButtonLabel}
              onPress={() => Linking.openURL(updateInfo.link)}>
              Update
            </Text>
          </View>
          <View style={{ alignItems: 'center', justifyContent: 'center', marginLeft: 16 }}>
            <Text style={{ color: '#888', fontSize: 16 }}>Maybe later</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};
