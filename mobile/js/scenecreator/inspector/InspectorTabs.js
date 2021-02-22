import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AddBehaviorSheet } from './components/AddBehaviorSheet';
import { useCardCreator } from '../CreateCardContext';
import { SaveBlueprintSheet } from './components/SaveBlueprintSheet';

import * as SceneCreatorConstants from '../SceneCreatorConstants';
import * as Constants from '../../Constants';
import * as Inspector from './behaviors/InspectorBehaviors';
import * as InspectorUtilities from './InspectorUtilities';

import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const styles = StyleSheet.create({
  actionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  blueprintContainer: {
    padding: 16,
    alignItems: 'center',
  },
  blueprintTitle: {
    fontWeight: 'bold',
    paddingBottom: 16,
    fontSize: 16,
  },
  drawingTags: {
    flexDirection: 'row',
  },
});

const GeneralTab = ({ behaviors, sendActions, addChildSheet }) => {
  const { inspectorActions, isTextActorSelected } = useCardCreator();
  const isBlueprint = (inspectorActions && inspectorActions.isBlueprint) || false;
  return (
    <React.Fragment>
      {!isBlueprint && (
        <View style={styles.blueprintContainer}>
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
      )}
      {isTextActorSelected && (
        <React.Fragment>
          <Inspector.TextContent text={behaviors.Text} sendAction={sendActions.Text} />
          <Inspector.TextLayout text={behaviors.Text} sendAction={sendActions.Text} />
        </React.Fragment>
      )}
      {!isTextActorSelected && (
        <Inspector.Drawing drawing2={behaviors.Drawing2} sendAction={sendActions.Drawing2} />
      )}
      <Inspector.Tags tags={behaviors.Tags} sendAction={sendActions.Tags} />

      {!isTextActorSelected && (
        <Inspector.Layout
          body={behaviors.Body}
          circleShape={behaviors.CircleShape}
          sendActions={sendActions}
        />
      )}

      {isBlueprint && <Inspector.Sharing />}
    </React.Fragment>
  );
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
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: Constants.colors.grayOnWhiteBorder,
            borderRadius: 4,
            paddingVertical: 10,
            paddingHorizontal: 8,
          }}
          onPress={() =>
            addChildSheet({
              key: 'addBehavior',
              Component: AddBehaviorSheet,
              behaviors,
              addBehavior: (key) => sendActions[key]('add'),
            })
          }>
          <MCIcon
            name="plus"
            size={26}
            color={Constants.colors.grayText}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              fontSize: 16,
              color: Constants.colors.grayText,
              fontWeight: 'normal',
            }}>
            Add physics or controls
          </Text>
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

export const InspectorTabs = ({ selectedTab, addChildSheet }) => {
  const { behaviors, behaviorActions: sendActions } = useCardCreator();

  if (!behaviors) {
    return <View />;
  }

  let tabContents;
  switch (selectedTab) {
    case 'rules': {
      tabContents = (
        <Inspector.Rules
          behaviors={behaviors}
          sendActions={sendActions}
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
        <GeneralTab sendActions={sendActions} behaviors={behaviors} addChildSheet={addChildSheet} />
      );
    }
  }

  return tabContents;
};
