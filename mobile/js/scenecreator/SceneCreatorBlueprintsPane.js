import React from 'react';
import { Text, View } from 'react-native';

import * as Constants from '../Constants';

import SceneCreatorPane from './SceneCreatorPane';

export default SceneCreatorBlueprintsPane = ({ element, visible, context }) => {
  const renderHeader = () => (
    <View
      style={{
        backgroundColor: '#fff',
        borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
        borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
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
      visible={visible}
      element={element}
      context={context}
      renderHeader={renderHeader}
    />
  );
};
