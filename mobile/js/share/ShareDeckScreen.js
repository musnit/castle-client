import * as React from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CardCell } from '../components/CardCell';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { UserAvatar } from '../components/UserAvatar';
import { shareDeck, getCardBackgroundColor } from '../common/utilities';
import { useMutation } from '@apollo/react-hooks';
import { useNavigation } from '../ReactNavigation';

import * as Amplitude from 'expo-analytics-amplitude';
import * as Constants from '../Constants';

import gql from 'graphql-tag';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';

const styles = StyleSheet.create({
  item: {
    padding: 16,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
    flexDirection: 'row',
  },
  itemIcon: {
    flexShrink: 0,
    paddingRight: 12,
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
    marginBottom: 4,
    fontSize: 16,
  },
  itemDescription: {
    color: Constants.colors.white,
    fontSize: 16,
  },
  deckPreview: {
    height: '100%',
    flexShrink: 1,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
  },
  topCard: {
    height: '100%',
    flexShrink: 1,
    aspectRatio: Constants.CARD_RATIO,
  },
  topCardHeader: {
    position: 'absolute',
    width: '100%',
    top: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
    borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
  },
  avatar: {
    width: 24,
    height: 24,
  },
  username: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
    ...Constants.styles.textShadow,
  },
  remixIcon: {
    marginLeft: 8,
  },
  previewVideoInfo: {
    flexShrink: 0,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  previewVideoInfoText: {
    color: '#ccc',
  },
  previewVideoInfoLink: {
    color: '#fff',
  },
});

const VisibilityButton = ({
  visibility,
  onChangeVisibility,
  name,
  description,
  icon,
  isSelected,
  isLast,
}) => {
  return (
    <TouchableOpacity
      style={{ ...styles.item, borderBottomWidth: isLast ? 0 : 1 }}
      onPress={() => onChangeVisibility(visibility)}>
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
  const initialCard = deck.cards.find((c) => c.cardId === deck.initialCard.cardId);

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

  const onTapShare = React.useCallback(
    (deck, visibility) => {
      if (visibility == 'private') {
        Alert.alert("Can't share deck", 'Make this deck Public or Unlisted in order to share it.');
      } else {
        shareDeck(deck);
      }
    },
    [visibility]
  );

  return (
    <SafeAreaView style={Constants.styles.container}>
      <ScreenHeader
        title="Share Deck"
        RightButtonComponent={
          <TouchableOpacity
            style={Constants.styles.siteHeaderIcon}
            onPress={() => onTapShare(deck, visibility)}>
            <Feather
              name={Constants.iOS ? 'share' : 'share-2'}
              size={24}
              color={visibility == 'private' ? Constants.colors.grayText : Constants.colors.white}
            />
          </TouchableOpacity>
        }
      />
      <View style={styles.deckPreview}>
        <View style={styles.topCard}>
          <CardCell card={initialCard} previewVideo={deck.previewVideo} />
          <View
            style={{
              ...styles.topCardHeader,
              backgroundColor: getCardBackgroundColor(initialCard),
            }}>
            <View style={styles.avatar}>
              <UserAvatar url={deck.creator.photo?.url} />
            </View>
            <Text style={styles.username}>{deck.creator.username}</Text>
            {deck.parentDeckId && deck.parentDeck && (
              <>
                <Feather name="refresh-cw" color="#fff" size={12} style={styles.remixIcon} />
                <Text numberOfLines={1} style={styles.username}>
                  {deck.parentDeck?.creator?.username}
                </Text>
              </>
            )}
          </View>
        </View>
        {!deck.previewVideo ? (
          <View style={styles.previewVideoInfo}>
            <Text style={styles.previewVideoInfoText}>No video preview • </Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Add a video preview',
                  'To add a video preview: Open any card in the editor, play the card, and then tap "Record Preview" while playing.'
                );
              }}>
              <Text style={styles.previewVideoInfoLink}>Learn more</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.previewVideoInfo}>
            <TouchableOpacity onPress={() => Linking.openURL(deck.previewVideo.url)}>
              <Text style={styles.previewVideoInfoLink}>Download preview video</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <VisibilityButton
        icon="public"
        visibility="public"
        name="Public"
        description="Anyone can find and view"
        isSelected={visibility === 'public'}
        onChangeVisibility={onChangeVisibility}
        isLast={false}
      />
      <VisibilityButton
        icon="link"
        visibility="unlisted"
        name="Unlisted"
        description="Anyone with the link can view"
        isSelected={visibility === 'unlisted'}
        onChangeVisibility={onChangeVisibility}
        isLast={false}
      />
      <VisibilityButton
        icon="lock"
        visibility="private"
        name="Private"
        description="Only visible to you"
        isSelected={visibility === 'private'}
        onChangeVisibility={onChangeVisibility}
        isLast={true}
      />
    </SafeAreaView>
  );
};
