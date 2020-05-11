import React from 'react';
import { Animated, Keyboard, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

import { BottomSheet } from './BottomSheet';
import CardsSet from './CardsSet';

const DRAWER_EXPANDED_HEIGHT = 500;
const BG_ANIMATION_DURATION_IN_MS = 200;
const BG_ANIMATION_DURATION_OUT_MS = 150;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: '#666',
  },
  content: {
    backgroundColor: '#000',
    height: DRAWER_EXPANDED_HEIGHT - 16 - 24,
  },
  header: {
    backgroundColor: '#000',
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
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
  },
});

class CardDestinationPickerSheet extends React.Component {
  _sheetRef = React.createRef(null);
  state = {
    isOpen: false,
    overlayOpacity: new Animated.Value(0),
  };

  open = () => {
    // needed in case some other text input was already showing the keyboard,
    // which overlaps with the expanding drawer
    Keyboard.dismiss();
    this.setState({ isOpen: true });
    Animated.timing(this.state.overlayOpacity, {
      toValue: 0.5,
      duration: BG_ANIMATION_DURATION_IN_MS,
    }).start();
  };

  close = () => {
    // needed because closing the drawer
    // doesn't necessarily unmount/unfocus the child text input
    Keyboard.dismiss();
    this.setState({ isOpen: false });
    Animated.timing(this.state.overlayOpacity, {
      toValue: 0,
      duration: BG_ANIMATION_DURATION_OUT_MS,
    }).start();
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
      <View style={styles.content}>
        <CardsSet deck={deck} onPress={onSelectCard} showNewCard />
      </View>
    );
  };

  render() {
    const { isOpen, overlayOpacity } = this.state;
    return (
      <React.Fragment>
        {isOpen && (
          <TouchableWithoutFeedback onPress={this.close}>
            <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
          </TouchableWithoutFeedback>
        )}
        <BottomSheet
          snapPoints={[DRAWER_EXPANDED_HEIGHT]}
          isOpen={isOpen}
          style={styles.container}
          renderHeader={this._renderHeader}
          renderContent={this._renderContent}
        />
      </React.Fragment>
    );
  }
}

export default CardDestinationPickerSheet;
