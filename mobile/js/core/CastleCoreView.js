import React, { useState, useEffect } from 'react';
import { requireNativeComponent, View, Platform, TouchableOpacity } from 'react-native';

// Implemented by 'CastleCoreView.mm' / 'CastleCoreViewManager.java'.
const NativeCastleCoreView = requireNativeComponent('CastleCoreView', null);

// Apply dimensions settings by computing the actual game view size that fits in the container size
const useDimensions = ({ settings }) => {
  // Give Lua the constant dimensions
  // These are hardcoded in portal.lua for now
  /*GhostEvents.sendAsync('CASTLE_SET_DIMENSIONS', {
    width: settings.width,
    height: settings.height,
  });*/

  // Initialize state
  const [screenScaling, setScreenScaling] = useState(null);
  const [applyScreenScaling, setApplyScreenScaling] = useState(null);
  const [width, setWidth] = useState(null);
  const [height, setHeight] = useState(null);

  // Compute game view dimensions when container layout occurs
  const onLayoutContainer = ({
    nativeEvent: {
      layout: { width: containerWidth, height: containerHeight },
    },
  }) => {
    // Based on `ghostGetGameFrame` in 'ghost.cpp'
    if (settings.width === 0 && settings.height === 0) {
      // Full dimensions
      setApplyScreenScaling(false);
      setScreenScaling(1);
      setWidth(containerWidth);
      setHeight(containerHeight);
    } else {
      // Fixed dimensions
      setApplyScreenScaling(true);
      if (settings.width !== 0 && settings.height !== 0) {
        const newScreenScaling = Math.min(
          containerWidth / settings.width,
          containerHeight / settings.height
        );
        setScreenScaling(newScreenScaling);
        setWidth(Math.min(newScreenScaling * settings.width, containerWidth));
        setHeight(Math.min(newScreenScaling * settings.height, containerHeight));
      } else {
        if (settings.width !== 0) {
          setScreenScaling(containerWidth / settings.width);
        }
        if (settings.height !== 0) {
          setScreenScaling(containerHeight / settings.height);
        }
        setWidth(containerWidth);
        setHeight(containerHeight);
      }
    }
  };

  return { screenScaling, applyScreenScaling, width, height, onLayoutContainer };
};

const CastleCoreView = ({
  deckId,
  initialParams,
  coreViews,
  style,
  dimensionsSettings,
  paused,
  beltHeightFraction,
}) => {
  const dimensionsHook = useDimensions({ settings: dimensionsSettings });

  // On android we need to force a resize, to trigger Graphics::setViewportSize and update
  // Love's dimensions. Otherwise, opening a deck on the feed and then opening a deck in the
  // editor makes the editor deck get pushed down because the height isn't correct
  const [height, setHeight] = useState(Platform.OS === 'android' ? '99%' : '100%');
  if (Platform.OS === 'android') {
    React.useEffect(() => {
      setTimeout(() => {
        setHeight('100%');
      }, 100);
    }, []);
  }

  return (
    // Letterbox the game view
    <View
      style={{
        ...style,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onLayout={dimensionsHook.onLayoutContainer}>
      {dimensionsHook.width !== null && dimensionsHook.height !== null ? (
        // Use a `View` around the actual native component since it doesn't clip properly in some cases otherwise
        <View
          style={{
            width: dimensionsHook.width,
            height: dimensionsHook.height,
          }}>
          <NativeCastleCoreView
            style={{ width: '100%', height: height }}
            screenScaling={dimensionsHook.screenScaling}
            applyScreenScaling={dimensionsHook.applyScreenScaling}
            paused={paused}
            initialParams={initialParams}
            coreViews={coreViews}
            beltHeightFraction={beltHeightFraction}
          />
        </View>
      ) : null}
    </View>
  );
};

export default CastleCoreView;
