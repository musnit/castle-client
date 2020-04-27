import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import BottomSheet from 'reanimated-bottom-sheet';
import { useSafeArea } from 'react-native-safe-area-context';

import { ToolPane } from '../Tools';

export default SceneCreatorPane = React.memo(
  ({ element, context, middleSnapPoint, bottomSnapPoint, renderHeader }) => {
    const bottomSheetRef = useRef(null);
    const insets = useSafeArea();

    useEffect(() => {
      if (element.props.snapCount && element.props.snapCount > 1) {
        bottomSheetRef.current.snapTo(element.props.snapPoint);
      }
    }, [element.props.snapCount]);

    const top = useRef(new Animated.Value(element.props.visible ? 0 : 600)).current;
    useEffect(() => {
      Animated.timing(top, {
        toValue: element.props.visible ? 0 : 600,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, [element.props.visible]);

    const renderContent = () => (
      <View style={{ height: 600 }}>
        <View
          style={{
            backgroundColor: '#fff',
            padding: 16,
            height: '100%',
          }}>
          <ToolPane
            element={element}
            context={context}
            style={{
              flex: 1,
            }}
          />
        </View>
      </View>
    );

    return (
      <Animated.View
        pointerEvents={element.props.visible ? 'box-none' : 'none'}
        style={{
          flex: 1,
          transform: [{ translateY: top }],
        }}>
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={[500, middleSnapPoint, bottomSnapPoint + insets.bottom]}
          initialSnap={element.props.snapPoint}
          enabledInnerScrolling={false}
          enabledContentTapInteraction={false}
          renderHeader={renderHeader}
          renderContent={renderContent}
        />
      </Animated.View>
    );
  }
);
