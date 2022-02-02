import * as React from 'react';
import { TextInput, View } from 'react-native';

import * as Constants from '../../../Constants';

const InternalTextInput = ({ style, inputStyle, ...props }) => {
  const textInputRef = React.useRef(null);

  const onBlurRefocus = React.useCallback(() => {
    if (textInputRef) {
      textInputRef.focus();
    }
  });

  return (
    <View style={[Constants.styles.textInputWrapperOnWhite, style]}>
      <TextInput
        ref={textInputRef}
        style={[Constants.styles.textInputOnWhite, inputStyle]}
        placeholderTextColor={Constants.colors.grayText}
        onBlur={props.alwaywsFocus ? onBlurRefocus : null}
        {...props}
      />
    </View>
  );
};

const validateText = (value) => (value && typeof value === 'string' ? value : '');

const OptimisticTextInput = ({ lastNativeValue, ...props }) => {
  let optimisticProps = {};

  let [text, setText] = React.useState(validateText(props.value));
  const onChangeText = React.useCallback(
    (text) => {
      setText(text);
      if (props.onChangeText) {
        props.onChangeText(text);
      }
    },
    [props?.onChangeText, setText]
  );

  // refresh displayed text if we got a new value from native
  React.useEffect(() => {
    if (lastNativeValue) {
      const { value, eventId } = lastNativeValue;
      setText(validateText(value));
    }
  }, [lastNativeValue]);

  optimisticProps.value = text;
  optimisticProps.onChangeText = onChangeText;
  return <InternalTextInput {...props} {...optimisticProps} />;
};

export const InspectorTextInput = ({ optimistic, ...props }) => {
  if (optimistic) {
    return <OptimisticTextInput {...props} />;
  } else {
    return <InternalTextInput {...props} />;
  }
};
