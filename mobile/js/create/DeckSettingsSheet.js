import * as React from 'react';
import { StyleSheet, View, Keyboard } from 'react-native';

import { BottomSheetHeader } from '../components/BottomSheetHeader';
import { BottomSheet } from '../components/BottomSheet';
import { ConfigureDeck } from './ConfigureDeck';
import { useSafeArea } from 'react-native-safe-area-context';

import * as Constants from '../Constants';

const SHEET_HEIGHT = 360;
const TAB_BAR_HEIGHT = 49;

export const DeckSettingsSheet = ({ isOpen, onClose, ...props }) => {
  const insets = useSafeArea();

  const renderHeader = () => <BottomSheetHeader title="Deck Settings" onClose={onClose} />;

  const renderContent = () => (
    <View style={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}>
      <ConfigureDeck {...props} />
    </View>
  );

  return (
    <BottomSheet
      snapPoints={[SHEET_HEIGHT]}
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
      onOpenEnd={Keyboard.dismiss}
      style={{
        backgroundColor: '#fff',
        borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
        borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
        ...Constants.styles.dropShadowUp,
      }}
    />
  );
};