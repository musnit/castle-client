import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '../ReactNavigation';
import { getIsTabBarVisible } from '../Navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from 'react-native-vector-icons/MaterialIcons';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 54,
    borderBottomWidth: 1,
    borderColor: Constants.colors.grayOnBlackBorder,
  },
  button: {
    flexShrink: 0,
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  buttonLeft: {
    alignItems: 'flex-start',
    paddingLeft: 12,
  },
  title: {
    width: '100%',
    height: '100%',
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    color: Constants.colors.white,
    fontFamily: 'Basteleur-Bold',
    fontSize: 20,
    marginVertical: 16,
  },
});

export const ScreenHeader = ({ title, onBackButtonPress, RightButtonComponent }) => {
  const navigation = useNavigation();
  const { pop, getState } = navigation;
  const { top } = useSafeAreaInsets();

  // don't useNavigationState() because we don't want to rerender if this changes.
  const navigationStackIndex = getState().index;
  const showBackButton = navigationStackIndex > 0;

  const onPressBack = onBackButtonPress ?? (() => pop());

  // if no tab bar visible on top, we need to avoid device's top inset here
  const addTopInset = !getIsTabBarVisible({ navigation });

  return (
    <>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, addTopInset ? { paddingTop: top } : null]}>
        {showBackButton ? (
          <TouchableOpacity style={[styles.button, styles.buttonLeft]} onPress={onPressBack}>
            <Icon name="arrow-back" size={32} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={[styles.button, styles.buttonLeft]} />
        )}
        <View style={[styles.title, showBackButton ? styles.centerTitle : null]}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
        <View style={[styles.button]} />
        {RightButtonComponent}
      </View>
    </>
  );
};
