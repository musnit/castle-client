import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PlayDeck } from '../play/PlayDeck';
import { useQuery, gql } from '@apollo/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useListen } from '../core/CoreEvents';
import { useSession } from '../Session';

import Icon from 'react-native-vector-icons/MaterialIcons';
import Viewport from '../common/viewport';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Basteleur-Bold',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    padding: 12,
    marginTop: 8,
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

const CARD_MAX_HEIGHT = Viewport.vh * 100 - Constants.FEED_ITEM_HEADER_HEIGHT - 64;
const isFitWidth = Viewport.vw * 100 * (1.0 / Constants.CARD_RATIO) <= CARD_MAX_HEIGHT;

export const NuxScreen = () => {
  const { setIsNuxCompleted } = useSession();

  const [currentCardId, setCurrentCardId] = React.useState();
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
      setCurrentCardId(loadNuxInfo.data.nuxInfo.deck.initialCard?.cardId);
    }
  }, [loadNuxInfo.loading, loadNuxInfo.error, loadNuxInfo.data]);

  useListen({
    eventName: 'DID_NAVIGATE_TO_CARD',
    handler: ({ cardId }) => setCurrentCardId(cardId),
  });

  // if on a stubby screen such as an ipad, do 100% height instead of 100% width
  const cardStyles = isFitWidth
    ? styles.itemCard
    : {
        ...styles.itemCard,
        width: undefined,
        height: '100%',
        flexShrink: 1,
      };

  const reachedLastCard = nuxInfo?.finalCardId && currentCardId === nuxInfo.finalCardId;

  return (
    <SafeAreaView style={styles.container}>
      <View style={cardStyles}>
        <View style={styles.absoluteFill}>
          {nuxInfo?.deck ? <PlayDeck deck={nuxInfo.deck} /> : null}
        </View>
      </View>
      <Pressable onPress={() => setIsNuxCompleted(true)}>
        <Text
          style={[
            styles.label,
            { color: reachedLastCard ? Constants.colors.white : Constants.colors.grayOnBlackText },
          ]}>
          {reachedLastCard ? 'Continue' : 'Skip Intro'}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
};
