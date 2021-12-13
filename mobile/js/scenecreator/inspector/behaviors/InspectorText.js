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
    [setFontNameValueAndSendAction]
  );

  const [fontSizeValue, setFontSizeValueAndSendAction] = useOptimisticBehaviorValue({
    component: textComponent,
    propName: 'fontSize',
    propType: 'n',
    sendAction,
  });
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

  const [colorValue, setColorValueAndSendAction] = useOptimisticBehaviorValue({
    component: textComponent,
    propName: 'color',
    propType: 'color',
    sendAction,
  });
  const onChangeColorValue = React.useCallback(
    (color) => {
      setColorValueAndSendAction('set', color);
    },
    [setColorValueAndSendAction]
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
      <Text style={styles.label}>Font name</Text>
      <InspectorDropdown
        value={fontNameValue}
        onChange={onChangeFontNameValue}
        label="Font name"
        allowedValues={[
          'Twemoji',
          'OpenSansEmoji',
          '3270Condensed-Condensed',
          'Abibas-Medium',
          'AstralMono-Regular',
          'Avara-Bold',
          'Avara-BoldItalic',
          'Betatron-Regular',
          'Blocus-Regular',
          'BreiteGrotesk-Regular',
          'Chicagoland-Medium',
          'ComicNeue-Bold',
          'ComicNeueAngular-Bold',
          'Compagnon-Bold',
          'Compagnon-Medium',
          'Compagnon-Roman',
          'DagsenOutline-Black',
          'Glacier-Bold',
          'HappyTimesAtTheIKOB-Regular',
          'HelicoCentrica-Roman',
          'Norm-Medium',
          'Norm-Regular',
          'Outward-Block',
          'Piazzolla-Medium',
          'SnapitMono-Regular',
          'SpaceGrotesk-Regular',
          'StandardGraf-Regular',
          'Syne-Extra',
          'YatraOne-Regular',
          'Zarathustra-Regular',
        ]}
        style={{ marginBottom: 12 }}
      />
      <Text style={styles.label}>Font size</Text>
      <InspectorNumberInput
        min={0.2}
        max={3}
        step={0.2}
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
