import React from 'react';
import { StyleSheet, View } from 'react-native';

import * as Constants from '../Constants';

const styles = StyleSheet.create({});

export const SceneCreatorInspector = ({ element, isTextActorSelected, selectedTab }) => {
  let behaviors = {};
  if (element.children.count) {
    Object.entries(element.children).forEach(([_, child]) => {
      if (child.type === 'data') {
        const data = child.props.data;
        behaviors[data.name] = data;
      }
    });
  }

  return <View></View>;
};
