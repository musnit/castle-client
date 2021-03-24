import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { sendDataPaneAction, useGhostUI } from '../../../ghost/GhostUI';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

export const SaveBlueprintButton = ({ label = 'Save blueprint' }) => {
  let data, sendAction;

  const { root } = useGhostUI();
  const element = root?.panes ? root.panes['sceneCreatorBlueprints'] : null;
  if (element?.children.count) {
    Object.entries(element.children).forEach(([key, child]) => {
      if (child.type === 'data') {
        data = child.props.data;
        data.lastReportedEventId = child.lastReportedEventId;
        sendAction = (action, value) => sendDataPaneAction(element, action, value, key);
      }
    });
  }

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
