import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { ANDROID_USE_NATIVE_NAVIGATION } from '../ReactNavigation';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ScreenHeader } from '../components/ScreenHeader';
import { useNavigation } from '../ReactNavigation';
import { useSession } from '../Session';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Constants.colors.black,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    paddingTop: 20,
  },
  form: {
    width: '100%',
    maxWidth: Constants.TABLET_MAX_FORM_WIDTH,
    alignItems: 'center',
  },
});

export const AuthScreenLayout = ({ children }) => {
  const { navigate } = useNavigation();
  const { isSignedIn, isAnonymous } = useSession();

  React.useEffect(() => {
    if (isSignedIn && !isAnonymous) {
      // this will close the auth modal if we finish signing in/up
      navigate('TabNavigator');
    }
  }, [isSignedIn, isAnonymous, navigate]);

  return (
    <>
      {Platform.OS === 'android' && ANDROID_USE_NATIVE_NAVIGATION ? (
        <ScreenHeader title="Castle" />
      ) : null}
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
        contentContainerStyle={styles.container}>
        <View style={styles.form}>{children}</View>
      </KeyboardAwareScrollView>
    </>
  );
};
