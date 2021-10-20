import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AddBehaviorSheet } from './components/AddBehaviorSheet';
import { useCardCreator } from '../CreateCardContext';
import { useCoreState, sendBehaviorAction } from '../../core/CoreEvents';

import * as SceneCreatorConstants from '../SceneCreatorConstants';
import * as Constants from '../../Constants';
import * as Inspector from './behaviors/InspectorBehaviors';
import * as InspectorUtilities from './InspectorUtilities';

import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Metadata from '../Metadata';

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

const GeneralTab = ({ behaviors, addChildSheet, isTextActorSelected }) => {
  return (
    <React.Fragment>
      {isTextActorSelected && (
        <React.Fragment>
          <Inspector.TextContent />
          <Inspector.TextLayout />
        </React.Fragment>
      )}
      {!isTextActorSelected && <Inspector.Drawing drawing2={behaviors.Drawing2} />}
      <Inspector.Tags tags={behaviors.Tags} />

      {!isTextActorSelected && <Inspector.Layout body={behaviors.Body} />}
    </React.Fragment>
  );
};

const MovementTab = ({ behaviors, addChildSheet }) => {
  const selectedActorData = useCoreState('EDITOR_SELECTED_ACTOR');
  let movementBehaviors = InspectorUtilities.filterAvailableBehaviors({
    allBehaviors: behaviors,
    selectedActorData,
    possibleBehaviors: Metadata.addMotionBehaviors.reduce(
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
              addBehavior: (behavior) => sendBehaviorAction(behavior, 'add'),
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
        selectedActorData={selectedActorData}
      />
      {movementBehaviors &&
        movementBehaviors
          .filter((name) => selectedActorData.behaviors[name]?.isActive)
          .map((name) => {
            let Component = Inspector[name] ?? Inspector.Behavior;
            return <Component key={`behavior-${name}`} behavior={behaviors[name]} />;
          })}
    </React.Fragment>
  );
};

export const InspectorTabs = ({ selectedTab, addChildSheet }) => {
  const behaviors = useCoreState('EDITOR_ALL_BEHAVIORS');
  const { isTextActorSelected, isBlueprintSelected } = useCardCreator();

  if (!behaviors || !isBlueprintSelected) {
    return <View />;
  }

  let tabContents;
  switch (selectedTab) {
    case 'rules': {
      tabContents = <Inspector.Rules behaviors={behaviors} addChildSheet={addChildSheet} />;
      break;
    }
    case 'movement': {
      tabContents = <MovementTab behaviors={behaviors} addChildSheet={addChildSheet} />;
      break;
    }
    case 'general':
    default: {
      tabContents = (
        <GeneralTab
          behaviors={behaviors}
          addChildSheet={addChildSheet}
          isTextActorSelected={isTextActorSelected}
        />
      );
    }
  }

  return tabContents;
};
