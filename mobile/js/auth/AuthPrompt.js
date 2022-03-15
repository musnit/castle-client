import React from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Constants.colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: Constants.colors.white,
    textAlign: 'center',
  },
});

export const AuthPrompt = ({ title, message }) => {
  const { navigate } = useNavigation();

  const imageHeight = 160;
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
            width: 70,
            aspectRatio: 1,
            marginBottom: 32,
          }}
          source={require('../../assets/images/castle-icon.png')}
        />
        <Text style={styles.title}>{title ? title : 'Castle'}</Text>
        <Text style={styles.message}>
          {message ? message : 'Make and play cool stuff on your phone.'}
        </Text>
      </View>
      <Animated.View style={{ transform: [{ translateX: carouselX }] }}>
        <FastImage
          style={{
            width: imageWidth,
            height: imageHeight,
            marginVertical: 48,
          }}
          source={require('../../assets/images/deck-carousel.png')}
        />
      </Animated.View>
      <View style={styles.bottomSection}>
        <View style={{ flexGrow: 1, paddingBottom: 16 }}>
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
        <View style={{ flexGrow: 0 }}>
          <MiscLinks />
        </View>
      </View>
    </View>
  );
};
