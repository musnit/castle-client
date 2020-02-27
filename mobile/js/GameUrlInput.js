import React from 'react';
import { TextInput, View } from 'react-native';

import * as GameScreen from './GameScreen';

const GameUrlInput = (props) => {
  return (
    <TextInput
      style={{
        width: '100%',
        borderRadius: 4,
        color: '#fff',
        borderColor: '#8888',
        borderWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        fontSize: 16,
      }}
      placeholder="Paste a Castle game URL"
      placeholderTextColor="#888"
      returnKeyType="go"
      clearButtonMode="while-editing"
      onSubmitEditing={(e) => GameScreen.goToGame({ gameUri: e.nativeEvent.text })}
    />
  );
};

export default GameUrlInput;
