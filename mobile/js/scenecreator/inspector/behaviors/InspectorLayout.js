import * as React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorNumberInput } from '../components/InspectorNumberInput';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';
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

const LayoutInput = ({ behavior, component, propName, label, sendAction, type = 'number' }) => {
  const [lastNativeUpdate, setLastNativeUpdate] = React.useState(0);
  const [value, sendValue] = useOptimisticBehaviorValue({
    behavior: component,
    propName,
    sendAction,
    onNativeUpdate: () => setLastNativeUpdate(lastNativeUpdate + 1),
  });

  const onChange = React.useCallback(
    (value) => {
      if (behavior.isActive) {
        sendValue('set', value);
      }
    },
    [behavior.isActive, sendValue]
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
        />
      ) : (
        <InspectorCheckbox
          value={value}
          onChange={onChange}
          {...behavior.propertySpecs[propName].attribs}
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

  const { inspectorActions, isTextActorSelected } = useCardCreator();
  const hasBlueprint = (inspectorActions && inspectorActions.hasBlueprint) || false;

  const [visible, setVisibleAction] = useOptimisticBehaviorValue({
    component,
    propName: 'visible',
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
      <Text style={styles.label}>Layout</Text>
      <View style={styles.properties}>
        <React.Fragment>
          <LayoutInput
            behavior={body}
            component={component}
            propName="widthScale"
            label="Width Scale"
            sendAction={sendAction}
          />
          <LayoutInput
            behavior={body}
            component={component}
            propName="heightScale"
            label="Height Scale"
            sendAction={sendAction}
          />
        </React.Fragment>
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
        <LayoutInput
          behavior={body}
          component={component}
          propName="angle"
          label="Rotation"
          sendAction={sendAction}
        />
      </View>
      {hasBlueprint && (
        <View style={styles.applyLayoutChangesContainer}>
          <SaveBlueprintButton label="Apply layout changes to blueprint" />
        </View>
      )}
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
