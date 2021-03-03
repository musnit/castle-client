import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { useNavigation } from '../ReactNavigation';

import * as Amplitude from 'expo-analytics-amplitude';
import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  section: {
    paddingTop: 16,
    paddingBottom: 4,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnWhiteBorder,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemName: {
    color: Constants.colors.white,
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 16,
  },
  itemDescription: {
    color: Constants.colors.white,
    fontSize: 16,
  },
});

export const ShareDeckScreen = ({ route }) => {
  const navigation = useNavigation();
  const deck = route.params.deck;

  const onChangeVisibility = React.useCallback(
    async (visibility) => {
      /* const deckUpdateFragment = {
        deckId,
        visibility,
      };
      Amplitude.logEventWithProperties('CHANGE_DECK_VISIBILITY', { deckId, visibility });
      saveDeck({ variables: { deck: deckUpdateFragment } });
      setDeck({ ...deck, visibility }); */
    },
    [/* setDeck, saveDeck, */ deck]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Share Deck" />
      <TouchableOpacity style={styles.item} onPress={() => onChangeVisibility('public')}>
        <Text style={styles.itemName}>Public</Text>
        <Text style={styles.itemDescription}>Anyone can find and view</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => onChangeVisibility('unlisted')}>
        <Text style={styles.itemName}>Unlisted</Text>
        <Text style={styles.itemDescription}>Anyone with the link can view</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.item, { borderBottomWidth: 0 }]}
        onPress={() => onChangeVisibility('private')}>
        <Text style={styles.itemName}>Private</Text>
        <Text style={styles.itemDescription}>Only visible to you</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};
