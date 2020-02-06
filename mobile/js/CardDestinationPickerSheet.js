import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import BottomSheet from 'reanimated-bottom-sheet';
import CardsSet from './CardsSet';

const DRAWER_EXPANDED_HEIGHT = 500;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    height: DRAWER_EXPANDED_HEIGHT - 16 - 24,
  },
  header: {
    backgroundColor: '#000',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: '#444',
  },
  handleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    backgroundColor: '#666',
    borderRadius: 3,
    width: 48,
    padding: 2,
    marginTop: 12,
  },
  title: {
    color: '#fff',
    textTransform: 'uppercase',
    padding: 12,
    paddingBottom: 0,
    fontWeight: '700',
  },
});

const CardDestinationPickerSheet = ({ deck, sheetRef, onSelectCard }) => {
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>
      <Text style={styles.title}>Destination</Text>
    </View>
  );

  const renderContent = () => (
    <View style={styles.container}>
      <CardsSet deck={deck} onPress={onSelectCard} />
    </View>
  );

  return (
    <BottomSheet
      ref={sheetRef}
      borderRadius={6}
      snapPoints={[DRAWER_EXPANDED_HEIGHT, 0]}
      initialSnap={1}
      renderHeader={renderHeader}
      renderContent={renderContent}
    />
  );
};

export default CardDestinationPickerSheet;
