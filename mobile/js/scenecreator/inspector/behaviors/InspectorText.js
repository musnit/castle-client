import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorTextInput } from '../components/InspectorTextInput';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { InspectorDropdown } from '../components/InspectorDropdown';
import { InspectorNumberInput } from '../components/InspectorNumberInput';
import { useCoreState, sendBehaviorAction } from '../../../core/CoreEvents';
import ColorPicker from '../components/ColorPicker';

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
    [setFontNameValueAndSendAction]
  );

  let [fontSizeValue, setFontSizeValueAndSendAction] = useOptimisticBehaviorValue({
    component: textComponent,
    propName: 'fontSize',
    propType: 'n',
    sendAction,
  });
  if (!fontSizeValue) {
    fontSizeValue = 1;
  }
  const onChangeFontSizeValue = React.useCallback(
    (fontSize) => {
      setFontSizeValueAndSendAction('set', fontSize);
    },
    [setFontSizeValueAndSendAction]
  );

  const [alignmentValue, setAlignmentValueAndSendAction] = useOptimisticBehaviorValue({
    component: textComponent,
    propName: 'alignment',
    propType: 'string',
    sendAction,
  });
  const onChangeAlignmentValue = React.useCallback(
    (alignment) => {
      setAlignmentValueAndSendAction('set', alignment);
    },
    [setAlignmentValueAndSendAction]
  );

  let [colorValue, setColorValueAndSendAction] = useOptimisticBehaviorValue({
    component: textComponent,
    propName: 'color',
    propType: 'color',
    sendAction,
  });
  if (!colorValue) {
    colorValue = { r: 0x24 / 255.0, g: 0x22 / 255.0, b: 0x34 / 255.0, a: 1 };
  }
  const onChangeColorValue = React.useCallback(
    (color) => {
      setColorValueAndSendAction('set', color);
    },
    [setColorValueAndSendAction]
  );

  return (
    <View style={styles.container}>
      <InspectorCheckbox
        value={visibleValue}
        onChange={onChangeVisibleValue}
        label="Visible"
        style={{ marginBottom: 12 }}
      />
      <Text style={styles.label}>Font name</Text>
      <InspectorDropdown
        value={fontNameValue}
        onChange={onChangeFontNameValue}
        label="Font name"
        allowedValues={[
          'BreiteGrotesk',
          'Compagnon',
          'Glacier',
          'HelicoCentrica',
          'Piazzolla',
          'SpaceGrotesk-Medium',
          'SpaceGrotesk-Regular',
          'YatraOne',
          "Bore",
          "Synco",
          "Tektur",
        ]}
        style={{ marginBottom: 12 }}
      />
      <Text style={styles.label}>Font size</Text>
      <InspectorNumberInput
        min={1}
        max={30}
        step={1}
        value={fontSizeValue}
        onChange={onChangeFontSizeValue}
        style={{ marginBottom: 12 }}
      />
      <Text style={styles.label}>Alignment</Text>
      <InspectorDropdown
        value={alignmentValue}
        onChange={onChangeAlignmentValue}
        label="Alignment"
        allowedValues={['left', 'right', 'center', 'justify']}
        style={{ marginBottom: 12 }}
      />
      <Text style={styles.label}>Color</Text>
      <View style={{ marginBottom: 12 }}>
        <ColorPicker value={colorValue} setValue={onChangeColorValue} />
      </View>
    </View>
  );
};
