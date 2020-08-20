import React from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

import { BottomSheet } from '../../components/BottomSheet';
import { BottomSheetHeader } from '../../components/BottomSheetHeader';
import { CardsSet } from '../../components/CardsSet';
import { useCardCreator } from '../CreateCardContext';

import * as Constants from '../../Constants';

const DRAWER_EXPANDED_HEIGHT = 500;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
    borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: '#666',
  },
  content: {
    backgroundColor: '#000',
    minHeight: DRAWER_EXPANDED_HEIGHT - 16 - 24,
  },
});

export const CardDestinationPickerSheet = ({ onSelectCard, isOpen, onClose }) => {
  const { deck } = useCardCreator();

  const selectAndClose = (card) => {
    onSelectCard(card);
    onClose();
  };

  const renderHeader = () => <BottomSheetHeader title="Destination" onClose={onClose} />;

  const renderContent = () => {
    return (
      <View style={styles.content}>
        <CardsSet deck={deck} onPress={selectAndClose} showNewCard />
      </View>
    );
  };

  return (
    <BottomSheet
      snapPoints={[DRAWER_EXPANDED_HEIGHT]}
      isOpen={isOpen}
      style={styles.container}
      renderHeader={renderHeader}
      renderContent={renderContent}
    />
  );
};
