import React from 'react';
import { StyleSheet, View } from 'react-native';

import { sendDataPaneAction } from '../Tools';

import * as Constants from '../Constants';
import * as Inspector from './inspector/behaviors/InspectorBehaviors';

const styles = StyleSheet.create({});

const GeneralTab = ({ behaviors, sendActions, isTextActorSelected }) => {
  if (!behaviors) {
    return <View />;
  }
  if (isTextActorSelected) {
    return (
      <React.Fragment>
        <Inspector.TextContent text={behaviors.Text} sendAction={sendActions.Text} />
        <Inspector.TextLayout text={behaviors.Text} sendAction={sendActions.Text} />
      </React.Fragment>
    );
  } else {
    return (
      <React.Fragment>
        <Inspector.Drawing
          drawing={behaviors.Drawing}
          drawing2={behaviors.Drawing2}
          sendAction={sendActions.Drawing}
        />
        <Inspector.Tags tags={behaviors.Tags} sendAction={sendActions.Tags} />
        <Inspector.Layout
          body={behaviors.Body}
          circleShape={behaviors.CircleShape}
          sendActions={sendActions}
        />
      </React.Fragment>
    );
  }
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
