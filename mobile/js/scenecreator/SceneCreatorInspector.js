import React from 'react';
import { StyleSheet, View } from 'react-native';

import * as Constants from '../Constants';
import * as Inspector from './inspector/InspectorComponents';

const styles = StyleSheet.create({});

const GeneralTab = ({ behaviors, isTextActorSelected }) => {
  return (
    <React.Fragment>
      <Inspector.Tags tags={behaviors.Tags} />
      <Inspector.Layout body={behaviors.Body} />
    </React.Fragment>
  );
};

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

  let tabContents;
  switch (selectedTab) {
    case 'rules': {
      // TODO
      tabContents = <View />;
      break;
    }
    case 'movement': {
      // TODO
      tabContents = <View />;
      break;
    }
    case 'general':
    default: {
      tabContents = <GeneralTab behaviors={behaviors} isTextActorSelected={isTextActorSelected} />;
    }
  }

  return tabContents;
};
