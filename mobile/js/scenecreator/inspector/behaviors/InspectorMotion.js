import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BehaviorPropertyInputRow } from '../components/BehaviorPropertyInputRow';

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 16,
  },
  label: {
    fontWeight: 'bold',
    paddingBottom: 16,
  },
  properties: {},
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 3,
    borderColor: '#000',
    borderWidth: 1,
    borderBottomWidth: 2,
    marginBottom: 16,
  },
  segmentedControlLabels: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  segmentedControlItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderColor: '#000',
  },
  segmentedControlItemSelected: {
    backgroundColor: '#000',
  },
  segmentedControlLabel: {
    color: '#000',
  },
  segmentedControlLabelSelected: {
    color: '#fff',
  },
  segmentedControlLabel: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
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
                styles.segmentedControlLabel,
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
    <View style={styles.container}>
      <Text style={styles.label}>Motion</Text>
      <BodyTypeControl moving={moving} rotatingMotion={rotatingMotion} sendActions={sendActions} />
      {activeBehavior ? (
        <View style={styles.properties}>
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
        </View>
      ) : null}
    </View>
  );
};
