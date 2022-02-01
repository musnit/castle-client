import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { useCoreState, sendBehaviorAction, sendGlobalAction } from '../../../core/CoreEvents';

import * as Constants from '../../../Constants';
import tinycolor from 'tinycolor2';

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontWeight: 'bold',
    paddingBottom: 16,
    fontSize: 16,
  },
  text: {
    fontSize: 16,
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

  if (!textComponent) {
    return null;
  }
  const hexColor = tinycolor.fromRatio(textComponent.props.color).toHexString();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[Constants.styles.textInputWrapperOnWhite, { marginBottom: 16 }]}
        onPress={selectTextTool}>
        <View style={Constants.styles.textInputOnWhite}>
          <Text
            style={[
              styles.text,
              {
                color: hexColor,
                fontFamily: postScriptNames[textComponent.props.fontName],
              },
            ]}>
            {textComponent.props.content}
          </Text>
        </View>
      </TouchableOpacity>
      <InspectorCheckbox value={visibleValue} onChange={onChangeVisibleValue} label="Visible" />
    </View>
  );
};
