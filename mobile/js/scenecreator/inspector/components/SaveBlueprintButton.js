import React from 'react';
import { TouchableOpacity } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { sendAsync } from '../../../core/CoreEvents';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

export const SaveBlueprintButton = ({ label = 'Save blueprint' }) => {
  return (
    <TouchableOpacity
      onPress={() => {
        sendAsync('EDITOR_APPLY_LAYOUT_TO_BLUEPRINT');
      }}
      style={SceneCreatorConstants.styles.button}>
      <Text style={SceneCreatorConstants.styles.buttonLabel}>{label}</Text>
    </TouchableOpacity>
  );
};
