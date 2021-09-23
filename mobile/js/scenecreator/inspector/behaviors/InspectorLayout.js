import * as React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { EditLayout } from '../instance/InstanceLayout';
import { InspectorNumberInput } from '../components/InspectorNumberInput';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { useCoreState, sendBehaviorAction } from '../../../core/CoreEvents';

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 16,
    paddingRight: 0,
  },
  label: {
    fontWeight: 'bold',
    paddingBottom: 16,
    fontSize: 16,
  },
  row: {
    paddingRight: 16,
    marginBottom: 16,
  },
  inputContainer: {
    width: '50%',
    paddingRight: 16,
    paddingBottom: 16,
  },
  inputLabel: {
    paddingBottom: 4,
    fontSize: 16,
  },
});

const LayoutInput = ({
  behavior,
  component,
  propName,
  label,
  sendAction,
  type = 'number',
  ...props
}) => {
  const [lastNativeUpdate, setLastNativeUpdate] = React.useState(0);
  const [value, sendValue] = useOptimisticBehaviorValue({
    component,
    propName,
    sendAction,
    onNativeUpdate: () => setLastNativeUpdate(lastNativeUpdate + 1),
  });

  const onChange = React.useCallback(
    (value) => {
      sendValue('set', value);
    },
    [sendValue]
  );

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      {type == 'number' ? (
        <InspectorNumberInput
          value={value}
          lastNativeUpdate={lastNativeUpdate}
          onChange={onChange}
          {...behavior.propertySpecs[propName].attribs}
          {...props}
        />
      ) : (
        <InspectorCheckbox
          value={value}
          onChange={onChange}
          {...behavior.propertySpecs[propName].attribs}
          {...props}
        />
      )}
    </View>
  );
};

export default InspectorLayout = ({ body }) => {
  const component = useCoreState('EDITOR_SELECTED_COMPONENT:Body');
  const sendAction = React.useCallback((...args) => sendBehaviorAction('Body', ...args), [
    sendBehaviorAction,
  ]);

  const [visible, setVisibleAction] = useOptimisticBehaviorValue({
    component,
    propName: 'visible',
    propType: 'b',
    sendAction: sendAction,
  });
  const onChangeVisible = React.useCallback(
    (visible) => {
      setVisibleAction('set', visible);
    },
    [setVisibleAction]
  );

  const [relative, setRelativeAction] = useOptimisticBehaviorValue({
    component,
    propName: 'relativeToCamera',
    propType: 'b',
    sendAction: sendAction,
  });
  const onChangeRelative = React.useCallback(
    (relative) => {
      setRelativeAction('set', relative);
    },
    [setRelativeAction]
  );

  return (
    <View style={styles.container}>
      <EditLayout isEditingBlueprint />
      <View style={styles.row}>
        <InspectorCheckbox
          value={relative}
          onChange={onChangeRelative}
          label="Relative to camera"
        />
      </View>
      <View style={styles.row}>
        <InspectorCheckbox value={visible} onChange={onChangeVisible} label="Visible" />
      </View>
    </View>
  );
};
