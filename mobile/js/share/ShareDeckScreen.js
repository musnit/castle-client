import * as React from 'react';
import { Alert, Pressable, TouchableOpacity, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { CardCell } from '../components/CardCell';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { UserAvatar } from '../components/UserAvatar';
import { shareDeck, getCardBackgroundColor } from '../common/utilities';
import { useMutation, gql } from '@apollo/client';
import { useNavigation } from '../ReactNavigation';
import * as Analytics from '../common/Analytics';

import * as Constants from '../Constants';

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
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
  },
  topCard: {
    flexShrink: 1,
  },
  cardArt: {
    aspectRatio: Constants.CARD_RATIO,
    flexShrink: 1,
    borderBottomLeftRadius: Constants.CARD_BORDER_RADIUS,
    borderBottomRightRadius: Constants.CARD_BORDER_RADIUS,
  },
  topCardFooter: {
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
  caption: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 300,
  },
  captionLabel: {
    color: Constants.colors.white,
    fontSize: 16,
    marginLeft: 8,
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
  const { navigate, setOptions } = useNavigation();
  const deck = route.params.deck;
  const [visibility, setVisibility] = React.useState(deck.visibility);
  const [caption, setCaption] = React.useState(deck.caption);
  const initialCard = deck.cards.find((c) => c.cardId === deck.initialCard.cardId);
  const backgroundColor = getCardBackgroundColor(initialCard);

  const [saveDeck] = useMutation(
    gql`
      mutation UpdateDeck($deck: DeckInput!) {
        updateDeckV2(deck: $deck) {
          deckId
          visibility
          caption
        }
      }
    `
  );

  const onChangeVisibility = React.useCallback(
    async (visibility) => {
      const deckUpdateFragment = {
        deckId: deck.deckId,
        visibility,
        caption: deck.caption,
      };
      Analytics.logEvent('CHANGE_DECK_VISIBILITY', {
        deckId: deck.deckId,
        visibility,
      });
      saveDeck({ variables: { deck: deckUpdateFragment } });
      setVisibility(visibility);
    },
    [setVisibility, saveDeck, deck]
  );

  const onChangeCaption = React.useCallback(
    async (caption) => {
      const deckUpdateFragment = {
        deckId: deck.deckId,
        visibility: deck.visibility,
        caption,
      };
      /* TODO: BEN
        Analytics.logEvent('CHANGE_DECK_CAPTION', {
          deckId: deck.deckId,
        });
        await saveDeck({ variables: { deck: deckUpdateFragment } });
      */
      setCaption(caption);
    },
    [setCaption, saveDeck, deck]
  );

  const onTapShare = React.useCallback((deck, visibility) => {
    if (visibility === 'private') {
      Alert.alert("Can't share deck", 'Make this deck Public or Unlisted in order to share it.');
    } else {
      shareDeck(deck);
    }
  }, []);

  const onPressCaption = React.useCallback(
    () =>
      navigate('ModalEditDeckCaptionNavigator', {
        screen: 'EditDeckCaption',
        params: { deck, onChangeCaption },
      }),
    [navigate, deck, onChangeCaption]
  );

  return (
    <SafeAreaView style={Constants.styles.container} edges={['left', 'right', 'bottom']}>
      <ScreenHeader
        title="Share Deck"
        RightButtonComponent={
          <Pressable
            style={Constants.styles.siteHeaderIcon}
            onPress={() => onTapShare(deck, visibility)}>
            {({ pressed }) => (
              <Feather
                name={Constants.iOS ? 'share' : 'share-2'}
                size={24}
                color={
                  visibility === 'private' || pressed
                    ? Constants.colors.grayText
                    : Constants.colors.white
                }
              />
            )}
          </Pressable>
        }
      />
      <View style={styles.deckPreview}>
        <View style={styles.topCard}>
          <View style={[styles.cardArt, { backgroundColor: backgroundColor }]}>
            <CardCell card={initialCard} previewVideo={deck.previewVideo} />
          </View>
          <View style={[styles.topCardFooter, { backgroundColor: backgroundColor }]}>
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
          <Pressable style={styles.caption} onPress={onPressCaption}>
            <Feather name="edit" color={Constants.colors.white} size={16} />
            <Text style={styles.captionLabel} numberOfLines={1} ellipsizeMode="tail">
              {caption ?? 'Add a caption'}
            </Text>
          </Pressable>
        </View>
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
