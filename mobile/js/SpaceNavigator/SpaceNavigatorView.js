import * as React from 'react';
import { Animated, View, StyleSheet } from 'react-native';

import { TabNavigationState, useTheme } from '@react-navigation/native';
// eslint-disable-next-line import/no-unresolved
import { ScreenContainer } from 'react-native-screens';

import ResourceSavingScene from './ResourceSavingScene';
import Viewport from '../viewport';

const SPRING_CONFIG = {
  stiffness: 1000,
  damping: 500,
  mass: 3,
  overshootClamping: true,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

function SceneContent({ isFocused, children }) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityElementsHidden={!isFocused}
      importantForAccessibility={isFocused ? 'auto' : 'no-hide-descendants'}
      style={[styles.content, { backgroundColor: colors.background }]}>
      {children}
    </View>
  );
}

export default class SpaceNavigatorView extends React.Component {
  static defaultProps = {
    lazy: true,
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    const { index } = nextProps.state;

    return {
      // Set the current tab to be loaded if it was not loaded before
      loaded: prevState.loaded.includes(index) ? prevState.loaded : [...prevState.loaded, index],
    };
  }

  state = {
    loaded: [this.props.state.index],
    prevIndex: this.props.state.index,
    indexAnimated: new Animated.Value(this.props.state.index),
  };

  componentDidUpdate(prevProps) {
    if (prevProps.state.index !== this.props.state.index) {
      this.setState((state) => {
        Animated.spring(state.indexAnimated, {
          toValue: this.props.state.index,
          ...SPRING_CONFIG,
        }).start();
        return {
          prevIndex: prevProps.state.index,
        };
      });
    }
  }

  render() {
    const { state, descriptors, lazy } = this.props;
    const { routes } = state;
    const { loaded, prevIndex, indexAnimated } = this.state;
    const isAnimatingFromLeft = state.index < prevIndex;

    return (
      <View style={styles.container}>
        <ScreenContainer style={styles.pages}>
          {routes.map((route, index) => {
            const descriptor = descriptors[route.key];
            const { unmountOnBlur } = descriptor.options;
            const isFocused = state.index === index;
            const isPrev = prevIndex === index;

            if (unmountOnBlur && !isFocused && !isPrev) {
              return null;
            }

            if (lazy && !loaded.includes(index) && !isFocused) {
              // Don't render a screen if we've never navigated to it
              return null;
            }

            let outputRange;
            let inputRange = [prevIndex, state.index];
            if (isPrev) {
              outputRange = isAnimatingFromLeft ? [0, 50 * Viewport.vw] : [0, -(50 * Viewport.vw)];
            } else {
              outputRange = isAnimatingFromLeft ? [-100 * Viewport.vw, 0] : [100 * Viewport.vw, 0];
            }
            if (prevIndex > state.index) {
              // because animated can't figure out how to interpolate a decreasing set of values
              inputRange.reverse();
              outputRange.reverse();
            }
            let translateX = indexAnimated.interpolate({
              inputRange,
              outputRange,
            });

            return (
              <ResourceSavingScene
                key={route.key}
                style={[
                  StyleSheet.absoluteFill,
                  {
                    elevation: isFocused ? 1000 : null,
                    zIndex: isFocused ? 1000 : null,
                  },
                ]}
                isVisible={isFocused || isPrev}>
                <Animated.View style={{ flex: 1, transform: [{ translateX }] }}>
                  <SceneContent isFocused={isFocused}>{descriptor.render()}</SceneContent>
                </Animated.View>
              </ResourceSavingScene>
            );
          })}
        </ScreenContainer>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  pages: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
