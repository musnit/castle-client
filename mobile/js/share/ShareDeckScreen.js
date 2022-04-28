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
  content: {
    padding: 16,
  },
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
  visibilityExplainer: {
    color: Constants.colors.white,
    fontSize: 16,
    paddingBottom: 16,
  },
  visibilityContainer: {
    borderColor: Constants.colors.white,
    borderRadius: 4,
    borderWidth: 1,
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

  // TODO: add everything from deck settings sheet
  const [updatedDeck, setUpdatedDeck] = React.useState({
    visibility: deck.visibility,
    caption: deck.caption,
    isChanged: false,
  });

  const initialCard = deck.cards.find((c) => c.cardId === deck.initialCard.cardId);
  const backgroundColor = getCardBackgroundColor(initialCard);

  // TODO: add fragment from deck settings sheet
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

  const onSaveDeck = React.useCallback(async () => {
    const deckUpdateFragment = {
      deckId: deck.deckId,
      ...updatedDeck,
    };
    delete deckUpdateFragment.isChanged;

    if (updatedDeck.visibility !== deck.visibility) {
      Analytics.logEvent('CHANGE_DECK_VISIBILITY', {
        deckId: deck.deckId,
        visibility: updatedDeck.visibility,
      });
    }
    if (updatedDeck.caption !== deck.caption) {
      Analytics.logEvent('CHANGE_DECK_CAPTION', {
        deckId: deck.deckId,
      });
    }
    await saveDeck({ variables: { deck: deckUpdateFragment } });
    setUpdatedDeck({
      ...updatedDeck,
      isChanged: false,
    });
  }, [saveDeck, deck, updatedDeck, setUpdatedDeck]);

  const onChangeCaption = React.useCallback(
    (caption) =>
      setUpdatedDeck({
        ...updatedDeck,
        caption,
        isChanged: true,
      }),
    [updatedDeck]
  );

  const onChangeVisibility = React.useCallback(
    (visibility) =>
      setUpdatedDeck({
        ...updatedDeck,
        visibility,
        isChanged: true,
      }),
    [updatedDeck]
  );

  const onPressCaption = React.useCallback(
    () =>
      navigate('ModalEditDeckCaptionNavigator', {
        screen: 'EditDeckCaption',
        params: { caption: updatedDeck.caption, onChangeCaption },
      }),
    [navigate, updatedDeck, onChangeCaption]
  );

  return (
    <SafeAreaView style={Constants.styles.container} edges={['left', 'right', 'bottom']}>
      <ScreenHeader
        title="Deck Sharing"
        RightButtonComponent={
          <Pressable
            style={[
              Constants.styles.primaryButton,
              {
                marginRight: 16,
                opacity: updatedDeck.isChanged ? 1 : 0.5,
              },
            ]}
            disabled={!updatedDeck.isChanged}
            onPress={onSaveDeck}>
            <Text style={styles.primaryButtonLabel}>Save</Text>
          </Pressable>
        }
      />
      <View style={styles.content}>
        <Text style={styles.visibilityExplainer}>Who can play your deck?</Text>
        <View style={styles.visibilityContainer}>
          <VisibilityButton
            icon="public"
            visibility="public"
            name="Public"
            description="Anyone can find and view"
            isSelected={updatedDeck.visibility === 'public'}
            onChangeVisibility={onChangeVisibility}
          />
          <VisibilityButton
            icon="link"
            visibility="unlisted"
            name="Unlisted"
            description="Anyone with the link can view"
            isSelected={updatedDeck.visibility === 'unlisted'}
            onChangeVisibility={onChangeVisibility}
          />
          <VisibilityButton
            icon="lock"
            visibility="private"
            name="Private"
            description="Only visible to you"
            isSelected={updatedDeck.visibility === 'private'}
            onChangeVisibility={onChangeVisibility}
            isLast
          />
        </View>
      </View>
    </SafeAreaView>
  );
};
