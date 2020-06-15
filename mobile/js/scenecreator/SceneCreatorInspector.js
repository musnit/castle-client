import React from 'react';
import { StyleSheet, View } from 'react-native';

import { sendDataPaneAction } from '../Tools';

import * as Constants from '../Constants';
import * as Inspector from './inspector/InspectorComponents';

const styles = StyleSheet.create({});

const GeneralTab = ({ behaviors, sendActions, isTextActorSelected }) => {
  if (!behaviors) {
    return <View />;
  }
  return (
    <React.Fragment>
      <Inspector.Tags tags={behaviors.Tags} sendAction={sendActions.Tags} />
      <Inspector.Layout body={behaviors.Body} sendAction={sendActions.Body} />
    </React.Fragment>
  );
};

export const SceneCreatorInspector = ({ element, isTextActorSelected, selectedTab }) => {
  let behaviors, sendActions;
  if (element.children.count) {
    behaviors = {};
    sendActions = {};
    Object.entries(element.children).forEach(([key, child]) => {
      if (child.type === 'data') {
        const data = child.props.data;
        behaviors[data.name] = data;
        behaviors[data.name].lastReportedEventId = child.lastReportedEventId;
        sendActions[data.name] = (action, value) => sendDataPaneAction(element, action, value, key);
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
      tabContents = (
        <GeneralTab
          sendActions={sendActions}
          behaviors={behaviors}
          isTextActorSelected={isTextActorSelected}
        />
      );
    }
  }

  return tabContents;
};
