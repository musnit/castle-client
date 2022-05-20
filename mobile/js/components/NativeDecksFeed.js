import React, { useEffect } from 'react';
import { View } from 'react-native';
import { gql } from '@apollo/client';

import { GameView } from '../game/GameView';
import * as Constants from '../Constants';
import * as CoreViews from '../CoreViews';
import { DropdownItemsList } from './Dropdown';
import { usePopover } from './PopoverProvider';
import { usePlayDeckActions } from '../play/PlayDeckActions';
import { useSession } from '../Session';
import { useListen } from '../core/CoreEvents';
import { useAppState } from '../ghost/GhostAppState';
import { useGameViewAndroidBackHandler } from '../common/GameViewAndroidBackHandler';
import { useFocusEffect, useNavigation } from '../ReactNavigation';
import * as Session from '../Session';
import * as Analytics from '../common/Analytics';

export const NativeDecksFeed = ({
  onPressComments,
  isCommentsOpen,
  onCloseComments,
  deckIds,
  initialDeckIndex,
  screenId,
  paginateFeedId,
  previousScreenName,
  deepLinkDeckId,
}) => {
  const {
    userId: signedInUserId,
    setIsNuxCompleted,
    setIsNativeFeedNuxCompleted,
    isNuxCompleted,
    isNativeFeedNuxCompleted,
  } = useSession();

  const { showPopover } = usePopover();
  const container = React.useRef(null);

  const { navigate } = useNavigation();

  const [deck, setDeck] = React.useState(null);

  const [popoverProps, setPopoverProps] = React.useState(null);
  const [appState, setAppState] = React.useState('active');
  useAppState(setAppState);

  useListen({
    eventName: 'NUX_COMPLETED',
    handler: () => {
      setIsNuxCompleted(true);
      setIsNativeFeedNuxCompleted(true);

      Analytics.logEventSkipAmplitude('NUX_COMPLETED');
    },
  });

  useEffect(() => {
    if (!isNuxCompleted) {
      Analytics.logEventSkipAmplitude('NUX_STARTED');
    }
  }, [isNuxCompleted]);

  const playDeckActions = React.useRef({});
  const isMe = deck?.creator?.userId === signedInUserId;
  playDeckActions.current = usePlayDeckActions({
    deck,
    isMe,
  });

  React.useEffect(() => {
    if (popoverProps) {
      const { items: dropdownItems, onSelectItem } = playDeckActions.current;
      const popover = {
        Component: DropdownItemsList,
        items: dropdownItems,
        selectedItem: null,
        height: 45 * dropdownItems.length,
        width: 256,
        onSelectItem: (item) => onSelectItem(item.id),
      };

      let measureRef = null;
      if (container.current) {
        measureRef = {
          measure: (fn) => {
            if (container.current) {
              container.current.measure(
                (x, y, anchorWidth, anchorHeight, anchorLeft, anchorTop) => {
                  fn(
                    x,
                    y,
                    popoverProps.width,
                    popoverProps.height,
                    anchorLeft + popoverProps.left,
                    anchorTop + popoverProps.top
                  );
                }
              );
            }
          },
        };
      }

      showPopover({ measureRef, ...popover });
    }
  }, [popoverProps]);

  const onShowPopover = (props) => {
    let deck = JSON.parse(props.deck);

    setDeck(deck);
    setPopoverProps(props);

    Analytics.logEventSkipAmplitude('OPEN_SHARE_MENU', {
      deckId: deck.deckId,
    });
  };

  const onNavigateToParent = async (props) => {
    let deck = JSON.parse(props.deck);

    const result = await Session.apolloClient.query({
      query: gql`
          query GetDeckById($deckId: ID!) {
            deck(deckId: $deckId) {
              ${Constants.FEED_ITEM_DECK_FRAGMENT}
            }
          }
        `,
      variables: { deckId: deck.parentDeckId },
    });
    if (result?.data?.deck && result.data.deck.visibility === 'public') {
      Analytics.logEventSkipAmplitude('VIEW_PARENT_DECK', {
        deckId: deck.deckId,
        parentDeckId: deck.parentDeckId
      });

      return navigate(
        'DeckRemixes',
        {
          deck: result.data.deck,
        },
        {
          isFullscreen: true,
        }
      );
    }
  };

  CoreViews.useCoreViews({ onPressComments, onShowPopover, onNavigateToParent });

  const onHardwareBackPress = React.useCallback(() => {
    if (isCommentsOpen) {
      onCloseComments();
      return true;
    }

    return false;
  }, [isCommentsOpen, onCloseComments]);
  useGameViewAndroidBackHandler({ onHardwareBackPress });

  const [isFocused, setIsFocused] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      Analytics.logEventSkipAmplitude('VIEW_FEED', {
        screen: previousScreenName,
      });

      return () => {
        setIsFocused(false);
      };
    }, [previousScreenName, setIsFocused])
  );

  const viewFeedItemCallback = React.useCallback(
    (event) => {
      if (isFocused) {
        Analytics.logEventSkipAmplitude('VIEW_FEED_ITEM', {
          deckId: event.deckId,
          visibility: event.visibility,
          index: event.index,
          impressionId: event.impressionId,
        });
      }
    },
    [isFocused]
  );

  useListen({
    eventName: 'VIEW_FEED_ITEM',
    handler: viewFeedItemCallback,
  });

  React.useEffect(onCloseComments, [deepLinkDeckId]);

  return (
    <GameView
      ref={container}
      initialParams={JSON.stringify({
        screenId,
        useNativeFeed: true,
        nativeFeedDeckIds: deckIds,
        initialDeckIndex,
        paginateFeedId,
        textOverlayStyle: Constants.CORE_OVERLAY_TEXT_STYLE,
        isNuxCompleted,
        isNativeFeedNuxCompleted,
        deepLinkDeckId,
      })}
      coreViews={CoreViews.getCoreViews()}
      paused={isCommentsOpen || appState !== 'active'}
    />
  );
};
