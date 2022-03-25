import { Link, Route, useTheme } from '@react-navigation/native';
import Color from 'color';
import React from 'react';
import {
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

import TabBarIcon from './TabBarIcon';

export default function TopTabBarItem({
  focused,
  route,
  label,
  icon,
  badge,
  badgeStyle,
  to,
  button = ({ children, style, onPress, to, accessibilityRole, ...rest }) => {
    return (
      <Pressable {...rest} accessibilityRole={accessibilityRole} onPress={onPress} style={style}>
        {children}
      </Pressable>
    );
  },
  accessibilityLabel,
  testID,
  onPress,
  onLongPress,
  horizontal,
  activeTintColor: customActiveTintColor,
  inactiveTintColor: customInactiveTintColor,
  activeBackgroundColor = 'transparent',
  inactiveBackgroundColor = 'transparent',
  showLabel = true,
  allowFontScaling,
  labelStyle,
  iconStyle,
  style,
}) {
  const { colors } = useTheme();

  const activeTintColor =
    customActiveTintColor === undefined ? colors.primary : customActiveTintColor;

  const inactiveTintColor =
    customInactiveTintColor === undefined
      ? Color(colors.text).mix(Color(colors.card), 0.5).hex()
      : customInactiveTintColor;

  const renderLabel = ({ focused }) => {
    if (showLabel === false) {
      return null;
    }

    const color = focused ? activeTintColor : inactiveTintColor;

    if (typeof label === 'string') {
      return (
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            { color },
            horizontal ? styles.labelBeside : styles.labelBeneath,
            labelStyle,
          ]}
          allowFontScaling={allowFontScaling}>
          {label}
        </Text>
      );
    }

    return label({
      focused,
      color,
      position: horizontal ? 'beside-icon' : 'below-icon',
    });
  };

  const renderIcon = ({ focused }) => {
    if (icon === undefined) {
      return null;
    }

    const activeOpacity = focused ? 1 : 0;
    const inactiveOpacity = focused ? 0 : 1;

    return (
      <TabBarIcon
        route={route}
        horizontal={horizontal}
        badge={badge}
        badgeStyle={badgeStyle}
        activeOpacity={activeOpacity}
        inactiveOpacity={inactiveOpacity}
        activeTintColor={activeTintColor}
        inactiveTintColor={inactiveTintColor}
        renderIcon={icon}
        style={iconStyle}
      />
    );
  };

  const scene = { route, focused };

  const backgroundColor = focused ? activeBackgroundColor : inactiveBackgroundColor;

  return button({
    to,
    onPress,
    onLongPress,
    testID,
    accessibilityLabel,
    // FIXME: accessibilityRole: 'tab' doesn't seem to work as expected on iOS
    accessibilityRole: Platform.select({ ios: 'button', default: 'tab' }),
    accessibilityState: { selected: focused },
    // @ts-expect-error: keep for compatibility with older React Native versions
    accessibilityStates: focused ? ['selected'] : [],
    style: [
      styles.tab,
      { backgroundColor },
      horizontal ? styles.tabLandscape : styles.tabPortrait,
      style,
    ],
    children: (
      <React.Fragment>
        {renderIcon(scene)}
        {renderLabel(scene)}
      </React.Fragment>
    ),
  });
}

const styles = StyleSheet.create({
  tab: {
    alignItems: 'center',
    paddingHorizontal: 9,
  },
  tabPortrait: {
    justifyContent: 'flex-end',
    flexDirection: 'column',
  },
  tabLandscape: {
    flexDirection: 'row',
  },
  labelBeneath: {
    fontSize: 10,
  },
  labelBeside: {
    fontSize: 17,
    marginTop: 3,
    marginLeft: 8,
  },
  button: {
    display: 'flex',
  },
});
