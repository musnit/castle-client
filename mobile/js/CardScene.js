import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Animated } from 'react-native';

import FastImage from 'react-native-fast-image';

import { GameView } from './GameScreen';

const styles = StyleSheet.create({
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlayImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'cover',
  },
});

const USE_REMOTE_GAME = true;
const GAME_ID = USE_REMOTE_GAME ? '1uzqao' : null;
const GAME_URI = USE_REMOTE_GAME ? null : 'http://192.168.1.28:8080/project.castle';

const CardScene = ({ card, style, isEditing = false, onEndEditing, onScreenshot }) => {
  const [reloadCount, setReloadCount] = useState(0);
  const onPressReload = async () => {
    await new Promise((resolve) => setTimeout(resolve, 40));
    setReloadCount(reloadCount + 1);
  };

  const [logsVisible, setLogsVisible] = useState(false);

  const loadingOverlayOpacity = useRef(new Animated.Value(1)).current;
  const [loaded, setLoaded] = useState(false);
  const onLoaded = async () => {
    if (!loaded) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      if (!loaded) {
        Animated.timing(loadingOverlayOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start(() => setLoaded(true));
      }
    }
  };
  useEffect(() => {
    setTimeout(onLoaded, 500);
  }, []);

  return (
    <View style={style}>
      {card &&
        (card.scene ? (
          <React.Fragment>
            <GameView
              key={`game-view-${card.scene.sceneId}-${reloadCount}`}
              gameId={GAME_ID}
              gameUri={GAME_URI}
              extras={{
                initialParams: JSON.stringify({
                  scene: {
                    sceneId: card.scene.sceneId,
                    data: card.scene.data,
                  },
                  isEditing,
                }),
              }}
              toolsVisible={isEditing}
              headerVisible={isEditing}
              onPressReload={onPressReload}
              logsVisible={isEditing && logsVisible}
              setLogsVisible={setLogsVisible}
              onPressBack={onEndEditing}
              onScreenshot={onScreenshot}
              onLoaded={onLoaded}
            />
            {!loaded && card.backgroundImage ? (
              <Animated.View style={[styles.overlayImage, { opacity: loadingOverlayOpacity }]}>
                <FastImage style={{ flex: 1 }} source={{ uri: card.backgroundImage.url }} />
              </Animated.View>
            ) : null}
          </React.Fragment>
        ) : card.backgroundImage ? (
          <FastImage style={styles.backgroundImage} source={{ uri: card.backgroundImage.url }} />
        ) : null)}
    </View>
  );
};

export default CardScene;
