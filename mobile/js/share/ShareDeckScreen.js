import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { useMutation } from '@apollo/react-hooks';
import { useNavigation } from '../ReactNavigation';

import * as Amplitude from 'expo-analytics-amplitude';
import * as Constants from '../Constants';

import gql from 'graphql-tag';
import Icon from 'react-native-vector-icons/MaterialIcons';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
    flexDirection: 'row',
  },
  itemIcon: {
    flexShrink: 0,
    paddingRight: 8,
  },
  itemContents: {
    width: '100%',
    flexShrink: 1,
  },
  itemSelected: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
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

const VisibilityButton = ({
  visibility,
  onChangeVisibility,
  name,
  description,
  icon,
  isSelected,
}) => {
  return (
    <TouchableOpacity style={styles.item} onPress={() => onChangeVisibility(visibility)}>
      {icon ? (
        <View style={styles.itemIcon}>
          <Icon name={icon} color="#fff" size={22} />
        </View>
      ) : null}
      <View style={styles.itemContents}>
        <Text style={styles.itemName}>{name}</Text>
        <Text style={styles.itemDescription}>{description}</Text>
      </View>
      {isSelected ? (
        <View style={styles.itemSelected}>
          <Icon name="check" color="#fff" size={32} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

export const ShareDeckScreen = ({ route }) => {
  const navigation = useNavigation();
  const deck = route.params.deck;
  const [visibility, setVisibility] = React.useState(deck.visibility);

  const [saveDeck] = useMutation(
    gql`
      mutation UpdateDeck($deck: DeckInput!) {
        updateDeckV2(deck: $deck) {
          deckId
          visibility
        }
      }
    `
  );

  const onChangeVisibility = React.useCallback(
    async (visibility) => {
      const deckUpdateFragment = {
        deckId: deck.deckId,
        visibility,
      };
      Amplitude.logEventWithProperties('CHANGE_DECK_VISIBILITY', deckUpdateFragment);
      saveDeck({ variables: { deck: deckUpdateFragment } });
      setVisibility(visibility);
    },
    [setVisibility, saveDeck, deck]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Share Deck" />
      <VisibilityButton
        icon="public"
        visibility="public"
        name="Public"
        description="Anyone can find and view"
        isSelected={visibility === 'public'}
        onChangeVisibility={onChangeVisibility}
      />
      <VisibilityButton
        icon="link"
        visibility="unlisted"
        name="Unlisted"
        description="Anyone with the link can view"
        isSelected={visibility === 'unlisted'}
        onChangeVisibility={onChangeVisibility}
      />
      <VisibilityButton
        icon="lock"
        visibility="private"
        name="Private"
        description="Only visible to you"
        isSelected={visibility === 'private'}
        onChangeVisibility={onChangeVisibility}
      />
    </SafeAreaView>
  );
};
