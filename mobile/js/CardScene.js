import React from 'react';
import { StyleSheet, View } from 'react-native';

import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

const CardScene = (props) => {
  const { card } = props;
  return (
    <View style={props.style}>
      {card && card.backgroundImage && (
        <FastImage style={styles.backgroundImage} source={{ uri: card.backgroundImage.url }} />
      )}
    </View>
  );
};

export default CardScene;
