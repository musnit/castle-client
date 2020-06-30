import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BehaviorPropertyInputRow } from '../components/BehaviorPropertyInputRow';

import * as Constants from '../../../Constants';
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
    borderColor: Constants.colors.black,
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
    borderColor: Constants.colors.black,
    fontSize: 16,
  },
  segmentedControlItemSelected: {
    backgroundColor: Constants.colors.black,
  },
  segmentedControlLabelSelected: {
    color: Constants.colors.white,
    fontWeight: 'bold',
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
          sendDynamicAction('swap', { name: 'RotatingMotion' });
        } else {
          sendKinematicAction('add');
        }
      },
    },
    {
      name: 'Dynamic',
      label: 'Moved by other forces',
      onSelect: () => {
        if (rotatingMotion.isActive) {
          sendKinematicAction('swap', { name: 'Moving' });
        } else {
          sendDynamicAction('add');
        }
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
  let rotationPropertyName, rotatingPropSendAction, rotationPropertyDisplayValue;
  if (moving.isActive) {
    // dynamic body
    activeBehavior = moving;
    activeBehaviorSendAction = sendActions.Moving;
    rotatingPropSendAction = activeBehaviorSendAction;
    rotationPropertyName = 'angularVelocity';
  } else if (rotatingMotion.isActive) {
    // kinematic body
    activeBehavior = rotatingMotion;

    // need to reconcile units because lua's rotating motion is expressed in full rotations
    // per second, while moving is expressed in degrees
    rotatingPropSendAction = (action, value) => sendActions.RotatingMotion(action, value / 360);
    activeBehaviorSendAction = sendActions.RotatingMotion;
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
          moving={moving}
          rotatingMotion={rotatingMotion}
          sendActions={sendActions}
        />
        {activeBehavior ? (
          <React.Fragment>
            <BehaviorPropertyInputRow
              behavior={activeBehavior}
              propName="vx"
              label="X velocity"
              sendAction={activeBehaviorSendAction}
            />
            <BehaviorPropertyInputRow
              behavior={activeBehavior}
              propName="vy"
              label="Y velocity"
              sendAction={activeBehaviorSendAction}
            />
            <BehaviorPropertyInputRow
              behavior={activeBehavior}
              propName={rotationPropertyName}
              label="Rotational velocity"
              sendAction={rotatingPropSendAction}
              displayValue={rotationPropertyDisplayValue}
            />
          </React.Fragment>
        ) : null}
      </View>
    </View>
  );
};
