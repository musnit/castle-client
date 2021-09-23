import * as React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorNumberInput } from '../components/InspectorNumberInput';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { SaveBlueprintButton } from '../components/SaveBlueprintButton';
import { useCardCreator } from '../../CreateCardContext';
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
  properties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  applyLayoutChangesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 16,
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

// by default, this component intends to edit a single instance, so exposes Position
// but if `isEditingBlueprint` is true, we hide Position and only expose blueprint-specific
// props.
export const EditLayout = ({ isEditingBlueprint }) => {
  const { hasSelection } = useCardCreator();
  const behaviors = useCoreState('EDITOR_ALL_BEHAVIORS');
  const { Body: body } = behaviors || {};
  const component = useCoreState('EDITOR_SELECTED_COMPONENT:Body');
  const sendAction = React.useCallback((...args) => sendBehaviorAction('Body', ...args), [
    sendBehaviorAction,
  ]);
  if (!hasSelection || !body || !component) return null;
  return (
    <View style={styles.properties}>
      <React.Fragment>
        <LayoutInput
          behavior={body}
          component={component}
          propName="widthScale"
          label="Width Scale"
          sendAction={sendAction}
          decimalDigits={2}
          step={0.25}
        />
        <LayoutInput
          behavior={body}
          component={component}
          propName="heightScale"
          label="Height Scale"
          sendAction={sendAction}
          decimalDigits={2}
          step={0.25}
        />
      </React.Fragment>
      {!isEditingBlueprint ? (
        <>
          <LayoutInput
            behavior={body}
            component={component}
            propName="x"
            label="X Position"
            sendAction={sendAction}
          />
          <LayoutInput
            behavior={body}
            component={component}
            propName="y"
            label="Y Position"
            sendAction={sendAction}
          />
        </>
      ) : null}
      <LayoutInput
        behavior={body}
        component={component}
        propName="angle"
        label="Rotation"
        sendAction={sendAction}
      />
    </View>
  );
};

export const InstanceLayout = () => {
  // TODO: inspectorActions data
  const inspectorActions = { hasBlueprint: true };
  const hasBlueprint = (inspectorActions && inspectorActions.hasBlueprint) || false;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Layout</Text>
      <EditLayout isEditingBlueprint={false} />
      {hasBlueprint && (
        <View style={styles.applyLayoutChangesContainer}>
          <SaveBlueprintButton label="Apply layout changes to blueprint" />
        </View>
      )}
    </View>
  );
};
