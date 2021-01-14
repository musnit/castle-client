import React from 'react';
import { InteractionManager, StyleSheet, View, ActivityIndicator } from 'react-native';

import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'cover',
  },
});

export const GameLoading = ({ loadingImage }) => {
  const [visible, setVisible] = React.useState(false);

  // only show the loading spinner if we're still loading after some delay
  React.useEffect(() => {
    let timeout;
    const task = InteractionManager.runAfterInteractions(() => {
      timeout = setTimeout(() => {
        setVisible(true);
      }, 500);
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
    <View style={styles.container}>
      {loadingImage?.url ? (
        <FastImage style={styles.backgroundImage} source={{ uri: loadingImage.url }} />
      ) : null}
      {visible ? <ActivityIndicator size="large" color="#fff" /> : null}
    </View>
  );
};
