import {
  createNavigatorFactory,
  DefaultNavigatorOptions,
  ParamListBase,
  TabActionHelpers,
  TabNavigationState,
  TabRouter,
  TabRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';
import * as React from 'react';

import TopTabView from './views/TopTabView';

// derived from @react-navigation/bottom-tabs @ 6.2.0
function TopTabNavigator({
  initialRouteName,
  backBehavior,
  children,
  screenListeners,
  screenOptions,
  sceneContainerStyle,
  ...rest
}) {
  let defaultScreenOptions = {};
  const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder(TabRouter, {
    initialRouteName,
    backBehavior,
    children,
    screenListeners,
    screenOptions,
    defaultScreenOptions,
  });

  return (
    <NavigationContent>
      <TopTabView
        {...rest}
        state={state}
        navigation={navigation}
        descriptors={descriptors}
        sceneContainerStyle={sceneContainerStyle}
      />
    </NavigationContent>
  );
}

export default createNavigatorFactory(TopTabNavigator);
