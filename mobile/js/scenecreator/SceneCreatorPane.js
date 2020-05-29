import React from 'react';
import { Keyboard, View } from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { useSafeArea } from 'react-native-safe-area-context';

import { CARD_HEADER_HEIGHT } from '../CardHeader';
import { ToolPane } from '../Tools';

import Viewport from '../viewport';

import * as Constants from '../Constants';

const SCREEN_HEIGHT = 100 * Viewport.vh;
const CARD_HEIGHT = (1 / Constants.CARD_RATIO) * 100 * Viewport.vw;

export default SceneCreatorPane = React.memo(
  ({ element, visible, context, renderHeader, headerHeight = 64, ...props }) => {
    const insets = useSafeArea();

    const renderContent = () => (
      <ToolPane element={element} context={context} style={{ marginTop: 16 }} />
    );

    const snapPoints = [
      // bottom snap is the bottom edge of the card,
      // unless that would be too small and then it's the header height of the panel
      Math.max(
        SCREEN_HEIGHT - (insets.top + CARD_HEADER_HEIGHT + CARD_HEIGHT),
        headerHeight + insets.bottom
      ),

      SCREEN_HEIGHT * 0.6,

      // top snap is flush with the bottom of the card header (play/undo)
      SCREEN_HEIGHT - (CARD_HEADER_HEIGHT + insets.top),
    ];

    return (
      <BottomSheet
        snapPoints={snapPoints}
        initialSnap={1}
        renderHeader={renderHeader}
        renderContent={renderContent}
        isOpen={visible}
        onOpenEnd={Keyboard.dismiss}
        onCloseEnd={Keyboard.dismiss}
        style={{ backgroundColor: '#fff', borderTopLeftRadius: Constants.CARD_BORDER_RADIUS, borderTopRightRadius: Constants.CARD_BORDER_RADIUS }}
        {...props}
      />
    );
  }
);
