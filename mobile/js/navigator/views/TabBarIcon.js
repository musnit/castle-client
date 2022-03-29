import React from 'react';
import { StyleProp, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';

import Badge from './Badge';

export default function TabBarIcon({
  route: _,
  horizontal,
  badge,
  badgeStyle,
  activeOpacity,
  inactiveOpacity,
  activeTintColor,
  inactiveTintColor,
  renderIcon,
  style,
}) {
  const size = 25;

  // We render the icon twice at the same position on top of each other:
  // active and inactive one, so we can fade between them.
  return (
    <>
      <View style={[horizontal ? styles.iconHorizontal : styles.iconVertical, style]}>
        <View style={[styles.icon, { opacity: activeOpacity }]}>
          {renderIcon({
            focused: true,
            size,
            color: activeTintColor,
          })}
        </View>
        <View style={[styles.icon, { opacity: inactiveOpacity }]}>
          {renderIcon({
            focused: false,
            size,
            color: inactiveTintColor,
          })}
        </View>
      </View>
      <Badge
        visible={badge != null}
        style={[
          styles.badge,
          horizontal ? styles.badgeHorizontal : styles.badgeVertical,
          badgeStyle,
        ]}
        size={(size * 3) / 4}>
        {badge}
      </Badge>
    </>
  );
}

const styles = StyleSheet.create({
  icon: {
    // We render the icon twice at the same position on top of each other:
    // active and inactive one, so we can fade between them:
    // Cover the whole iconContainer:
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    // Workaround for react-native >= 0.54 layout bug
    minWidth: 25,
  },
  iconVertical: {
    flex: 1,
  },
  iconHorizontal: {
    height: '100%',
    marginTop: 3,
  },
  badge: {
    position: 'absolute',
    right: 0,
  },
  badgeVertical: {
    top: 3,
  },
  badgeHorizontal: {
    top: 7,
  },
});
