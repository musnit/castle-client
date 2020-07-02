import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { sendDataPaneAction } from '../Tools';

const LEGACY_RULES_UI = false;

import AddBehaviorSheet from './AddBehaviorSheet';
import InspectorLegacyRules from './inspector/behaviors/InspectorLegacyRules';
import SaveBlueprintSheet from './SaveBlueprintSheet';

import * as SceneCreatorConstants from './SceneCreatorConstants';
import * as Inspector from './inspector/behaviors/InspectorBehaviors';
import * as InspectorUtilities from './inspector/InspectorUtilities';

const styles = StyleSheet.create({
  actionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  blueprintContainer: {
    padding: 16,
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  blueprintTitle: {
    fontWeight: 'bold',
    paddingBottom: 16,
    fontSize: 16,
  },
});

const GeneralTab = ({ behaviors, sendActions, isTextActorSelected, addChildSheet }) => {
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
        <Inspector.Tags tags={behaviors.Tags} sendAction={sendActions.Tags} />
        <Inspector.Layout
          body={behaviors.Body}
          circleShape={behaviors.CircleShape}
          sendActions={sendActions}
        />
        <Inspector.Drawing
          drawing={behaviors.Drawing}
          drawing2={behaviors.Drawing2}
          sendAction={sendActions.Drawing}
        />
        <Inspector.Image image={behaviors.Image} sendAction={sendActions.Image} />
        <View style={styles.blueprintContainer}>
          <Text style={styles.blueprintTitle}>Blueprint</Text>
          <TouchableOpacity
            style={SceneCreatorConstants.styles.button}
            onPress={() =>
              addChildSheet({
                key: 'saveBlueprint',
                Component: SaveBlueprintSheet,
              })
            }>
            <Text style={SceneCreatorConstants.styles.buttonLabel}>Save blueprint</Text>
          </TouchableOpacity>
        </View>
      </React.Fragment>
    );
  }
};

const MovementTab = ({ behaviors, sendActions, addChildSheet }) => {
  let movementBehaviors = InspectorUtilities.filterAvailableBehaviors({
    allBehaviors: behaviors,
    possibleBehaviors: Inspector.MotionBehaviors.reduce(
      (behaviors, group) => behaviors.concat(group.behaviors),
      []
    ),
  });

  return (
    <React.Fragment>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={SceneCreatorConstants.styles.button}
          onPress={() =>
            addChildSheet({
              key: 'addBehavior',
              Component: AddBehaviorSheet,
              behaviors,
              addBehavior: (key) => sendActions[key]('add'),
            })
          }>
          <Text style={SceneCreatorConstants.styles.buttonLabel}>Add a behavior</Text>
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
          .map((name) => {
            let Component = Inspector[name] ?? Inspector.Behavior;
            return (
              <Component
                key={`behavior-${name}`}
                behavior={behaviors[name]}
                sendAction={sendActions[name]}
              />
            );
          })}
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
      tabContents = LEGACY_RULES_UI ? (
        <InspectorLegacyRules
          rules={behaviors.Rules}
          counter={behaviors.Counter}
          sendActions={sendActions}
          addChildSheet={addChildSheet}
        />
      ) : (
        <Inspector.Rules
          behaviors={behaviors}
          sendAction={sendActions.Rules}
          addChildSheet={addChildSheet}
        />
      );
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
          addChildSheet={addChildSheet}
        />
      );
    }
  }

  return tabContents;
};
