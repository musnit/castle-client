import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorNumberInput } from '../components/InspectorNumberInput';

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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  inputLabel: {},
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
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
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
  segmentedControlLabel: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  segmentedControlLabelText: {
    fontSize: 12,
    marginHorizontal: 8,
    textAlign: 'center',
    color: '#666',
  },
  segmentedControlLabelTextSelected: {
    color: '#000',
  },
});

// TODO: probably abstract this input row container into a reusable component
const RowInput = ({ behavior, propName, label, sendAction }) => {
  const [value, sendValue] = useOptimisticBehaviorValue({
    behavior,
    propName,
    sendAction,
  });

  const onChange = React.useCallback(
    (value) => {
      if (behavior.isActive) {
        sendValue(`set:${propName}`, value);
      }
    },
    [behavior.isActive, sendValue]
  );

  return (
    <View style={styles.inputContainer}>
      <View style={{ width: '50%' }}>
        <Text style={styles.inputLabel}>{label}</Text>
      </View>
      <View style={{ width: '50%' }}>
        <InspectorNumberInput
          value={value}
          onChange={onChange}
          {...behavior.propertySpecs[propName].props}
        />
      </View>
    </View>
  );
};

const BodyTypeControl = ({ moving, sendAction }) => {
  const items = [
    {
      name: 'None',
      label: 'Does not move',
      onSelect: () => sendAction('remove'),
    },
    {
      name: 'Dynamic',
      label: 'Moved by other forces',
      onSelect: () => sendAction('add'),
    },
  ];

  const selectedItemIndex = moving.isActive ? 1 : 0;
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
          <View key={`label-${ii}`} style={styles.segmentedControlLabel}>
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

export default InspectorMotion = ({ moving, sendAction }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Motion</Text>
      <BodyTypeControl moving={moving} sendAction={sendAction} />
      {moving.isActive ? (
        <View style={styles.properties}>
          <RowInput behavior={moving} propName="vx" label="X Velocity" sendAction={sendAction} />
          <RowInput behavior={moving} propName="vy" label="Y Velocity" sendAction={sendAction} />
        </View>
      ) : null}
    </View>
  );
};
