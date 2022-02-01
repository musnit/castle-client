import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { InspectorTextInput } from '../inspector/components/InspectorTextInput';
import { useOptimisticBehaviorValue } from '../inspector/InspectorUtilities';
import { useCoreState, sendBehaviorAction } from '../../core/CoreEvents';
import tinycolor from 'tinycolor2';

const styles = StyleSheet.create({
  paddingContainer: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    paddingTop: 32,
    paddingHorizontal: 64,
  },
  outerContainer: {
    flex: 1,
  },
  measureTextContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    //borderWidth: 1,
    //borderColor: 'black',
  },
  textInputContainer: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    alignItems: 'center',
    borderWidth: 0,
  },
  textInput: {
    width: '100%',
    paddingHorizontal: 0,
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

  const [containerWidth, setContainerWidth] = React.useState(800);
  const onContainerLayout = React.useCallback((event) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  }, []);

  const [emWidth, setEmWidth] = React.useState(16);
  const onEmLayout = React.useCallback((event) => {
    const { width } = event.nativeEvent.layout;
    setEmWidth(width);
  }, []);

  const baseFontSize = 16;

  return (
    <View style={styles.paddingContainer}>
      <View style={styles.outerContainer} onLayout={onContainerLayout}>
        <View style={styles.measureTextContainer}>
          <View onLayout={onEmLayout}>
            <Text
              style={{
                fontFamily: postScriptNames[textComponent.props.fontName],
                fontSize: baseFontSize,
                color: 'transparent',
              }}
            >
              m
            </Text>
          </View>
        </View>
        <InspectorTextInput
          style={styles.textInputContainer}
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
              fontSize:
                (1.03 * (baseFontSize * (containerWidth / emWidth))) /
                textComponent.props.emsPerLine,
              textAlign: textComponent.props.alignment,
            },
          ]}
          keyboardType={Platform.OS === 'ios' ? 'ascii-capable' : 'visible-password'}
        />
      </View>
    </View>
  );
};
