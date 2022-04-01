import React from 'react';
import { View } from 'react-native';
import { gql } from '@apollo/client';

import { GameView } from '../game/GameView';
import * as Constants from '../Constants';
import * as CoreViews from '../CoreViews';
import { DropdownItemsList } from './Dropdown';
import { usePopover } from './PopoverProvider';
import { getDropdownItems, getOnSelectDropdownAction } from '../play/PlayDeckActions';
import { useSession, blockUser, reportDeck } from '../Session';
import { sendAsync, useListen } from '../core/CoreEvents';
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
    isAnonymous,
    isMuted,
    setIsMuted,
    setIsNuxCompleted,
    setIsNativeFeedNuxCompleted,
    isNuxCompleted,
    isNativeFeedNuxCompleted,
  } = useSession();

  const { showPopover } = usePopover();
  const container = React.useRef(null);

  const { navigate } = useNavigation();

  const [deck, setDeck] = React.useState(null);
  const [creatorUserId, setCreatorUserId] = React.useState(null);

  const [popoverProps, setPopoverProps] = React.useState(null);
  const [appState, setAppState] = React.useState('active');
  useAppState(setAppState);

  const onBlockUser = React.useCallback(() => blockUser(creatorUserId, true), [creatorUserId]);
  const onReportDeck = React.useCallback(() => reportDeck(deck.deckId), [deck]);
  const onSetIsMuted = React.useCallback((isMuted) => {
    setIsMuted(isMuted);
    sendAsync('SET_SOUND_ENABLED', { enabled: isMuted ? false : true });
  });

  useListen({
    eventName: 'NUX_COMPLETED',
    handler: () => {
      setIsNuxCompleted(true);
      setIsNativeFeedNuxCompleted(true);
    },
  });

  let onSelectDropdownAction = getOnSelectDropdownAction({
    deck,
    onBlockUser,
    onReportDeck,
    onSetIsMuted,
    isMuted,
  });

  React.useEffect(() => {
    if (popoverProps) {
      const isMe = deck?.creator?.userId === signedInUserId;

      let dropdownItems = getDropdownItems({
        isAnonymous,
        creatorUsername: deck?.creator?.username,
        isMe,
        onBlockUser,
        onReportDeck,
        isMuted,
      });

      const popover = {
        Component: DropdownItemsList,
        items: dropdownItems,
        selectedItem: null,
        height: 45 * dropdownItems.length,
        width: 256,
        onSelectItem: (item) => onSelectDropdownAction(item.id),
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
    setCreatorUserId(deck?.creator?.userId);

    setPopoverProps(props);
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
      Analytics.logEvent('VIEW_FEED', {
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
        Analytics.logEvent('VIEW_FEED_ITEM', {
          deckId: event.deckId,
          visibility: event.visibility,
          index: event.index,
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
