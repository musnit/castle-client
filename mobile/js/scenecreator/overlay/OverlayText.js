import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useCoreState, sendAsync, sendBehaviorAction } from '../../core/CoreEvents';
import { useOptimisticBehaviorValue } from '../inspector/InspectorUtilities';

import FeatherIcon from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import ColorPicker from '../inspector/components/ColorPicker';

import * as Constants from '../../Constants';
import * as SceneCreatorConstants from '../SceneCreatorConstants';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 1,
  },
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
  const globalActions = useCoreState('EDITOR_GLOBAL_ACTIONS');
  const currentTool = globalActions?.defaultModeCurrentTool ?? 'grab';

  const sendToolAction = React.useCallback(
    (action, args) => {
      if (typeof action === 'string') {
        sendAsync('EDITOR_INSPECTOR_ACTION', { action, ...args });
      } else if (action.eventName) {
        const { eventName, ...params } = action;
        sendAsync(eventName, params);
      }
    },
    [sendAsync]
  );
  const onSelectGrab = React.useCallback(() => {
    sendToolAction('setDefaultModeCurrentTool', { stringValue: 'grab' });
  }, [sendToolAction]);
  const onSelectScaleRotate = React.useCallback(() => {
    sendToolAction('setDefaultModeCurrentTool', { stringValue: 'scaleRotate' });
  }, [sendToolAction]);
  const onSelectTextContent = React.useCallback(() => {
    sendToolAction('setDefaultModeCurrentTool', { stringValue: 'textContent' });
  }, [sendToolAction]);

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

  return (
    <>
      <View style={styles.container} pointerEvents="box-none">
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          pointerEvents="box-none">
          <View style={{ flexDirection: 'column' }}>
            <View style={styles.toolbar}>
              <Pressable
                style={[styles.button, currentTool === 'grab' ? { backgroundColor: '#000' } : null]}
                onPress={onSelectGrab}>
                <FeatherIcon
                  name="mouse-pointer"
                  size={22}
                  color={currentTool === 'grab' ? '#fff' : '#000'}
                />
              </Pressable>
              <Pressable
                style={[
                  styles.button,
                  currentTool === 'scaleRotate' ? { backgroundColor: '#000' } : null,
                ]}
                onPress={onSelectScaleRotate}>
                <Icon
                  name="crop-rotate"
                  size={22}
                  color={currentTool === 'scaleRotate' ? '#fff' : '#000'}
                />
              </Pressable>
              <Pressable
                style={[
                  styles.button,
                  currentTool === 'textContent' ? { backgroundColor: '#000' } : null,
                  { paddingLeft: 3 },
                ]}
                onPress={onSelectTextContent}>
                <MCIcon
                  name="playlist-edit"
                  size={26}
                  color={currentTool === 'textContent' ? '#fff' : '#000'}
                />
              </Pressable>
            </View>
          </View>
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
        </View>
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
      </View>
    </>
  );
};
