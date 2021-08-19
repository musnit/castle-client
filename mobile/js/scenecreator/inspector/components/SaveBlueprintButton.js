import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

export const SaveBlueprintButton = ({ label = 'Save blueprint' }) => {
  // TODO: restore
  const sendAction = () => {};
  const data = {};

  return (
    <TouchableOpacity
      onPress={() => {
        sendAction('updateBlueprint', data.saveBlueprintData);
      }}
      style={SceneCreatorConstants.styles.button}>
      <Text style={SceneCreatorConstants.styles.buttonLabel}>{label}</Text>
    </TouchableOpacity>
  );
};
