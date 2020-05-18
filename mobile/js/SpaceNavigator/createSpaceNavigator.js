import * as React from 'react';
import {
  useNavigationBuilder,
  createNavigatorFactory,
  DefaultNavigatorOptions,
  TabRouter,
} from '@react-navigation/native';

import SpaceNavigatorView from './SpaceNavigatorView';

/**
 *  SpaceNavigator uses a TabRouter but does not show a tab bar.
 *  It animates left and right depending on whether the route index increases or decreases.
 */
function SpaceNavigator({ initialRouteName, backBehavior, children, screenOptions, ...rest }) {
  const { state, descriptors, navigation } = useNavigationBuilder(TabRouter, {
    initialRouteName,
    backBehavior: 'none',
    children,
    screenOptions,
  });

  return (
    <SpaceNavigatorView {...rest} state={state} navigation={navigation} descriptors={descriptors} />
  );
}

export default createNavigatorFactory(SpaceNavigator);
