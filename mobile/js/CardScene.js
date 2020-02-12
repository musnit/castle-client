import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import FastImage from 'react-native-fast-image';

import { GameView } from './GameScreen';

const styles = StyleSheet.create({
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

const TESTING_SCENE_CREATOR_INTEGRATION = false;
const USE_REMOTE_GAME = true;
const GAME_ID = USE_REMOTE_GAME ? '1uzqao' : null;
const GAME_URI = USE_REMOTE_GAME ? null : 'http://192.168.1.145:8080/project.castle';

const CardScene = ({ card, style, isEditing, onEndEditing }) => {
  const [reloadCount, setReloadCount] = useState(0);
  const onPressReload = async () => {
    await new Promise((resolve) => setTimeout(resolve, 40));
    setReloadCount(reloadCount + 1);
  };

  const [logsVisible, setLogsVisible] = useState(false);

  return (
    <View style={style}>
      {TESTING_SCENE_CREATOR_INTEGRATION ? (
        <GameView
          key={`game-view-${reloadCount}`}
          gameId={GAME_ID}
          gameUri={GAME_URI}
          extras={{}}
          toolsVisible={isEditing}
          headerVisible={isEditing}
          onPressReload={onPressReload}
          logsVisible={isEditing && logsVisible}
          setLogsVisible={setLogsVisible}
          onPressBack={onEndEditing}
        />
      ) : (
        card &&
        card.backgroundImage && (
          <FastImage style={styles.backgroundImage} source={{ uri: card.backgroundImage.url }} />
        )
      )}
    </View>
  );
};

export default CardScene;
