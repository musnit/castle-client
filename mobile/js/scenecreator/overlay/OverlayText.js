import React from 'react';
import { Platform, KeyboardAvoidingView, Pressable, StyleSheet, View, StatusBar } from 'react-native';
import {
  useCoreState,
  sendAsync,
  sendBehaviorAction,
  sendGlobalAction,
} from '../../core/CoreEvents';
import { useCardCreator } from '../CreateCardContext';
import { useOptimisticBehaviorValue } from '../inspector/InspectorUtilities';
import { OverlayTextInput } from './OverlayTextInput';

import FeatherIcon from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import ColorPicker from '../inspector/components/ColorPicker';

import * as Constants from '../../Constants';
const { CastleIcon } = Constants;
import * as SceneCreatorConstants from '../SceneCreatorConstants';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 1,
  },
  keyboardContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 8,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  toolbar: {
    borderRadius: SceneCreatorConstants.OVERLAY_BORDER_RADIUS,
    backgroundColor: Constants.colors.white,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    flexDirection: 'column',
    alignItems: 'center',
    ...Constants.styles.dropShadow,
    overflow: 'hidden',
    marginBottom: 8,
    width: 38,
  },
  toolrow: {
    borderRadius: SceneCreatorConstants.OVERLAY_BORDER_RADIUS,
    backgroundColor: Constants.colors.white,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    flexDirection: 'row',
    ...Constants.styles.dropShadow,
    overflow: 'hidden',
  },
  singleButton: {
    borderRadius: SceneCreatorConstants.OVERLAY_BORDER_RADIUS,
    backgroundColor: Constants.colors.white,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    ...Constants.styles.dropShadow,
    marginBottom: 8,
  },
  button: {
    width: 38,
    height: 38,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const OverlayText = () => {
  const { isBlueprintSelected } = useCardCreator();

  const textComponent = useCoreState('EDITOR_SELECTED_COMPONENT:Text');
  const sendAction = React.useCallback(
    (...args) => sendBehaviorAction('Text', ...args),
    [sendBehaviorAction]
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
  const increaseFontSize = React.useCallback(() => {
    setFontSizeValueAndSendAction('set', fontSizeValue + 1);
  }, [setFontSizeValueAndSendAction]);
  const decreaseFontSize = React.useCallback(() => {
    setFontSizeValueAndSendAction('set', fontSizeValue - 1);
  }, [setFontSizeValueAndSendAction]);

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

  const alignmentValues = ['left', 'center', 'right'];
  let [alignmentValue, setAlignmentValueAndSendAction] = useOptimisticBehaviorValue({
    component: textComponent,
    propName: 'alignment',
    propType: 'string',
    sendAction,
  });
  if (!alignmentValue) {
    alignmentValue = 'left';
  }
  const cycleAlignmentValue = React.useCallback(() => {
    const currentIndex = alignmentValues.indexOf(alignmentValue);
    const nextIndex = (currentIndex + 1) % alignmentValues.length;
    setAlignmentValueAndSendAction('set', alignmentValues[nextIndex]);
  }, [setAlignmentValueAndSendAction]);

  const fontNames = [
    'BreiteGrotesk',
    'Compagnon',
    'Glacier',
    'HelicoCentrica',
    'Piazzolla',
    'YatraOne',
    'Bore',
    'Synco',
    'Tektur',
  ];
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
  const onPressClose = React.useCallback(() => {
    sendGlobalAction('setMode', 'default');
  }, []);

  return (
    <KeyboardAvoidingView
      keyboardVerticalOffset={100}
      style={{...styles.keyboardContainer, top: Platform.OS == 'android' ? StatusBar.currentHeight + 20 : 0}}
      behavior="padding">
      <OverlayTextInput textComponent={textComponent} sendAction={sendAction} />
      <View style={styles.container} pointerEvents="box-none">
        <View style={styles.top} pointerEvents="box-none">
          <View style={[styles.toolbar, styles.button]}>
            <Pressable onPress={onPressClose}>
              <CastleIcon name="close" size={22} color="#000" />
            </Pressable>
          </View>
          {isBlueprintSelected ? (
            <View style={{ flexDirection: 'column' }}>
              <View style={[styles.button, styles.singleButton]}>
                <ColorPicker value={colorValue} setValue={onChangeColorValue} />
              </View>
              <Pressable style={[styles.button, styles.singleButton]} onPress={cycleAlignmentValue}>
                <MCIcon name={'format-align-' + alignmentValue} size={20} color="#000" />
              </Pressable>
              <Pressable style={[styles.button, styles.singleButton]} onPress={increaseFontSize}>
                <FeatherIcon name={'plus'} size={24} color="#000" />
              </Pressable>
              <Pressable style={[styles.button, styles.singleButton]} onPress={decreaseFontSize}>
                <FeatherIcon name={'minus'} size={24} color="#000" />
              </Pressable>
            </View>
          ) : null}
        </View>
        {isBlueprintSelected ? (
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <View style={styles.toolrow}>
              {fontNames.map((fontName, i) => {
                return (
                  <Pressable
                    style={[
                      styles.button,
                      fontNameValue == fontName ? { backgroundColor: '#000' } : null,
                    ]}
                    key={i}
                    onPress={() => onChangeFontNameValue(fontName)}>
                    <Constants.CastleIcon
                      name={'font-' + fontName}
                      size={28}
                      color={fontNameValue == fontName ? '#fff' : '#000'}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
};
