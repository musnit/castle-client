import React from 'react';
import { View } from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { useSafeArea } from 'react-native-safe-area-context';

import { ToolPane } from '../Tools';

export default SceneCreatorPane = React.memo(
  ({ element, visible, context, middleSnapPoint, bottomSnapPoint, renderHeader }) => {
    const insets = useSafeArea();

    const renderContent = () => (
      <ToolPane element={element} context={context} style={{ margin: 16 }} />
    );

    return (
      <BottomSheet
        snapPoints={[500, middleSnapPoint, bottomSnapPoint + insets.bottom]}
        initialSnap={element.props.snapPoint}
        renderHeader={renderHeader}
        renderContent={renderContent}
        isOpen={visible}
        style={{ backgroundColor: '#fff' }}
      />
    );
  }
);
