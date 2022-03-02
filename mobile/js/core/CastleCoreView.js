import React, { useState, useEffect } from 'react';
import { requireNativeComponent, View, Platform, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '../ReactNavigation';

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
  const [showOverlay, setShowOverlay] = useState(Platform.OS === 'android');
  if (Platform.OS === 'android') {
    React.useEffect(() => {
      setTimeout(() => {
        setHeight('100%');
        setShowOverlay(false);
      }, 50);
    }, []);
  }

  // This is needed for the case where you open native feed, go to another tab and open a deck,
  // then return to native feed. Without `key`, the native feed tab won't reattache the engine
  // view to the react native view. Then we need isFocused to make sure that the engine view
  // gets detached when the screen blurs. Otherwise, when the screen comes into focus the second
  // time, React will attach the engine to the new view (which is correct) but then detach the
  // engine from the "old view" (incorrect, since this is the same as the new view) afterwards.
  const [isFocused, setIsFocused] = useState(true);
  const [key, updateKey] = React.useReducer((state, action) => {
    return state + 1;
  }, 0);

  useFocusEffect(
    React.useCallback(() => {
      updateKey();

      if (Platform.OS === 'android') {
        setShowOverlay(true);
        setIsFocused(true);
        setHeight('99%');
        setTimeout(() => {
          setHeight('100%');
          setTimeout(() => {
            setShowOverlay(false);
          }, 50);
        }, 50);
      } else {
        setIsFocused(true);
      }

      return () => {
        setIsFocused(false);
        if (Platform.OS === 'android') {
          setShowOverlay(true);
        }
      };
    }, [updateKey, setHeight])
  );

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
          {isFocused ? (
            <NativeCastleCoreView
              key={`key-${key}`}
              style={{ width: '100%', height: height }}
              screenScaling={dimensionsHook.screenScaling}
              applyScreenScaling={dimensionsHook.applyScreenScaling}
              paused={paused}
              initialParams={initialParams}
              coreViews={coreViews}
              beltHeightFraction={beltHeightFraction}
            />
          ) : null}
          {showOverlay ? (
            <View
              style={{
                width: '100%',
                height: height,
                backgroundColor: 'black',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

export default CastleCoreView;
