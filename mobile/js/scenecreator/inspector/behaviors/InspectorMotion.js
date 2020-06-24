import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BehaviorPropertyInputRow } from '../components/BehaviorPropertyInputRow';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    paddingBottom: 16,
  },
  properties: {},
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 4,
    borderColor: '#000',
    borderWidth: 1,
    borderBottomWidth: 2,
    marginBottom: 8,
  },
  segmentedControlLabels: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  segmentedControlItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderColor: '#000',
    fontSize: 16,
  },
  segmentedControlItemSelected: {
    backgroundColor: '#000',
  },
  segmentedControlLabelSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  segmentedControlLabel: { alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 8 },
  segmentedControlLabelText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  segmentedControlLabelTextSelected: {
    color: '#000',
  },
});

const BodyTypeControl = ({ moving, rotatingMotion, sendActions }) => {
  const sendDynamicAction = sendActions.Moving;
  const sendKinematicAction = sendActions.RotatingMotion;
  const items = [
    {
      name: 'None',
      label: 'Does not move',
      onSelect: () => {
        if (moving.isActive) {
          sendDynamicAction('remove');
        } else if (rotatingMotion.isActive) {
          sendKinematicAction('remove');
        }
      },
    },
    {
      name: 'Fixed',
      label: 'Moves at a constant rate',
      onSelect: () => {
        if (moving.isActive) {
          sendDynamicAction('remove');
        }
        sendKinematicAction('add');
      },
    },
    {
      name: 'Dynamic',
      label: 'Moved by other forces',
      onSelect: () => {
        if (rotatingMotion.isActive) {
          sendKinematicAction('remove');
        }
        sendDynamicAction('add');
      },
    },
  ];

  const selectedItemIndex = moving.isActive ? 2 : rotatingMotion.isActive ? 1 : 0;
  const onChange = (index) => {
    if (index !== selectedItemIndex) {
      items[index].onSelect();
    }
  };

  return (
    <React.Fragment>
      <View style={styles.segmentedControl}>
        {items.map((item, ii) => (
          <TouchableOpacity
            key={`item-${ii}`}
            onPress={() => onChange(ii)}
            style={[
              styles.segmentedControlItem,
              ii === selectedItemIndex ? styles.segmentedControlItemSelected : null,
              { width: `${(1 / items.length) * 100}%` },
              ii > 0 ? { borderLeftWidth: 1 } : null,
            ]}>
            <Text
              style={[
                styles.segmentedControlItem,
                ii === selectedItemIndex ? styles.segmentedControlLabelSelected : null,
              ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
    </React.Fragment>
  );
};

export default InspectorMotion = ({ moving, rotatingMotion, sendActions }) => {
  let activeBehavior, activeBehaviorSendAction;
  let rotationPropertyName, rotationPropertyDisplayValue;
  if (moving.isActive) {
    // dynamic body
    activeBehavior = moving;
    activeBehaviorSendAction = sendActions.Moving;
    rotationPropertyName = 'angularVelocity';
  } else if (rotatingMotion.isActive) {
    // kinematic body
    activeBehavior = rotatingMotion;

    // need to reconcile units because lua's rotating motion is expressed in full rotations
    // per second, while moving is expressed in degrees
    activeBehaviorSendAction = (action, value) => sendActions.RotatingMotion(action, value / 360);
    rotationPropertyName = 'rotationsPerSecond';
    rotationPropertyDisplayValue = (value) => value * 360;
  }
  return (
    <View style={SceneCreatorConstants.styles.behaviorContainer}>
      <Text style={SceneCreatorConstants.styles.behaviorHeader}>
        <Text style={SceneCreatorConstants.styles.behaviorHeaderName}>Motion</Text>
      </Text>
      <View style={SceneCreatorConstants.styles.behaviorProperties}>
        <BodyTypeControl moving={moving} rotatingMotion={rotatingMotion} sendActions={sendActions} />
        {activeBehavior ? (
          <React.Fragment>
            <BehaviorPropertyInputRow
              behavior={activeBehavior}
              propName="vx"
              label="X Velocity"
              sendAction={activeBehaviorSendAction}
            />
            <BehaviorPropertyInputRow
              behavior={activeBehavior}
              propName="vy"
              label="Y Velocity"
              sendAction={activeBehaviorSendAction}
            />
            <BehaviorPropertyInputRow
              behavior={activeBehavior}
              propName={rotationPropertyName}
              label="Rotational velocity"
              sendAction={activeBehaviorSendAction}
              displayValue={rotationPropertyDisplayValue}
            />
          </React.Fragment>
        ) : null}
      </View>
    </View>
  );
};
