import React from 'react';
import { KeyboardAvoidingView, View } from 'react-native';

import * as Constants from '../Constants';

// TODO: try to merge with keyboard behavior elsewhere in the app?
export default SceneCreatorKeyboardWrapper = ({ backgroundColor, children }) => {
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      <KeyboardAvoidingView
        pointerEvents="box-none"
        style={{ flex: 1 }}
        behavior={Constants.iOS ? 'padding' : 'height'}
        enabled>
        {children}
      </KeyboardAvoidingView>
    </View>
  );
};
