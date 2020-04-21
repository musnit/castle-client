import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Animated, TouchableWithoutFeedback } from 'react-native';

import FastImage from 'react-native-fast-image';

import { GameView } from './GameScreen';
import SceneCreator from './SceneCreator';

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

const USE_REMOTE_GAME = true;
const GAME_ID = USE_REMOTE_GAME ? '1uzqao' : null;
const GAME_URI = USE_REMOTE_GAME ? null : 'http://192.168.1.146:8080/project.castle';

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

  const backgroundImageOverlayOpacity = useRef(new Animated.Value(1)).current;
  const [loaded, setLoaded] = useState(false);
  let mounted;
  const onLoaded = async () => {
    if (!loaded) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      if (!loaded && mounted) {
        Animated.timing(backgroundImageOverlayOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }).start(() => mounted && setLoaded(true));
      }
    }
  };
  useEffect(() => {
    mounted = true;
    const timer = setTimeout(onLoaded, 1800);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
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
                  useSceneCreatorZip: true,
                  scene: {
                    sceneId: card.scene.sceneId,
                    data: card.scene.data,
                    deckState,
                  },
                  isEditing,
                }),
              }}
              toolsVisible={isEditing}
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
            {/* <SceneCreator /> */}
            {!interactionEnabled ? (
              <TouchableWithoutFeedback style={styles.overlay}>
                <View style={[styles.overlay, { opacity: 0 }]} />
              </TouchableWithoutFeedback>
            ) : null}
            {!loaded && card.backgroundImage ? (
              <React.Fragment>
                <Animated.View style={[styles.overlay, { opacity: backgroundImageOverlayOpacity }]}>
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
