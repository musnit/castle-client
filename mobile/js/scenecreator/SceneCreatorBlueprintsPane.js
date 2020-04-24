import React from 'react';
import { Text, View } from 'react-native';

import * as Constants from '../Constants';

import SceneCreatorPane from './SceneCreatorPane';

export default SceneCreatorBlueprintsPane = React.memo(({ element, context }) => {
  const renderHeader = () => (
    <View
      style={{
        backgroundColor: '#fff',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        padding: 16,
      }}>
      <View style={Constants.styles.paneHandle}></View>
      <Text style={{ color: '#888', letterSpacing: 0.5, textAlign: 'center', paddingTop: 12 }}>
        BLUEPRINTS
      </Text>
    </View>
  );

  return (
    <SceneCreatorPane
      element={element}
      context={context}
      middleSnapPoint={300}
      bottomSnapPoint={52}
      renderHeader={renderHeader}
    />
  );
});
