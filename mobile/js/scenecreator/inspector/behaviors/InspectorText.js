import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { useCoreState, sendBehaviorAction, sendGlobalAction } from '../../../core/CoreEvents';

import ColorPicker from '../components/ColorPicker';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 16,
  },
  label: {
    fontWeight: 'bold',
    paddingBottom: 16,
    fontSize: 16,
  },
});

export default InspectorText = () => {
  const textComponent = useCoreState('EDITOR_SELECTED_COMPONENT:Text');
  const sendAction = React.useCallback(
    (...args) => sendBehaviorAction('Text', ...args),
    [sendBehaviorAction]
  );

  const [visibleValue, setVisibleValueAndSendAction] = useOptimisticBehaviorValue({
    component: textComponent,
    propName: 'visible',
    propType: 'b',
    sendAction,
  });
  const onChangeVisibleValue = React.useCallback(
    (visible) => {
      setVisibleValueAndSendAction('set', visible);
    },
    [setVisibleValueAndSendAction]
  );
  const selectTextTool = React.useCallback(() => {
    sendGlobalAction('setMode', 'text');
  }, []);

  return (
    <View style={styles.container}>
      <InspectorCheckbox
        value={visibleValue}
        onChange={onChangeVisibleValue}
        label="Visible"
        style={{ marginBottom: 12 }}
      />
      <View style={{ alignItems: 'flex-start' }}>
        <TouchableOpacity style={SceneCreatorConstants.styles.button} onPress={selectTextTool}>
          <Text style={SceneCreatorConstants.styles.buttonLabel}>Edit Text</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
