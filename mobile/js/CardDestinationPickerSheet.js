import React from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';

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
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: '#666',
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

class CardDestinationPickerSheet extends React.Component {
  _sheetRef = React.createRef(null);

  open = () => {
    if (this._sheetRef.current) {
      this._sheetRef.current.snapTo(0);
    }
  };

  close = () => {
    if (this._sheetRef.current) {
      this._sheetRef.current.snapTo(1);
    }
  };

  _onOpenStart = () => {
    // needed in case some other text input was already showing the keyboard,
    // which overlaps with the expanding drawer
    Keyboard.dismiss();
  };

  _onCloseStart = () => {
    // needed because closing the drawer
    // doesn't necessarily unmount/unfocus the child text input
    Keyboard.dismiss();
  };

  _renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>
      <Text style={styles.title}>Destination</Text>
    </View>
  );

  _renderContent = () => {
    const { deck, onSelectCard } = this.props;
    return (
      <View style={styles.container}>
        <CardsSet deck={deck} onPress={onSelectCard} showNewCard />
      </View>
    );
  };

  render() {
    return (
      <BottomSheet
        ref={this._sheetRef}
        snapPoints={[DRAWER_EXPANDED_HEIGHT, 0]}
        initialSnap={1}
        onCloseStart={this._onCloseStart}
        onOpenStart={this._onOpenStart}
        renderHeader={this._renderHeader}
        renderContent={this._renderContent}
      />
    );
  }
}

export default CardDestinationPickerSheet;
