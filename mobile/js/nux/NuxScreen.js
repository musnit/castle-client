import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PlayDeck } from '../play/PlayDeck';
import { useQuery, gql } from '@apollo/client';
import { useSession } from '../Session';

import Icon from 'react-native-vector-icons/MaterialIcons';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    lineHeight: 32,
    padding: 8,
  },
  itemCard: {
    aspectRatio: Constants.CARD_RATIO,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  absoluteFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: Constants.FEED_ITEM_HEADER_HEIGHT,
    width: '100%',
    borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
    borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
    overflow: 'hidden',
  },
  back: {
    marginRight: 12,
  },
});

export const NuxScreen = () => {
  const { setIsNuxCompleted } = useSession();

  const [nuxInfo, setNuxInfo] = React.useState();
  const loadNuxInfo = useQuery(
    gql`
      query {
        nuxInfo {
          deck {
            ${Constants.FEED_ITEM_DECK_FRAGMENT}
          }
          finalCardId
        }
      }
    `
  );

  React.useEffect(() => {
    if (!loadNuxInfo.loading && !loadNuxInfo.error && loadNuxInfo.data) {
      setNuxInfo(loadNuxInfo.data.nuxInfo);
    }
  }, [loadNuxInfo.loading, loadNuxInfo.error, loadNuxInfo.data]);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable style={styles.back} onPress={() => setIsNuxCompleted(true)}>
          {({ pressed }) => <Icon name="arrow-back" color={pressed ? '#ccc' : '#fff'} size={32} />}
        </Pressable>
      </View>
      <View style={styles.itemCard}>
        <View style={styles.absoluteFill}>
          {nuxInfo?.deck ? <PlayDeck deck={nuxInfo.deck} /> : null}
        </View>
      </View>
      <Pressable onPress={() => setIsNuxCompleted(true)}>
        <Text style={styles.label}>Skip</Text>
      </Pressable>
    </View>
  );
};
