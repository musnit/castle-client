import { Animated, Easing } from 'react-native';
import {
  StackViewTransitionConfigs,
  StackViewStyleInterpolator,
  HeaderStyleInterpolator,
} from 'react-navigation-stack';

// TODO: delete
function forInitial(props) {
  const { navigation, scene } = props;

  const focused = navigation.state.index === scene.index;
  const opacity = focused ? 1 : 0;
  // If not focused, move the scene far away.
  const translate = focused ? 0 : 1000000;
  return {
    opacity,
    transform: [{ translateX: translate }, { translateY: translate }],
  };
}

// TODO: update react nav stack, don't need to duplicate this
function getSceneIndicesForInterpolationInputRange(props) {
  const { scene, scenes } = props;
  const index = scene.index;
  const lastSceneIndexInScenes = scenes.length - 1;
  const isBack = !scenes[lastSceneIndexInScenes].isActive;

  if (isBack) {
    const currentSceneIndexInScenes = scenes.findIndex((item) => item === scene);
    const targetSceneIndexInScenes = scenes.findIndex((item) => item.isActive);
    const targetSceneIndex = scenes[targetSceneIndexInScenes].index;
    const lastSceneIndex = scenes[lastSceneIndexInScenes].index;

    if (index !== targetSceneIndex && currentSceneIndexInScenes === lastSceneIndexInScenes) {
      return {
        first: Math.min(targetSceneIndex, index - 1),
        last: index + 1,
      };
    } else if (
      index === targetSceneIndex &&
      currentSceneIndexInScenes === targetSceneIndexInScenes
    ) {
      return {
        first: index - 1,
        last: Math.max(lastSceneIndex, index + 1),
      };
    } else if (index === targetSceneIndex || currentSceneIndexInScenes > targetSceneIndexInScenes) {
      return null;
    } else {
      return { first: index - 1, last: index + 1 };
    }
  } else {
    return { first: index - 1, last: index + 1 };
  }
}

const CardTransitionSpec = {
  duration: 350,
  easing: Easing.bezier(0.2833, 0.99, 0.31833, 0.99),
  timing: Animated.timing,
};

const CardTransition = {
  transitionSpec: CardTransitionSpec,
  // StackViewStyleInterpolator.forHorizontal,
  screenInterpolator: (props) => {
    const { layout, position, scene } = props;
    if (!layout.isMeasured) {
      return forInitial(props);
    }
    const interpolate = getSceneIndicesForInterpolationInputRange(props);

    if (!interpolate) return { opacity: 0 };

    const { first, last } = interpolate;
    const index = scene.index;

    const width = layout.initWidth;
    const translateX = position.interpolate({
      inputRange: [first, index, last],
      outputRange: [width * 0.3, 0, width * -0.3],
      extrapolate: 'clamp',
    });

    const scale = position.interpolate({
      inputRange: [first, index, last],
      outputRange: [0.95, 1, 0.95],
      extrapolate: 'clamp',
    });

    const opacity = position.interpolate({
      inputRange: [first, index, last],
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    const rotate = position.interpolate({
      inputRange: [first, index, last],
      outputRange: [-0.075, 0, 0],
      extrapolate: 'clamp',
    });

    return {
      transform: [{ translateX }, { scale }, { rotate }],
      opacity,
    };
  },
  headerStyleInterpolator: HeaderStyleInterpolator.forBackgroundWithFade,
};

export default CardTransition;
