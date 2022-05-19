import * as React from 'react';
import { Pressable, TextInput, TouchableOpacity, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { AuthPrompt } from '../auth/AuthPrompt';
import { ConfigureDeck } from '../create/ConfigureDeck';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { shareDeck } from '../common/utilities';
import { ShareRemixInterstitialSheet } from './ShareRemixInterstitialSheet';
import { SheetBackgroundOverlay } from '../components/SheetBackgroundOverlay';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useMutation, gql } from '@apollo/client';
import { useNavigation } from '../ReactNavigation';
import { useSession } from '../Session';

import * as Analytics from '../common/Analytics';
import * as Constants from '../Constants';

import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  authContainer: {
    backgroundColor: '#000',
    flex: 1,
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  item: {
    height: 48,
    paddingHorizontal: 12,
    borderBottomColor: '#888',
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    flexShrink: 0,
    paddingRight: 12,
  },
  itemContents: {
    width: '100%',
    flexShrink: 1,
    flexDirection: 'row',
  },
  itemSelectedIcon: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    color: Constants.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    width: 80,
  },
  itemDescription: {
    color: Constants.colors.white,
    fontSize: 16,
  },
  visibilityExplainer: {
    color: Constants.colors.white,
    fontSize: 16,
    paddingBottom: 12,
  },
  visibilityContainer: {
    borderColor: '#888',
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 20,
  },
  captionForm: {
    borderColor: '#888',
    borderWidth: 1,
    marginBottom: 20,
    borderRadius: 4,
  },
  captionInputWrapper: {
    padding: 12,
    paddingTop: 4,
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
    marginBottom: 20,
  },
  shareLink: {
    padding: 10,
    paddingLeft: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareLinkUrl: {
    fontSize: 16,
  },
  congratulations: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
  },
  congratsIcon: {
    marginRight: 16,
  },
  congratsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  congratsText: {
    fontSize: 16,
    lineHeight: 20,
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
      style={[styles.item, { borderBottomWidth: isLast ? 0 : 1 }]}
      onPress={() => onChangeVisibility(visibility)}>
      {icon ? (
        <View style={styles.itemIcon}>
          <Icon name={icon} color={isSelected ? '#fff' : '#888'} size={22} />
        </View>
      ) : null}
      <View style={styles.itemContents}>
        <Text style={[styles.itemName, isSelected ? null : { opacity: 0.5 }]}>{name}</Text>
        <Text style={[styles.itemDescription, isSelected ? null : { opacity: 0.5 }]}>
          {description}
        </Text>
      </View>
      {isSelected ? (
        <View style={styles.itemSelectedIcon}>
          <Icon name="check" color="#fff" size={28} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const Congratulations = () => (
  <View style={styles.congratulations}>
    <FastImage
      style={{ height: 26, aspectRatio: 1, marginRight: 12 }}
      source={require('../../assets/images/emoji/wand-black.png')}
    />
    <View style={{ flex: 1 }}>
      <Text style={styles.congratsHeader}>Your deck has been published!</Text>
      <Text style={styles.congratsText}>
        Anyone on Castle can find and play it. Share the link to play it on the web.
      </Text>
    </View>
  </View>
);

export const ShareDeckScreen = (props) => {
  const { isAnonymous } = useSession();

  if (isAnonymous) {
    return (
      <View style={styles.authContainer}>
        <ScreenHeader title="Deck Sharing" />
        <AuthPrompt
          title="Share your decks"
          message="Publish your decks to your profile, or get a link to share with friends."
          hideLogin
        />
      </View>
    );
  } else {
    return <ShareDeckScreenAuthenticated {...props} />;
  }
};

const ShareDeckScreenAuthenticated = ({ route }) => {
  const { pop, popToTop } = useNavigation();
  const { showActionSheetWithOptions } = useActionSheet();
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
  const [isRemixInterstitialVisible, setRemixInterstitialVisible] = React.useState(false);

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

  const maybeSaveDeck = React.useCallback(() => {
    // if this is a remix and we're switching it to public, prompt before saving
    if (
      deck.parentDeckId &&
      updatedDeck.visibility !== lastSavedVisibility &&
      updatedDeck.visibility === 'public'
    ) {
      setRemixInterstitialVisible(true);
    } else {
      onSaveDeck();
    }
  }, [
    updatedDeck,
    lastSavedVisibility,
    onSaveDeck,
    deck.parentDeckId,
    setRemixInterstitialVisible,
  ]);

  const onCancelPublishRemix = React.useCallback(
    () => setRemixInterstitialVisible(false),
    [setRemixInterstitialVisible]
  );
  const onConfirmPublishRemix = React.useCallback(() => {
    setRemixInterstitialVisible(false);
    onSaveDeck();
  }, [onSaveDeck, setRemixInterstitialVisible]);

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

  const maybeGoBack = React.useCallback(() => {
    if (updatedDeck.isChanged) {
      showActionSheetWithOptions(
        {
          title: 'Discard changes?',
          options: ['Discard', 'Cancel'],
          destructiveButtonIndex: 0,
        },
        (index) => {
          if (index === 0) {
            pop();
          }
        }
      );
    } else {
      pop();
    }
  }, [pop, updatedDeck, showActionSheetWithOptions]);

  return (
    <>
      <SafeAreaView style={Constants.styles.container} edges={['left', 'right', 'bottom']}>
        <ScreenHeader
          title="Deck Sharing"
          onBackButtonPress={maybeGoBack}
          RightButtonComponent={
            <Pressable
              style={[
                Constants.styles.primaryButton,
                {
                  opacity: updatedDeck.isChanged ? 1 : 0.35,
                },
              ]}
              disabled={!updatedDeck.isChanged}
              onPress={maybeSaveDeck}>
              <Text style={Constants.styles.primaryButtonLabel}>Save</Text>
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
                <Text style={styles.shareLinkUrl}>Copy share link</Text>
                <Constants.CastleIcon
                  name={Constants.iOS ? 'share-ios' : 'share-android'}
                  size={20}
                  color="#000"
                />
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
          <Text style={styles.visibilityExplainer}>
            <Text style={{ fontWeight: 'bold' }}>Visibility:</Text> Who can play your deck?
          </Text>
          <View style={styles.visibilityContainer}>
            <VisibilityButton
              icon="public"
              visibility="public"
              name="Public"
              description="Anyone on Castle"
              isSelected={updatedDeck.visibility === 'public'}
              onChangeVisibility={onChangeVisibility}
            />
            <VisibilityButton
              icon="link"
              visibility="unlisted"
              name="Unlisted"
              description="Anyone with the link"
              isSelected={updatedDeck.visibility === 'unlisted'}
              onChangeVisibility={onChangeVisibility}
            />
            <VisibilityButton
              icon="lock"
              visibility="private"
              name="Private"
              description="Only you"
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
      {isRemixInterstitialVisible ? <SheetBackgroundOverlay /> : null}
      <ShareRemixInterstitialSheet
        deck={deck}
        isOpen={isRemixInterstitialVisible}
        onClose={onCancelPublishRemix}
        onConfirm={onConfirmPublishRemix}
      />
    </>
  );
};
