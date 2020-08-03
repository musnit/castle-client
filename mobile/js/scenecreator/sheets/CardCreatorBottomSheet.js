import React from 'react';
import { Keyboard, View } from 'react-native';
import { BottomSheet } from '../../components/BottomSheet';
import { useSafeArea } from 'react-native-safe-area-context';
import { CARD_HEADER_HEIGHT } from '../CreateCardHeader';
import { ToolPane } from '../../Tools';

import Viewport from '../../common/viewport';

import * as Constants from '../../Constants';

const SCREEN_HEIGHT = 100 * Viewport.vh;
const CARD_HEIGHT = (1 / Constants.CARD_RATIO) * 100 * Viewport.vw;

export const CardCreatorBottomSheet = React.memo(
  ({ element, isOpen, renderHeader, renderContent, headerHeight = 64, ...props }) => {
    const insets = useSafeArea();

    if (!renderContent) {
      // TODO: gradually eliminate this case
      renderContent = () => <ToolPane element={element} />;
    }

    const middleSnapPoint = element?.props?.contentHeight ?? SCREEN_HEIGHT * 0.4;

    const snapPoints = [
      // bottom snap is the bottom edge of the card,
      // unless that would be too small and then it's the header height of the panel
      Math.max(
        SCREEN_HEIGHT - (insets.top + CARD_HEADER_HEIGHT + CARD_HEIGHT),
        headerHeight + insets.bottom
      ),

      Math.max(
        middleSnapPoint,
        380 // middle snap should sit above the keyboard on small screens
      ),

      // top snap is flush with the bottom of the card header (play/undo)
      SCREEN_HEIGHT - (CARD_HEADER_HEIGHT + insets.top),
    ];

    return (
      <BottomSheet
        snapPoints={snapPoints}
        initialSnap={1}
        headerHeight={headerHeight}
        renderHeader={renderHeader}
        renderContent={renderContent}
        isOpen={isOpen}
        onOpenEnd={Keyboard.dismiss}
        onCloseEnd={Keyboard.dismiss}
        style={{
          backgroundColor: '#fff',
          borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
          borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
        }}
        {...props}
      />
    );
  }
);
