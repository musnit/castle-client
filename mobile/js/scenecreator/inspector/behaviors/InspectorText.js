import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorTextInput } from '../components/InspectorTextInput';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { InspectorDropdown } from '../components/InspectorDropdown';
import { useCoreState, sendBehaviorAction } from '../../../core/CoreEvents';

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

  const [contentValue, setContentValueAndSendAction] = useOptimisticBehaviorValue({
    component: textComponent,
    propName: 'content',
    propType: 'string',
    sendAction,
  });
  const onChangeContentValue = React.useCallback(
    (content) => {
      setContentValueAndSendAction('set', content);
    },
    [setContentValueAndSendAction]
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

  const [fontNameValue, setFontNameValueAndSendAction] = useOptimisticBehaviorValue({
    component: textComponent,
    propName: 'fontName',
    propType: 'string',
    sendAction,
  });
  const onChangeFontNameValue = React.useCallback(
    (fontName) => {
      setFontNameValueAndSendAction('set', fontName);
    },
    [setVisibleValueAndSendAction]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Text</Text>
      <InspectorTextInput
        value={contentValue}
        onChangeText={onChangeContentValue}
        placeholder="Once upon a time..."
        style={{ marginBottom: 12 }}
        multiline
      />
      <InspectorCheckbox
        value={visibleValue}
        onChange={onChangeVisibleValue}
        label="Visible"
        style={{ marginBottom: 12 }}
      />
      <InspectorDropdown
        value={fontNameValue}
        onChange={onChangeFontNameValue}
        label="Font name"
        allowedValues={['Comic Sans', 'Roboto']}
        style={{ marginBottom: 12 }}
      />
    </View>
  );
};
