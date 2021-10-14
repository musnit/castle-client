import * as React from 'react';
import { TextInput, View } from 'react-native';

import * as Constants from '../../../Constants';

export const InspectorTextInput = ({ style, optimistic, ...props }) => {
  const maybeOptimisticProps = {};
  if (optimistic) {
    // optimistically set text, because this component is typically used
    // to wrap a bridged lua value
    let [text, setText] = React.useState(
      props.value && typeof props.value === 'string' ? props.value : ''
    );
    const onChangeText = React.useCallback(
      (text) => {
        setText(text);
        if (props.onChangeText) {
          props.onChangeText(text);
        }
      },
      [props?.onChangeText, setText]
    );

    maybeOptimisticProps.value = text;
    maybeOptimisticProps.onChangeText = onChangeText;
  }

  return (
    <View style={[Constants.styles.textInputWrapperOnWhite, style]}>
      <TextInput
        style={Constants.styles.textInputOnWhite}
        placeholderTextColor={Constants.colors.grayText}
        {...props}
        {...maybeOptimisticProps}
      />
    </View>
  );
};
