import React from 'react';
import { View, StyleSheet } from 'react-native';
import { InspectorTextInput } from '../inspector/components/InspectorTextInput';
import { useOptimisticBehaviorValue } from '../inspector/InspectorUtilities';
import { useCoreState, sendBehaviorAction } from '../../core/CoreEvents';
import tinycolor from 'tinycolor2';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    height: '100%',
    paddingTop: 32,
    alignItems: 'center',
    borderWidth: 0,
  },
  textInput: {
    width: '100%',
    paddingHorizontal: 64,
    paddingVertical: 0,
    borderTopWidth: 0,
  },
});

const postScriptNames = {
  BreiteGrotesk: 'BreiteGrotesk-Regular',
  Compagnon: 'Compagnon-Roman',
  Glacier: 'Glacier-Bold',
  HelicoCentrica: 'HelicoCentrica-Roman',
  Piazzolla: 'Piazzolla-Medium',
  YatraOne: 'YatraOne-Regular',
  Bore: 'Bore-Regular',
  Synco: 'Synco-2020',
  Tektur: 'TekturTight-Regular',
};

export const OverlayTextInput = ({ textComponent, sendAction }) => {
  const [lastNativeValue, setLastNativeValue] = React.useState({});
  const [textContentValue, setContentValueAndSendAction] = useOptimisticBehaviorValue({
    component: textComponent,
    propName: 'content',
    propType: 'string',
    sendAction,
    onNativeUpdate: (value, eventId) => setLastNativeValue({ value, eventId }),
  });
  const onChangeTextContentValue = React.useCallback(
    (content) => {
      setContentValueAndSendAction('set', content);
    },
    [setContentValueAndSendAction]
  );

  const hexColor = tinycolor.fromRatio(textComponent.props.color).toHexString();

  const adjustedFontSize = textComponent.props.fontSize * 7;

  return (
    <InspectorTextInput
      style={styles.container}
      optimistic
      lastNativeValue={lastNativeValue}
      value={textContentValue}
      onChangeText={onChangeTextContentValue}
      placeholder="Once upon a time..."
      multiline
      autoFocus
      inputStyle={[
        styles.textInput,
        {
          color: hexColor,
          fontFamily: postScriptNames[textComponent.props.fontName],
          fontSize: adjustedFontSize,
          textAlign: textComponent.props.alignment,
        },
      ]}
      keyboardType={Platform.OS === 'ios' ? 'ascii-capable' : 'visible-password'}
    />
  );
};
