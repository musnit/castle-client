import * as React from 'react';
import { Text, View } from 'react-native';

export default InspectorTags = ({ tags }) => {
  // TODO: tags behavior
  return (
    <View>
      <Text>{JSON.stringify(tags, null, 2)}</Text>
    </View>
  );
};
