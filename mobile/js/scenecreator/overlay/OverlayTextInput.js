import React from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { useOptimisticBehaviorValue } from '../inspector/InspectorUtilities';
import { useCoreState, sendBehaviorAction } from '../../core/CoreEvents';
import tinycolor from 'tinycolor2';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    height: '100%',
    paddingTop: 32,
    alignItems: 'center',
  },
  textInput: {
    width: '100%',
    paddingHorizontal: 64,
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
  const [textContentValue, setContentValueAndSendAction] = useOptimisticBehaviorValue({
    component: textComponent,
    propName: 'content',
    propType: 'string',
    sendAction,
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
    <View style={styles.container}>
      <TextInput
        value={textContentValue}
        onChangeText={onChangeTextContentValue}
        placeholder="Once upon a time..."
        multiline
        autoFocus
        style={[
          styles.textInput,
          {
            color: hexColor,
            fontFamily: postScriptNames[textComponent.props.fontName],
            fontSize: adjustedFontSize,
            textAlign: textComponent.props.alignment,
          },
        ]}
      />
    </View>
  );
};
