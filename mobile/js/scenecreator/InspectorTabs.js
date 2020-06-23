import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { sendDataPaneAction } from '../Tools';

import AddBehaviorSheet from './AddBehaviorSheet';

import * as Constants from '../Constants';
import * as Inspector from './inspector/behaviors/InspectorBehaviors';

const styles = StyleSheet.create({
  actionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  addButton: {
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    borderRadius: 3,
    padding: 8,
  },
  addLabel: {
    fontWeight: 'bold',
  },
});

const GeneralTab = ({ behaviors, sendActions, isTextActorSelected }) => {
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

const MovementTab = ({ behaviors, sendActions, addChildSheet }) => {
  // TODO: better representation of body/moving dependencies
  let movementBehaviors;
  if (behaviors.Moving.isActive) {
    movementBehaviors = [
      'Solid',
      'Bouncy',
      'Friction',
      'Falling',
      'SpeedLimit',
      'Slowdown',
      'Drag',
      'Sling',
    ];
  } else if (behaviors.RotatingMotion.isActive) {
    movementBehaviors = ['Solid', 'Bouncy'];
  }

  return (
    <React.Fragment>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            addChildSheet({
              key: 'addBehavior',
              Component: AddBehaviorSheet,
              behaviors,
              addBehavior: (key) => sendActions[key]('add'),
            })
          }>
          <Text style={styles.addLabel}>Add a behavior</Text>
        </TouchableOpacity>
      </View>
      <Inspector.Motion
        moving={behaviors.Moving}
        rotatingMotion={behaviors.RotatingMotion}
        sendActions={sendActions}
      />
      {movementBehaviors &&
        movementBehaviors
          .filter((name) => behaviors[name]?.isActive)
          .map((name) => (
            <Inspector.Behavior
              key={`behavior-${name}`}
              behavior={behaviors[name]}
              sendAction={sendActions[name]}
            />
          ))}
      {behaviors.Sliding.isActive ? (
        <Inspector.Sliding sliding={behaviors.Sliding} sendActions={sendActions} />
      ) : null}
    </React.Fragment>
  );
};

export const InspectorTabs = ({ element, isTextActorSelected, selectedTab, addChildSheet }) => {
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

  if (!behaviors) {
    return <View />;
  }

  let tabContents;
  switch (selectedTab) {
    case 'rules': {
      tabContents = <InspectorRules rules={behaviors.Rules} sendAction={sendActions.Rules} />;
      break;
    }
    case 'movement': {
      tabContents = (
        <MovementTab
          sendActions={sendActions}
          behaviors={behaviors}
          addChildSheet={addChildSheet}
        />
      );
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
