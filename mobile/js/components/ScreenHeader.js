import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '../ReactNavigation';
import { getIsTabBarVisible } from '../Navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CastleIcon } from '../Constants';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: Constants.colors.grayOnBlackBorder,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  button: {
    width: 60,
    justifyContent: 'center',
  },
  buttonRight: {
    alignItems: 'flex-end',
  },
  title: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    color: Constants.colors.white,
    fontFamily: 'Basteleur-Bold',
    fontSize: 20,
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
          <TouchableOpacity style={[styles.button]} onPress={onPressBack}>
            <CastleIcon name="back" size={22} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={[styles.button]} />
        )}
        <View style={[styles.title]}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
        <View style={[styles.button, styles.buttonRight]}>{RightButtonComponent}</View>
      </View>
    </>
  );
};
