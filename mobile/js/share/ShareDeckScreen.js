import * as React from 'react';
import { Pressable, TextInput, TouchableOpacity, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { ConfigureDeck } from '../create/ConfigureDeck';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { shareDeck } from '../common/utilities';
import { useMutation, gql } from '@apollo/client';
import { useNavigation } from '../ReactNavigation';
import * as Analytics from '../common/Analytics';

import * as Constants from '../Constants';

import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
    borderColor: '#888',
    borderRadius: 4,
    borderWidth: 1,
  },
  captionForm: {
    borderColor: '#888',
    borderWidth: 1,
    marginBottom: 16,
    borderRadius: 4,
  },
  captionInputWrapper: {
    padding: 12,
    paddingTop: 6,
    alignItems: 'flex-end',
  },
  captionInput: {
    width: '100%',
    fontSize: 16,
    minHeight: 72,
    color: '#fff',
  },
  shareContainer: {
    backgroundColor: Constants.colors.white,
    borderRadius: 4,
    marginBottom: 16,
  },
  shareLink: {
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareLinkUrl: {
    fontSize: 16,
  },
  congratulations: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    padding: 8,
    flexDirection: 'row',
  },
  congratsIcon: {
    marginRight: 16,
  },
  congratsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
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

const Congratulations = () => (
  <View style={styles.congratulations}>
    <Text style={styles.congratsIcon}>🎉</Text>
    <View>
      <Text style={styles.congratsHeader}>Your deck has been published!</Text>
      <Text>Anyone on Castle can find and play it. Share the link to play it on the web.</Text>
    </View>
  </View>
);

export const ShareDeckScreen = ({ route }) => {
  const { popToTop } = useNavigation();
  const deck = route.params.deck;

  const [loading, setLoading] = React.useState(false);
  const [didPublish, setDidPublish] = React.useState(false);
  const [lastSavedVisibility, setLastSavedVisibility] = React.useState(deck.visibility);
  const [updatedDeck, setUpdatedDeck] = React.useState({
    visibility: deck.visibility,
    caption: deck.caption,
    accessPermissions: deck.accessPermissions,
    commentsEnabled: deck.commentsEnabled,
    isChanged: false,
  });

  const [saveDeck] = useMutation(
    gql`
      mutation UpdateDeck($deck: DeckInput!) {
        updateDeckV2(deck: $deck) {
          deckId
          visibility
          caption
        }
      }
    `,
    {
      update: (cache, { data }) => {
        // clear comments cache in case they modified the comment enabled flag
        // https://www.apollographql.com/docs/react/caching/cache-interaction/#example-deleting-a-field-from-a-cached-object
        cache.modify({
          id: cache.identify(deck),
          fields: {
            comments(_, { DELETE }) {
              return DELETE;
            },
          },
        });
      },
    }
  );

  const [deleteDeck] = useMutation(
    gql`
      mutation DeleteDeck($deckId: ID!) {
        deleteDeck(deckId: $deckId)
      }
    `
  );
  const onDeleteDeck = React.useCallback(async () => {
    if (deck?.deckId) {
      await deleteDeck({ variables: { deckId: deck.deckId } });
    }
    popToTop();
  }, [deck, deleteDeck, popToTop]);

  // TODO: prompt to save when going back

  const onSaveDeck = React.useCallback(async () => {
    let mounted = true;
    let didPublish = false;

    const deckUpdateFragment = {
      deckId: deck.deckId,
      ...updatedDeck,
    };
    delete deckUpdateFragment.isChanged;

    await setLoading(true);
    if (updatedDeck.visibility !== lastSavedVisibility) {
      Analytics.logEvent('CHANGE_DECK_VISIBILITY', {
        deckId: deck.deckId,
        visibility: updatedDeck.visibility,
      });
      if (updatedDeck.visibility === 'public') {
        didPublish = true;
      }
    }
    if (updatedDeck.caption !== deck.caption) {
      Analytics.logEvent('CHANGE_DECK_CAPTION', {
        deckId: deck.deckId,
      });
    }
    await saveDeck({ variables: { deck: deckUpdateFragment } });
    if (mounted) {
      setLoading(false);
      setUpdatedDeck({
        ...updatedDeck,
        isChanged: false,
      });
      setLastSavedVisibility(updatedDeck.visibility);
      setDidPublish(didPublish);
    }
    return () => (mounted = false);
  }, [
    saveDeck,
    deck,
    updatedDeck,
    setUpdatedDeck,
    setLoading,
    lastSavedVisibility,
    setLastSavedVisibility,
    setDidPublish,
  ]);

  const onChangeCaption = React.useCallback(
    (caption) =>
      setUpdatedDeck({
        ...updatedDeck,
        caption,
        isChanged: true,
      }),
    [updatedDeck, setUpdatedDeck]
  );

  const onChangeVisibility = React.useCallback(
    (visibility) =>
      setUpdatedDeck({
        ...updatedDeck,
        visibility,
        isChanged: true,
      }),
    [updatedDeck, setUpdatedDeck]
  );

  const onChangeAccessPermissions = React.useCallback(
    (accessPermissions) =>
      setUpdatedDeck({
        ...updatedDeck,
        accessPermissions,
        isChanged: true,
      }),
    [updatedDeck, setUpdatedDeck]
  );

  const onChangeCommentsEnabled = React.useCallback(
    (commentsEnabled) =>
      setUpdatedDeck({
        ...updatedDeck,
        commentsEnabled,
        isChanged: true,
      }),
    [updatedDeck, setUpdatedDeck]
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
        {lastSavedVisibility !== 'private' ? (
          <View style={styles.shareContainer}>
            {didPublish ? <Congratulations /> : null}
            <Pressable
              style={({ pressed }) => [
                styles.shareLink,
                { backgroundColor: pressed ? '#ccc' : undefined },
              ]}
              onPress={() => shareDeck(deck)}>
              <Text style={styles.shareLinkUrl}>Get a link</Text>
              <Feather name={Constants.iOS ? 'share' : 'share-2'} size={24} color="#000" />
            </Pressable>
          </View>
        ) : null}
        <View style={styles.captionForm}>
          <View style={styles.captionInputWrapper}>
            <TextInput
              value={updatedDeck.caption}
              placeholder="Add a caption and #tags"
              multiline
              editable={!loading}
              onChangeText={onChangeCaption}
              style={styles.captionInput}
              placeholderTextColor={Constants.colors.grayOnBlackText}
            />
          </View>
        </View>
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
        <ConfigureDeck
          deck={updatedDeck}
          onDeleteDeck={onDeleteDeck}
          onChangeAccessPermissions={onChangeAccessPermissions}
          onChangeCommentsEnabled={onChangeCommentsEnabled}
        />
      </View>
    </SafeAreaView>
  );
};
