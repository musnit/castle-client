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
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  backgroundImageContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 100 * Viewport.vw,
    bottom: 0,
    alignItems: 'center',
  },
  backgroundImage: {
    aspectRatio: Constants.CARD_RATIO,
    width: '100%',
    height: '100%',
    maxWidth: 100 * Viewport.vw,
    maxHeight: (100 * Viewport.vw) / Constants.CARD_RATIO,
    borderRadius: Constants.CARD_BORDER_RADIUS,
    overflow: 'hidden',
  },
  activityIndicatorContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const GameLoading = ({ loadingImage, beltHeight, isEditable }) => {
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

  const backgroundImageComponent = (
    <FastImage style={styles.backgroundImage} source={{ uri: loadingImage?.url }} />
  );

  return (
    <View style={styles.container}>
      {loadingImage?.url ? (
        isEditable ? (
          <View style={[styles.backgroundImageContainer, { paddingTop: beltHeight }]}>
            {backgroundImageComponent}
          </View>
        ) : (
          backgroundImageComponent
        )
      ) : null}
      {visible && !isEditable ? (
        <View style={styles.activityIndicatorContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : null}
    </View>
  );
};
