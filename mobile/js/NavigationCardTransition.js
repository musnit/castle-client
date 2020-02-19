import {
  StackViewTransitionConfigs,
  StackViewStyleInterpolator,
  HeaderStyleInterpolator,
} from 'react-navigation-stack';

const { transitionSpec: IOSTransitionSpec } = StackViewTransitionConfigs.SlideFromRightIOS;

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

const CardTransition = {
  transitionSpec: IOSTransitionSpec,
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

    const shadowOpacity = props.shadowEnabled
      ? position.interpolate({
          inputRange: [first, index, last],
          outputRange: [0, 0.7, 0],
          extrapolate: 'clamp',
        })
      : null;

    let overlayOpacity = props.cardOverlayEnabled
      ? position.interpolate({
          inputRange: [index, last - 0.5, last, last + 1e-5],
          outputRange: [0, 0.07, 0.07, 0],
          extrapolate: 'clamp',
        })
      : null;

    return {
      transform: [{ scale }],
      opacity,
      overlayOpacity,
      shadowOpacity,
    };
  },
  headerStyleInterpolator: HeaderStyleInterpolator.forBackgroundWithFade,
};

export default CardTransition;
