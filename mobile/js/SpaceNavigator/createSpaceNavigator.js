import * as React from 'react';
import {
  useNavigationBuilder,
  createNavigatorFactory,
  DefaultNavigatorOptions,
  TabRouter,
  TabRouterOptions,
  TabNavigationState,
} from '@react-navigation/native';
import {
  BottomTabNavigationOptions,
  BottomTabNavigationEventMap,
} from '@react-navigation/bottom-tabs';

import SpaceNavigatorView from './SpaceNavigatorView';

function SpaceNavigator({ initialRouteName, backBehavior, children, screenOptions, ...rest }) {
  const { state, descriptors, navigation } = useNavigationBuilder(TabRouter, {
    initialRouteName,
    backBehavior,
    children,
    screenOptions,
  });

  return (
    <SpaceNavigatorView {...rest} state={state} navigation={navigation} descriptors={descriptors} />
  );
}

export default createNavigatorFactory(SpaceNavigator);
