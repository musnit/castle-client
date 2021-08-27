import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useCoreState } from '../../../core/CoreEvents';

import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 24,
    height: 24,
  },
  title: {
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export const InspectorBlueprintHeader = () => {
  const selectedActorData = useCoreState('EDITOR_SELECTED_ACTOR');
  const libraryEntry = selectedActorData?.libraryEntry || { title: '' };
  return (
    <View style={styles.container}>
      <FastImage
        style={styles.image}
        source={{ uri: `data:image/png;base64,${libraryEntry.base64Png}` }}
      />
      <Text style={styles.title}>{libraryEntry.title}</Text>
    </View>
  );
};
