import * as React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { sendAsync } from '../../../core/CoreEvents';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  responseCells: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export const PlayPatternResponse = ({ response, onChangeResponse, children, order, ...props }) => {
  // TODO: reuse from context?
  const onPressPattern = () =>
    sendAsync('EDITOR_GLOBAL_ACTION', {
      action: 'setMode',
      value: 'sound',
    });
  return (
    <View style={styles.responseCells}>
      {children}
      <TouchableOpacity style={SceneCreatorConstants.styles.button} onPress={onPressPattern}>
        <Text style={SceneCreatorConstants.styles.buttonLabel}>Edit Pattern</Text>
      </TouchableOpacity>
    </View>
  );
};
