import { getHeaderTitle, Header, SafeAreaProviderCompat, Screen } from '@react-navigation/elements';

import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import TopTabBarHeightCallbackContext from '../utils/TopTabBarHeightCallbackContext';
import TopTabBarHeightContext from '../utils/TopTabBarHeightContext';
import TopTabBar, { getTabBarHeight } from './TopTabBar';
import { MaybeScreen, MaybeScreenContainer } from './ScreenFallback';

export default function TopTabView(props) {
  const {
    tabBar = (props) => <TopTabBar {...props} />,
    state,
    navigation,
    descriptors,
    safeAreaInsets,
    detachInactiveScreens = Platform.OS === 'web' ||
      Platform.OS === 'android' ||
      Platform.OS === 'ios',
    sceneContainerStyle,
  } = props;

  const focusedRouteKey = state.routes[state.index].key;
  const [loaded, setLoaded] = React.useState([focusedRouteKey]);

  if (!loaded.includes(focusedRouteKey)) {
    setLoaded([...loaded, focusedRouteKey]);
  }

  const dimensions = SafeAreaProviderCompat.initialMetrics.frame;
  const [tabBarHeight, setTabBarHeight] = React.useState(() =>
    getTabBarHeight({
      state,
      descriptors,
      dimensions,
      layout: { width: dimensions.width, height: 0 },
      insets: {
        ...SafeAreaProviderCompat.initialMetrics.insets,
        ...props.safeAreaInsets,
      },
      style: descriptors[state.routes[state.index].key].options.tabBarStyle,
    })
  );

  const renderTabBar = () => {
    return (
      <SafeAreaInsetsContext.Consumer>
        {(insets) =>
          tabBar({
            state: state,
            descriptors: descriptors,
            navigation: navigation,
            insets: {
              top: safeAreaInsets?.top ?? insets?.top ?? 0,
              right: safeAreaInsets?.right ?? insets?.right ?? 0,
              bottom: safeAreaInsets?.bottom ?? insets?.bottom ?? 0,
              left: safeAreaInsets?.left ?? insets?.left ?? 0,
            },
          })
        }
      </SafeAreaInsetsContext.Consumer>
    );
  };

  const { routes } = state;

  return (
    <SafeAreaProviderCompat>
      <TopTabBarHeightCallbackContext.Provider value={setTabBarHeight}>
        {renderTabBar()}
      </TopTabBarHeightCallbackContext.Provider>
      <MaybeScreenContainer enabled={detachInactiveScreens} hasTwoStates style={styles.container}>
        {routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const { lazy = true, unmountOnBlur } = descriptor.options;
          const isFocused = state.index === index;

          if (unmountOnBlur && !isFocused) {
            return null;
          }

          if (lazy && !loaded.includes(route.key) && !isFocused) {
            // Don't render a lazy screen if we've never navigated to it
            return null;
          }

          const {
            header = ({ layout, options }) => (
              <Header {...options} layout={layout} title={getHeaderTitle(options, route.name)} />
            ),
          } = descriptor.options;

          return (
            <MaybeScreen
              key={route.key}
              style={[StyleSheet.absoluteFill, { zIndex: isFocused ? 0 : -1 }]}
              visible={isFocused}
              enabled={detachInactiveScreens}>
              <TopTabBarHeightContext.Provider value={tabBarHeight}>
                <Screen
                  focused={isFocused}
                  route={descriptor.route}
                  navigation={descriptor.navigation}
                  headerShown={descriptor.options.headerShown}
                  headerTransparent={descriptor.options.headerTransparent}
                  headerStatusBarHeight={descriptor.options.headerStatusBarHeight}
                  header={header({
                    layout: dimensions,
                    route: descriptor.route,
                    navigation: descriptor.navigation,
                    options: descriptor.options,
                  })}
                  style={sceneContainerStyle}>
                  {descriptor.render()}
                </Screen>
              </TopTabBarHeightContext.Provider>
            </MaybeScreen>
          );
        })}
      </MaybeScreenContainer>
    </SafeAreaProviderCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});
