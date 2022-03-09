import React from 'react';
import { View } from 'react-native';
import { GameView } from '../game/GameView';
import * as Constants from '../Constants';
import * as CoreViews from '../CoreViews';
import { DropdownItemsList } from './Dropdown';
import { usePopover } from './PopoverProvider';
import { getDropdownItems, getOnSelectDropdownAction } from '../play/PlayDeckActions';
import { useSession, blockUser, reportDeck } from '../Session';
import { sendAsync } from '../core/CoreEvents';
import { useGameViewAndroidBackHandler } from '../common/GameViewAndroidBackHandler';
import { ScreenHeader } from './ScreenHeader';

export const NativeDecksFeed = ({
  onPressComments,
  isCommentsOpen,
  onCloseComments,
  deckIds,
  initialDeckIndex,
  showBackButton,
  title = '',
  screenId,
}) => {
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

  let gameView = (
    <GameView
      ref={container}
      initialParams={JSON.stringify({
        screenId,
        useNativeFeed: true,
        nativeFeedDeckIds: deckIds,
        initialDeckIndex,
        textOverlayStyle: Constants.CORE_OVERLAY_TEXT_STYLE,
      })}
      coreViews={CoreViews.getCoreViews()}
      paused={isCommentsOpen}
    />
  );

  if (!showBackButton) {
    return gameView;
  }

  return (
    <View style={{flex: 1}}>
      <ScreenHeader title={title} />
      {gameView}
    </View>
  );
};
