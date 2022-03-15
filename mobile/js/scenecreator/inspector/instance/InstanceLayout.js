import * as React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorNumberInput } from '../components/InspectorNumberInput';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { SaveBlueprintButton } from '../components/SaveBlueprintButton';
import { useCardCreator } from '../../CreateCardContext';
import { useCoreState, sendBehaviorAction } from '../../../core/CoreEvents';

const styles = StyleSheet.create({
  container: {
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
  textContentInput: {
    marginBottom: 12 + 16,
    marginRight: 16,
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
  const bodyComponent = useCoreState('EDITOR_SELECTED_COMPONENT:Body');
  const bodySendAction = React.useCallback(
    (...args) => sendBehaviorAction('Body', ...args),
    [sendBehaviorAction]
  );

  if (!hasSelection || !body || !bodyComponent) return null;
  return (
    <View>
      <View style={styles.properties}>
        <React.Fragment>
          <LayoutInput
            behavior={body}
            component={bodyComponent}
            propName="widthScale"
            label="Width Scale"
            sendAction={bodySendAction}
            decimalDigits={2}
            step={0.25}
          />
          <LayoutInput
            behavior={body}
            component={bodyComponent}
            propName="heightScale"
            label="Height Scale"
            sendAction={bodySendAction}
            decimalDigits={2}
            step={0.25}
          />
        </React.Fragment>
        {!isEditingBlueprint ? (
          <>
            <LayoutInput
              behavior={body}
              component={bodyComponent}
              propName="x"
              label="X Position"
              sendAction={bodySendAction}
            />
            <LayoutInput
              behavior={body}
              component={bodyComponent}
              propName="y"
              label="Y Position"
              sendAction={bodySendAction}
            />
          </>
        ) : null}
        <LayoutInput
          behavior={body}
          component={bodyComponent}
          propName="angle"
          label="Rotation"
          sendAction={bodySendAction}
        />
      </View>
      {isEditingBlueprint ? (
        <View style={styles.applyLayoutChangesContainer}>
          <SaveBlueprintButton label="Apply layout changes to blueprint" />
        </View>
      ) : null}
    </View>
  );
};

export const InstanceLayout = () => {
  return (
    <View style={styles.container}>
      <EditLayout isEditingBlueprint={false} />
    </View>
  );
};
