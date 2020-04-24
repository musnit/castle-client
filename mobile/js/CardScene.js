import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Animated, TouchableWithoutFeedback } from 'react-native';

import FastImage from 'react-native-fast-image';

import GameView from './GameView';

const styles = StyleSheet.create({
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
});

const CardScene = ({
  card,
  style,
  interactionEnabled = true,
  isEditing = false,
  onEndEditing,
  onScreenshot,
  onMessage,
  deckState,
}) => {
  const [reloadCount, setReloadCount] = useState(0);
  const onPressReload = async () => {
    await new Promise((resolve) => setTimeout(resolve, 40));
    setReloadCount(reloadCount + 1);
  };

  const [logsVisible, setLogsVisible] = useState(false);

  const [loaded, setLoaded] = useState(false);
  const onLoaded = async () => {
    setLoaded(true);
  };

  // TODO: this is necessary because PlayDeckNavigator renders two CardScenes when transitioning
  // to the next card from a choice block. Only one native GhostView can be on the screen at once
  // so this delay prevents that from happening. it would be better if PlayDeckNavigator passed
  // in a prop once the old CardScene is gone
  const [shouldDisplay, setShouldDisplay] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setShouldDisplay(true);
    }, 10);
  }, []);

  return (
    <View style={style}>
      {card &&
        (card.scene ? (
          <React.Fragment>
            {shouldDisplay && (
              <GameView
                key={`game-view-${card.cardId}-${reloadCount}`}
                extras={{
                  initialParams: JSON.stringify({
                    scene: {
                      sceneId: card.scene.sceneId,
                      data: card.scene.data,
                      deckState,
                    },
                    isEditing,
                  }),
                }}
                headerVisible={false}
                onPressReload={onPressReload}
                logsVisible={isEditing && logsVisible}
                setLogsVisible={setLogsVisible}
                onPressBack={onEndEditing}
                onScreenshot={onScreenshot}
                onMessage={onMessage}
                onLoaded={onLoaded}
                deckState={deckState}
              />
            )}
            {!interactionEnabled ? (
              <TouchableWithoutFeedback style={styles.overlay}>
                <View style={[styles.overlay, { opacity: 0 }]} />
              </TouchableWithoutFeedback>
            ) : null}
            {!loaded && card.backgroundImage ? (
              <React.Fragment>
                <Animated.View style={styles.overlay}>
                  <FastImage style={{ flex: 1 }} source={{ uri: card.backgroundImage.url }} />
                </Animated.View>
              </React.Fragment>
            ) : null}
          </React.Fragment>
        ) : card.backgroundImage ? (
          <FastImage style={styles.backgroundImage} source={{ uri: card.backgroundImage.url }} />
        ) : null)}
    </View>
  );
};

export default CardScene;
