import React from 'react';
import { InteractionManager, StyleSheet, View, ActivityIndicator } from 'react-native';

import FastImage from 'react-native-fast-image';

import * as Constants from '../Constants';
import Viewport from '../common/viewport';

// lua boots quickly on iOS, so only show the spinner for particularly slow cases.
// lua boots slowly on Android, so go ahead and show the spinner sooner to reduce
// the time where the screen is doing nothing.
const LOADING_SPINNER_DELAY = Constants.iOS ? 200 : 50;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 100 * Viewport.vw,
    height: 100 * Viewport.vw / Constants.CARD_RATIO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'contain',
    borderRadius: Constants.CARD_BORDER_RADIUS,
    overflow: 'hidden',
  },
});

export const GameLoading = ({ loadingImage, beltHeight }) => {
  const [visible, setVisible] = React.useState(false);

  // only show the loading spinner if we're still loading after some delay
  React.useEffect(() => {
    let timeout;
    const task = InteractionManager.runAfterInteractions(() => {
      timeout = setTimeout(() => {
        setVisible(true);
      }, LOADING_SPINNER_DELAY);
    });
    return () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }
      task.cancel();
    };
  }, []);

  return (
    <View style={[styles.container, { top: beltHeight }]}>
      {loadingImage?.url ? (
        <FastImage style={styles.backgroundImage} source={{ uri: loadingImage.url }} />
      ) : null}
      {visible ? <ActivityIndicator size="large" color="#fff" /> : null}
    </View>
  );
};
