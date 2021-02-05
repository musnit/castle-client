import React from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '../ReactNavigation';

import FastImage from 'react-native-fast-image';

import * as Constants from '../Constants';
import Viewport from '../common/viewport';
import { MiscLinks } from '../profile/MiscLinks';

const styles = StyleSheet.create({
  container: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bottomSection: {
    flex: 1,
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: Constants.colors.white,
    textAlign: 'center',
  },
});

export const AuthPrompt = ({ message }) => {
  const { navigate } = useNavigation();

  const imageHeight = 200;
  const imageWidth = imageHeight * 12.352657005; // Original dimensions are 3435x278
  const transitionDelta = (imageWidth - Viewport.vw * 100) / 2;

  const carouselTransition = React.useRef(new Animated.Value(0)).current;
  const carouselX = carouselTransition.interpolate({
    inputRange: [0, 1],
    outputRange: [transitionDelta, -transitionDelta],
  });

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(carouselTransition, {
        toValue: 1,
        duration: 60000,
        easing: Easing.linear,
        loop: {
          iterations: -1,
        },
        useNativeDriver: true,
      })
    ).start();
  });

  const onPressSignIn = React.useCallback(() => {
    if (Constants.iOS) {
      // use native modal on iOS
      navigate('AuthNavigator', { screen: 'LoginScreen' });
    } else {
      // use separate root navigator on Android
      navigate('LoginScreen', {}, { isFullscreen: true });
    }
  }, []);

  const onPressCreateAccount = React.useCallback(() => {
    if (Constants.iOS) {
      // use native modal on iOS
      navigate('AuthNavigator', { screen: 'CreateAccountScreen' });
    } else {
      // use separate root navigator on Android
      navigate('CreateAccountScreen', {}, { isFullscreen: true });
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <FastImage
          style={{
            width: 50,
            aspectRatio: 1,
            marginBottom: 25,
          }}
          source={require('../../assets/images/castle-icon-onblack.png')}
        />
        <FastImage
          style={{
            width: 130,
            height: 26,
            marginBottom: 20,
          }}
          source={require('../../assets/images/castle-wordmark-uppercase.png')}
        />
        <Text style={styles.message}>
          {message ? message : 'Make and play cool stuff on your phone.'}
        </Text>
      </View>
      <Animated.View style={{ transform: [{ translateX: carouselX }] }}>
        <FastImage
          style={{
            width: imageWidth,
            height: imageHeight,
            marginTop: 40,
            marginBottom: 40,
          }}
          source={require('../../assets/images/deck-carousel.png')}
        />
      </Animated.View>
      <View style={styles.bottomSection}>
        <View style={{ flexGrow: 1 }}>
          <TouchableOpacity
            style={{
              ...Constants.styles.primaryButton,
              ...Constants.styles.buttonLarge,
              marginBottom: 16,
            }}
            onPress={onPressCreateAccount}>
            <Text style={[Constants.styles.primaryButtonLabel, Constants.styles.buttonLargeLabel]}>
              Sign up
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[Constants.styles.secondaryButton, Constants.styles.buttonLarge]}
            onPress={onPressSignIn}>
            <Text
              style={[Constants.styles.secondaryButtonLabel, Constants.styles.buttonLargeLabel]}>
              Log in
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexGrow: 0, paddingBottom: 16 }}>
          <MiscLinks />
        </View>
      </View>
    </View>
  );
};
