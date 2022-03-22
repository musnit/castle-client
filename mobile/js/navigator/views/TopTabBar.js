import { MissingIcon } from '@react-navigation/elements';
import {
  CommonActions,
  NavigationContext,
  NavigationRouteContext,
  ParamListBase,
  TabNavigationState,
  useLinkBuilder,
  useTheme,
} from '@react-navigation/native';
import React from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { EdgeInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import TopTabBarHeightCallbackContext from '../utils/TopTabBarHeightCallbackContext';
import useIsKeyboardShown from '../utils/useIsKeyboardShown';
import TopTabItem from './TopTabItem';

const DEFAULT_TABBAR_HEIGHT = 49;
const COMPACT_TABBAR_HEIGHT = 32;
const DEFAULT_MAX_TAB_ITEM_WIDTH = 125;

const useNativeDriver = Platform.OS !== 'web';

const getPaddingTop = (insets) => Math.max(insets.top - Platform.select({ ios: 4, default: 0 }), 0);

export const getTabBarHeight = ({ state, descriptors, dimensions, insets, style, ...rest }) => {
  // @ts-ignore
  const customHeight = StyleSheet.flatten(style)?.height;

  if (typeof customHeight === 'number') {
    return customHeight;
  }

  const isLandscape = dimensions.width > dimensions.height;
  const paddingTop = getPaddingTop(insets);

  return DEFAULT_TABBAR_HEIGHT + paddingTop;
};

export default function TopTabBar({ state, navigation, descriptors, insets, style }) {
  const { colors } = useTheme();
  const buildLink = useLinkBuilder();

  const focusedRoute = state.routes[state.index];
  const focusedDescriptor = descriptors[focusedRoute.key];
  const focusedOptions = focusedDescriptor.options;

  const {
    tabBarShowLabel,
    tabBarHideOnKeyboard = false,
    tabBarVisibilityAnimationConfig,
    tabBarStyle,
    tabBarBackground,
    tabBarActiveTintColor,
    tabBarInactiveTintColor,
    tabBarActiveBackgroundColor,
    tabBarInactiveBackgroundColor,
    tabBarNuxHideIcons, // CASTLE: independent from visible, fade out icons if nux not completed
  } = focusedOptions;

  const dimensions = useSafeAreaFrame();
  const isKeyboardShown = useIsKeyboardShown();

  const onHeightChange = React.useContext(TopTabBarHeightCallbackContext);

  const shouldShowTabBar = !(tabBarHideOnKeyboard && isKeyboardShown);

  const visibilityAnimationConfigRef = React.useRef(tabBarVisibilityAnimationConfig);

  React.useEffect(() => {
    visibilityAnimationConfigRef.current = tabBarVisibilityAnimationConfig;
  });

  const [isTabBarHidden, setIsTabBarHidden] = React.useState(!shouldShowTabBar);

  const [visible] = React.useState(() => new Animated.Value(shouldShowTabBar ? 1 : 0));
  const [nuxTransition] = React.useState(() => new Animated.Value(tabBarNuxHideIcons ? 0 : 1));

  React.useEffect(() => {
    const visibilityAnimationConfig = visibilityAnimationConfigRef.current;

    if (shouldShowTabBar) {
      const animation =
        visibilityAnimationConfig?.show?.animation === 'spring' ? Animated.spring : Animated.timing;

      animation(visible, {
        toValue: 1,
        useNativeDriver,
        duration: 250,
        ...visibilityAnimationConfig?.show?.config,
      }).start(({ finished }) => {
        if (finished) {
          setIsTabBarHidden(false);
        }
      });
    } else {
      setIsTabBarHidden(true);

      const animation =
        visibilityAnimationConfig?.hide?.animation === 'spring' ? Animated.spring : Animated.timing;

      animation(visible, {
        toValue: 0,
        useNativeDriver,
        duration: 200,
        ...visibilityAnimationConfig?.hide?.config,
      }).start();
    }

    return () => visible.stopAnimation();
  }, [visible, shouldShowTabBar]);

  React.useEffect(() => {
    const visibilityAnimationConfig = visibilityAnimationConfigRef.current;

    if (tabBarNuxHideIcons) {
      const animation =
        visibilityAnimationConfig?.show?.animation === 'spring' ? Animated.spring : Animated.timing;

      animation(nuxTransition, {
        toValue: 0,
        useNativeDriver,
        duration: 250,
        ...visibilityAnimationConfig?.show?.config,
      }).start();
    } else {
      const animation =
        visibilityAnimationConfig?.hide?.animation === 'spring' ? Animated.spring : Animated.timing;

      animation(nuxTransition, {
        toValue: 1,
        useNativeDriver,
        duration: 200,
        ...visibilityAnimationConfig?.hide?.config,
      }).start();
    }

    return () => nuxTransition.stopAnimation();
  }, [nuxTransition, tabBarNuxHideIcons]);

  const [layout, setLayout] = React.useState({
    height: 0,
    width: dimensions.width,
  });

  const handleLayout = (e) => {
    const { height, width } = e.nativeEvent.layout;

    onHeightChange?.(height);

    setLayout((layout) => {
      if (height === layout.height && width === layout.width) {
        return layout;
      } else {
        return {
          height,
          width,
        };
      }
    });
  };

  const { routes } = state;

  const paddingTop = getPaddingTop(insets);
  const tabBarHeight = getTabBarHeight({
    state,
    descriptors,
    insets,
    dimensions,
    layout,
    style: [tabBarStyle, style],
  });

  const tabBarBackgroundElement = tabBarBackground?.();

  return (
    <Animated.View
      style={[
        styles.tabBar,
        {
          backgroundColor: tabBarBackgroundElement != null ? 'transparent' : colors.card,
          borderTopColor: colors.border,
        },
        {
          transform: [
            {
              translateY: visible.interpolate({
                inputRange: [0, 1],
                outputRange: [layout.height + paddingTop + StyleSheet.hairlineWidth, 0],
              }),
            },
          ],
          // Absolutely position the tab bar so that the content is below it
          // This is needed to avoid gap at bottom when the tab bar is hidden
          position: isTabBarHidden ? 'absolute' : null,
        },
        {
          height: tabBarHeight,
          paddingTop,
          paddingHorizontal: Math.max(insets.left, insets.right),
        },
        tabBarStyle,
      ]}
      pointerEvents={isTabBarHidden ? 'none' : 'auto'}
      onLayout={handleLayout}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {tabBarBackgroundElement}
      </View>
      <Animated.View
        accessibilityRole="tablist"
        pointerEvents={tabBarNuxHideIcons ? 'none' : 'auto'}
        style={[styles.content, { opacity: nuxTransition }]}>
        {routes.map((route, index) => {
          const focused = index === state.index;
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.dispatch({
                ...CommonActions.navigate({ name: route.name, merge: true }),
                target: state.key,
              });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const accessibilityLabel =
            options.tabBarAccessibilityLabel !== undefined
              ? options.tabBarAccessibilityLabel
              : typeof label === 'string' && Platform.OS === 'ios'
              ? `${label}, tab, ${index + 1} of ${routes.length}`
              : undefined;

          return (
            <NavigationContext.Provider key={route.key} value={descriptors[route.key].navigation}>
              <NavigationRouteContext.Provider value={route}>
                <TopTabItem
                  route={route}
                  focused={focused}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  accessibilityLabel={accessibilityLabel}
                  to={buildLink(route.name, route.params)}
                  testID={options.tabBarTestID}
                  allowFontScaling={options.tabBarAllowFontScaling}
                  activeTintColor={tabBarActiveTintColor}
                  inactiveTintColor={tabBarInactiveTintColor}
                  activeBackgroundColor={tabBarActiveBackgroundColor}
                  inactiveBackgroundColor={tabBarInactiveBackgroundColor}
                  button={options.tabBarButton}
                  icon={
                    options.tabBarIcon ??
                    (({ color, size }) => <MissingIcon color={color} size={size} />)
                  }
                  badge={options.tabBarBadge}
                  badgeStyle={options.tabBarBadgeStyle}
                  label={label}
                  showLabel={tabBarShowLabel}
                  labelStyle={options.tabBarLabelStyle}
                  iconStyle={options.tabBarIconStyle}
                  style={options.tabBarItemStyle}
                />
              </NavigationRouteContext.Provider>
            </NavigationContext.Provider>
          );
        })}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 8,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
});
