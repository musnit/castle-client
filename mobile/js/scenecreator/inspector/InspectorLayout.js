import * as React from 'react';
import { Text, View } from 'react-native';

export default InspectorLayout = ({ body }) => {
  // TODO: width, height, x, y, rotation
  return (
    <View>
      <Text>{JSON.stringify(body, null, 2)}</Text>
    </View>
  );
};
