import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BehaviorPropertyInputRow } from '../components/BehaviorPropertyInputRow';
import { InspectorSegmentedControl } from '../components/InspectorSegmentedControl';
import { useCoreState, sendBehaviorAction } from '../../../core/CoreEvents';

import * as Constants from '../../../Constants';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    paddingBottom: 16,
  },
  properties: {},
  segmentedControlLabels: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  segmentedControlLabel: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
  },
  segmentedControlLabelText: {
    fontSize: 12,
    textAlign: 'center',
    color: Constants.colors.grayText,
  },
  segmentedControlLabelTextSelected: {
    color: Constants.colors.black,
  },
});

const BodyTypeControl = ({ isMovingActive, isRotatingMotionActive }) => {
  const sendDynamicAction = React.useCallback(
    (...args) => sendBehaviorAction('Moving', ...args),
    [sendBehaviorAction]
  );
  const sendFixedAction = React.useCallback(
    (...args) => sendBehaviorAction('RotatingMotion', ...args),
    [sendBehaviorAction]
  );

  const items = [
    {
      name: 'None',
      label: 'Does not move',
      onSelect: () => {
        if (isMovingActive) {
          sendDynamicAction('remove');
        } else if (isRotatingMotionActive) {
          sendFixedAction('remove');
        }
      },
    },
    {
      name: 'Fixed',
      label: 'Moves at a constant rate',
      onSelect: () => {
        if (isMovingActive) {
          sendDynamicAction('swapMotion');
        } else {
          sendFixedAction('add');
        }
      },
    },
    {
      name: 'Dynamic',
      label: 'Moved by other forces',
      onSelect: () => {
        if (isRotatingMotionActive) {
          sendFixedAction('swapMotion');
        } else {
          sendDynamicAction('add');
        }
      },
    },
  ];

  const selectedItemIndex = isMovingActive ? 2 : isRotatingMotionActive ? 1 : 0;
  const onChange = React.useCallback(
    (index) => {
      if (index !== selectedItemIndex) {
        items[index].onSelect();
      }
    },
    [items, selectedItemIndex]
  );

  return (
    <>
      <InspectorSegmentedControl
        items={items}
        onChange={onChange}
        selectedItemIndex={selectedItemIndex}
      />
      <View style={styles.segmentedControlLabels}>
        {items.map((item, ii) => (
          <View
            key={`label-${ii}`}
            style={[styles.segmentedControlLabel, { width: `${(1 / items.length) * 100}%` }]}>
            <Text
              style={[
                styles.segmentedControlLabelText,
                ii == selectedItemIndex ? styles.segmentedControlLabelTextSelected : null,
              ]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
};

export default InspectorMotion = ({ moving, rotatingMotion, selectedActorData }) => {
  let activeBehavior, activeBehaviorSendAction, activeComponent;
  const movingComponent = useCoreState('EDITOR_SELECTED_COMPONENT:Moving');
  const rotatingMotionComponent = useCoreState('EDITOR_SELECTED_COMPONENT:RotatingMotion');
  const isMovingActive = selectedActorData.behaviors.Moving?.isActive;
  const isRotatingMotionActive = selectedActorData.behaviors.RotatingMotion?.isActive;

  let rotationPropertyName, rotatingPropSendAction, rotationPropertyDisplayValue;
  if (isMovingActive) {
    // dynamic body
    activeBehavior = moving;
    activeComponent = movingComponent;
    activeBehaviorSendAction = (...args) => sendBehaviorAction('Moving', ...args);
    rotatingPropSendAction = activeBehaviorSendAction;
    rotationPropertyName = 'angularVelocity';
  } else if (isRotatingMotionActive) {
    // kinematic body
    activeBehavior = rotatingMotion;
    activeComponent = rotatingMotionComponent;

    // need to reconcile units because engine's rotating motion is expressed in full rotations
    // per second, while moving is expressed in degrees
    rotatingPropSendAction = (action, property, type, value) =>
      sendBehaviorAction('RotatingMotion', action, property, type, value / 360);
    activeBehaviorSendAction = (...args) => sendBehaviorAction('RotatingMotion', ...args);
    rotationPropertyName = 'rotationsPerSecond';
    rotationPropertyDisplayValue = (value) => value * 360;
  }

  return (
    <View style={SceneCreatorConstants.styles.behaviorContainer}>
      <Text style={SceneCreatorConstants.styles.behaviorHeader}>
        <Text style={SceneCreatorConstants.styles.behaviorHeaderName}>Motion</Text>
      </Text>
      <View style={SceneCreatorConstants.styles.behaviorProperties}>
        <BodyTypeControl
          isMovingActive={isMovingActive}
          isRotatingMotionActive={isRotatingMotionActive}
        />
        {activeBehavior && activeComponent ? (
          <React.Fragment>
            <BehaviorPropertyInputRow
              behavior={activeBehavior}
              component={activeComponent}
              propName="vx"
              label="X velocity"
              sendAction={activeBehaviorSendAction}
            />
            <BehaviorPropertyInputRow
              behavior={activeBehavior}
              component={activeComponent}
              propName="vy"
              label="Y velocity"
              sendAction={activeBehaviorSendAction}
            />
            <BehaviorPropertyInputRow
              behavior={activeBehavior}
              component={activeComponent}
              propName={rotationPropertyName}
              label="Rotational velocity"
              sendAction={rotatingPropSendAction}
              displayValue={rotationPropertyDisplayValue}
            />
            {activeBehavior == moving ? (
              <BehaviorPropertyInputRow
                behavior={activeBehavior}
                component={activeComponent}
                propName="density"
                label="Density"
                step={0.1}
                sendAction={activeBehaviorSendAction}
              />
            ) : null}
          </React.Fragment>
        ) : null}
      </View>
    </View>
  );
};
