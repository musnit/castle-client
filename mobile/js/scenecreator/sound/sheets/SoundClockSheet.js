import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { BottomSheet } from '../../../components/BottomSheet';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { ClockSettings } from '../../ClockSettings';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
});

export const SoundClockSheet = ({ isOpen, onClose, ...props }) => {
  const renderHeader = () => <BottomSheetHeader title="Clock Settings" onClose={onClose} />;

  const renderContent = () => {
    if (!isOpen) {
      return <View style={styles.container} />;
    }

    return <ClockSettings />;
  };
  return (
    <BottomSheet
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
      style={styles.container}
      {...props}
    />
  );
};
