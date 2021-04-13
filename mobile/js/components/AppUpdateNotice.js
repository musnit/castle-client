import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CastleAsyncStorage } from '../common/CastleAsyncStorage';
import { useQuery, gql } from '@apollo/client';
import { SafeAreaView } from 'react-native-safe-area-context';

import FastImage from 'react-native-fast-image';

import * as Constants from '../Constants';

// if dismissed, prompt again in 3 hours
const UPDATE_NOTICE_PROMPT_INTERVAL = 1000 * 60 * 60 * 3;
const UPDATE_NOTICE_LAST_DISMISSED_TIME_KEY = 'updateNoticeLastDismissedTime';

const styles = StyleSheet.create({
  noticeModalContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  const [timeDismissed, setTimeDismissed] = React.useState(Date.now());
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

  const dismissNotice = React.useCallback(() => {
    (async () => {
      const now = Date.now();
      await CastleAsyncStorage.setItem(UPDATE_NOTICE_LAST_DISMISSED_TIME_KEY, now.toString());
      setTimeDismissed(now);
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      let timeDismissed = await CastleAsyncStorage.getItem(UPDATE_NOTICE_LAST_DISMISSED_TIME_KEY);
      timeDismissed = parseInt(timeDismissed, 10);
      if (!timeDismissed) {
        timeDismissed = 0;
      }
      setTimeDismissed(timeDismissed);
    })();
  }, []);

  React.useEffect(() => {
    if (!loadUpdateInfo.loading && !loadUpdateInfo.error && loadUpdateInfo.data) {
      setUpdateInfo(loadUpdateInfo.data.clientUpdateStatus);
    }
  }, [loadUpdateInfo.loading, loadUpdateInfo.error, loadUpdateInfo.data]);

  if (
    !updateInfo.isUpdateAvailable ||
    Date.now() - timeDismissed < UPDATE_NOTICE_PROMPT_INTERVAL ||
    __DEV__
  ) {
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
          <TouchableOpacity
            style={Constants.styles.primaryButton}
            onPress={() => {
              dismissNotice();
              Linking.openURL(updateInfo.link);
            }}>
            <Text style={Constants.styles.primaryButtonLabel}>Update</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ alignItems: 'center', justifyContent: 'center', marginLeft: 16 }}
            onPress={dismissNotice}>
            <Text style={{ color: '#888', fontSize: 16 }}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};
