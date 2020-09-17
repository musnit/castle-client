import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Animated, TouchableWithoutFeedback } from 'react-native';
import { GameView } from './GameView';

import FastImage from 'react-native-fast-image';

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

export const CardScene = ({
  card,
  style,
  interactionEnabled = true,
  isEditing = false,
  isEditable = false,
  onScreenshot,
  onMessage,
  deckState,
  paused = false,
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

  const [shouldDisplay, setShouldDisplay] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShouldDisplay(true);
    }, 100);
    return () => clearTimeout(timeout);
  }, [card?.cardId]);

  return (
    <View style={style}>
      {card &&
        (card.scene && card.cardId ? (
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
                    isEditable,
                    isDebug: !!__DEV__,
                  }),
                }}
                headerVisible={false}
                onPressReload={onPressReload}
                logsVisible={isEditing && logsVisible}
                setLogsVisible={setLogsVisible}
                onScreenshot={onScreenshot}
                onMessage={onMessage}
                onLoaded={onLoaded}
                deckState={deckState}
                paused={paused}
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
