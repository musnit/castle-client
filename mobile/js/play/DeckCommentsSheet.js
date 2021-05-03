import * as React from 'react';
import { StyleSheet, View, Keyboard } from 'react-native';

import { BottomSheetHeader } from '../components/BottomSheetHeader';
import { BottomSheet } from '../components/BottomSheet';
import { DeckComments } from './DeckComments';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Constants from '../Constants';

import Viewport from '../common/viewport';

const TAB_BAR_HEIGHT = 49;

export const DeckCommentsSheet = ({ isOpen, onClose, ...props }) => {
  const insets = useSafeAreaInsets();
  const maxSheetHeight = Viewport.vh * 100 - insets.top - Constants.FEED_HEADER_HEIGHT;

  const renderHeader = () => <BottomSheetHeader title="Comments" onClose={onClose} />;

  const renderContent = () => (
    <View style={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}>
      <DeckComments isOpen={isOpen} {...props} />
    </View>
  );

  return (
    <BottomSheet
      snapPoints={[maxSheetHeight]}
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
      onOpenEnd={Keyboard.dismiss}
      onCloseEnd={Keyboard.dismiss}
      style={{
        backgroundColor: '#fff',
        borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
        borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
        ...Constants.styles.dropShadowUp,
      }}
    />
  );
};
