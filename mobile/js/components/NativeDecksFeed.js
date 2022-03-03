import React from 'react';
import { GameView } from '../game/GameView';
import * as Constants from '../Constants';
import * as CoreViews from '../CoreViews';
import { DropdownItemsList } from './Dropdown';
import { usePopover } from './PopoverProvider';
import { getDropdownItems, getOnSelectDropdownAction } from '../play/PlayDeckActions';
import { useSession, blockUser, reportDeck } from '../Session';
import { sendAsync } from '../core/CoreEvents';
import { useGameViewAndroidBackHandler } from '../common/GameViewAndroidBackHandler';

export const NativeDecksFeed = ({ onPressComments, isCommentsOpen, onCloseComments }) => {
  const { userId: signedInUserId, isAnonymous, isMuted, setIsMuted } = useSession();
  const { showPopover } = usePopover();
  const container = React.useRef(null);

  const [deck, setDeck] = React.useState(null);
  const [creatorUserId, setCreatorUserId] = React.useState(null);

  const [popoverProps, setPopoverProps] = React.useState(null);

  const onBlockUser = React.useCallback(() => blockUser(creatorUserId, true), [creatorUserId]);
  const onReportDeck = React.useCallback(() => reportDeck(deck.deckId), [deck]);
  const onSetIsMuted = React.useCallback((isMuted) => {
    setIsMuted(isMuted);
    sendAsync('SET_SOUND_ENABLED', { enabled: isMuted ? false : true });
  })

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
        height: 52 * dropdownItems.length,
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

  CoreViews.useCoreViews({ onPressComments, onShowPopover });

  const onHardwareBackPress = React.useCallback(() => {
    if (isCommentsOpen) {
      onCloseComments();
      return true;
    }

    return false;
  }, [isCommentsOpen, onCloseComments]);
  useGameViewAndroidBackHandler({ onHardwareBackPress });

  return (
    <GameView
      ref={container}
      initialParams={JSON.stringify({
        screenId: 'featuredFeed',
        useNativeFeed: true,
        //nativeFeedDeckIds: ['Qj_sfZaIs', 'Od2Trh95G', '40pCTkzN2', 'PZS8by31X', 'p70imV9b5', 'rZqvqB_vl', 'BzerSltK9', 'kgETrH4RV', 'FHb49f-0n', 'AuKZO3tff'],
        //nativeFeedDeckIds: ['Cc9V03LFc'],
        textOverlayStyle: Constants.CORE_OVERLAY_TEXT_STYLE,
      })}
      coreViews={CoreViews.getCoreViews()}
      paused={isCommentsOpen}
    />
  );
};
