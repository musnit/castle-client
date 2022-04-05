import React, { useState, Fragment, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { Announcement } from './Announcement';
import { ANDROID_USE_NATIVE_NAVIGATION } from '../ReactNavigation';
import { AuthTextInput } from './AuthTextInput';
import { useNavigation } from '../ReactNavigation';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { resetPasswordAsync, useSession } from '../Session';
import { navigateToUri } from '../DeepLinks';

import { ScreenHeader } from '../components/ScreenHeader';

import * as Constants from '../Constants';
import * as GhostChannels from '../ghost/GhostChannels';
import * as Analytics from '../common/Analytics';

import debounce from 'lodash.debounce';

const styles = StyleSheet.create({
  spinner: {
    backgroundColor: '#fff',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  paddingView: {
    height: 16,
  },
});

const parseErrors = (e) => {
  if (e.graphQLErrors?.length) {
    return e.graphQLErrors;
  } else {
    return [
      {
        message: e.message,
        extensions: { code: 'NETWORK_ERROR' },
      },
    ];
  }
};

const parseSignupErrors = (e) => {
  if (e.graphQLErrors?.length) {
    return {
      global: e.graphQLErrors[0].message,
    };
  } else {
    return {
      global:
        'We could not process your request because the app appears to be offline. Please check your network connection and try again.',
    };
  }
};

const errorMessages = {
  NETWORK_ERROR:
    'We could not process your request because the app appears to be offline. Please check your network connection and try again.',
  USER_NOT_FOUND:
    'The email or username you entered does not belong to an account. Please check your information and try again.',
  LOGIN_BAD_CREDENTIALS:
    'The password you entered was incorrect. Please check your information and try again.',
  PASSWORD_RESET_TOO_MANY:
    'There have been too many attempts to reset your password. Try again later.',
  PASSWORD_RESET_INVALID_CODE: 'The reset link you clicked on was invalid. It may have expired.',
  SIGNUP_INVALID_EMAIL: 'The email address you entered was invalid.',
  SIGNUP_INVALID_USERNAME:
    'The username you entered was invalid. Usernames must be at least three characters long and can only contain letters, numbers, and - or _.',
  SIGNUP_EMAIL_ALREADY_TAKEN:
    'There is already an account associated with the email address you entered.',
  SIGNUP_USERNAME_ALREADY_TAKEN: 'The username you entered is already taken.',
  SIGNUP_PASSWORD_TOO_SHORT:
    'The password you entered is too short. Passwords must be at least five characters long.',
};

const Button = (props) => {
  return (
    <View
      style={{
        ...Constants.styles.primaryButton,
        ...Constants.styles.buttonLarge,
        marginVertical: 24,
        // for some reason the button could render with zero height on Android, even though the
        // inner Text has intrinsic height, so force a minimum height on the overall button
        minHeight: 48,
      }}>
      <Text style={[Constants.styles.primaryButtonLabel, Constants.styles.buttonLargeLabel]}>
        {props.text}
      </Text>
      {props.spinner ? (
        <View style={styles.spinner}>
          <ActivityIndicator size="small" color="#000" />
        </View>
      ) : null}
    </View>
  );
};

const LoginForm = ({ route }) => {
  const { navigate } = useNavigation();
  const { signInAsync } = useSession();

  let uriAfter, resetPassword;
  if (route && route.params) {
    uriAfter = route.params.uriAfter;
    resetPassword = route.params.resetPassword;
  }

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const pwInput = React.useRef();

  if (Platform.OS == 'android') {
    useEffect(() => {
      GhostChannels.getSmartLockCredentials();

      let subscription = DeviceEventEmitter.addListener('CastleSmartLockCredentials', (event) => {
        setUsername(event.username);
        setPassword(event.password);
      });

      return () => {
        subscription.remove();
      };
    }, []);
  }

  const [signingIn, setSigningIn] = useState(false);
  const [errors, setErrors] = useState([]);

  const onPressSignIn = async () => {
    try {
      setSigningIn(true);
      setErrors([]);
      await signInAsync({ username, password });
      if (uriAfter) {
        navigateToUri(uriAfter);
      }
    } catch (e) {
      setSigningIn(false);
      setErrors(parseErrors(e));
    }
  };

  const onPressSignUp = () => {
    navigate('CreateAccountScreen', { uriAfter });
  };

  const onPressForgotPassword = () => {
    navigate('ForgotPasswordScreen');
  };

  return (
    <Fragment>
      {errors ? (
        <Fragment>
          {errors.map((error, ii) => (
            <Announcement key={`announcement-${ii}`} body={errorMessages[error.extensions.code]} />
          ))}
        </Fragment>
      ) : null}
      {resetPassword ? (
        <Announcement
          headline="Check your email"
          body="We've sent you an email with a link to reset your password."
        />
      ) : null}
      <AuthTextInput
        value={username}
        onChangeText={(newUsername) => setUsername(newUsername)}
        placeholder="Email or username"
        placeholderTextColor={Constants.colors.white}
        editable={!signingIn}
        returnKeyType="next"
        blurOnSubmit={false}
        autoFocus={true}
        keyboardType="email-address"
        onSubmitEditing={() => pwInput.current.focus()}
      />
      <View style={styles.paddingView} />
      <AuthTextInput
        inputRef={pwInput}
        secureTextEntry
        textContentType="password"
        value={password}
        onChangeText={(newPassword) => setPassword(newPassword)}
        placeholder="Password"
        placeholderTextColor={Constants.colors.white}
        editable={!signingIn}
        returnKeyType="go"
        onSubmitEditing={onPressSignIn}
      />
      <TouchableOpacity onPress={onPressSignIn}>
        <Button text="Log in" spinner={signingIn} />
      </TouchableOpacity>
      <TouchableOpacity
        style={{ paddingTop: 8, paddingBottom: 16 }}
        onPress={onPressForgotPassword}>
        <Text style={{ color: Constants.colors.grayText, fontSize: 16 }}>Forgot password?</Text>
      </TouchableOpacity>
    </Fragment>
  );
};

const CreateAccountForm = ({ route }) => {
  const { navigate } = useNavigation();
  const { signUpAsync, validateSignupAsync } = useSession();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [creatingAccount, setCreatingAccount] = useState(false);
  const [errors, setErrors] = useState({});

  const validateSignupDebounceFn = React.useRef();
  const lastValidateQuery = React.useRef('');
  React.useEffect(() => {
    validateSignupDebounceFn.current = debounce(async (username, email, password, query) => {
      const results = await validateSignupAsync({ username, email, password });
      // double check the query hasn't changed async during our debounce/request
      if (lastValidateQuery.current === query) {
        setErrors(results);
      }
    }, 500);
  }, [setErrors]);

  useEffect(() => {
    if (
      validateSignupDebounceFn.current &&
      (username.length > 0 || password.length > 0 || email.length > 0)
    ) {
      let query = `${username}-${email}-${password}`;
      lastValidateQuery.current = query;
      validateSignupDebounceFn.current(username, email, password, query);
    } else {
      setErrors({});
    }
  }, [setErrors, username, email, password]);

  let uriAfter;
  if (route && route.params) {
    uriAfter = route.params.uriAfter;
  }

  const emailInput = React.useRef();
  const pwInput = React.useRef();

  useEffect(() => {
    Analytics.logEvent('VIEW_SIGN_UP');
  }, []);

  const onPressLogin = () => {
    navigate('LoginScreen');
  };

  const onPressCreateAccount = async () => {
    try {
      setCreatingAccount(true);
      setErrors({});
      let signupResult = await signUpAsync({ username, name: '', email, password });
      setCreatingAccount(false);

      if (signupResult.user) {
        if (uriAfter) {
          navigateToUri(uriAfter);
        }
      } else if (signupResult.errors) {
        setErrors(signupResult.errors);
      }
    } catch (e) {
      setCreatingAccount(false);
      setErrors(parseSignupErrors(e));
    }
  };

  let usernameHint, usernameHintType;
  if (errors?.isUsernameAvailable) {
    usernameHint = 'Available';
    usernameHintType = 'ok';
  } else if (errors?.username) {
    usernameHint = errors.username;
    usernameHintType = 'error';
  }

  return (
    <Fragment>
      {errors?.global ? <Announcement body={errors.global} /> : null}
      <AuthTextInput
        placeholder="Username"
        placeholderTextColor={Constants.colors.white}
        value={username}
        onChangeText={(newUsername) => setUsername(newUsername)}
        editable={!creatingAccount}
        returnKeyType="next"
        blurOnSubmit={false}
        autoFocus={true}
        onSubmitEditing={() => emailInput.current.focus()}
        hint={usernameHint}
        hintType={usernameHintType}
      />
      <View style={styles.paddingView} />
      <AuthTextInput
        inputRef={emailInput}
        placeholder="Email address"
        placeholderTextColor={Constants.colors.white}
        value={email}
        onChangeText={(newEmail) => setEmail(newEmail)}
        editable={!creatingAccount}
        returnKeyType="next"
        blurOnSubmit={false}
        keyboardType="email-address"
        onSubmitEditing={() => pwInput.current.focus()}
        hint={errors?.email}
      />
      <View style={styles.paddingView} />
      <AuthTextInput
        inputRef={pwInput}
        secureTextEntry
        textContentType="password"
        placeholder="New password"
        placeholderTextColor={Constants.colors.white}
        value={password}
        onChangeText={(newPassword) => setPassword(newPassword)}
        editable={!creatingAccount}
        returnKeyType="go"
        onSubmitEditing={onPressCreateAccount}
        hint={errors?.password}
      />
      <View style={styles.paddingView} />
      <TouchableOpacity onPress={onPressCreateAccount}>
        <Button text="Create Account" spinner={creatingAccount} />
      </TouchableOpacity>
      <View>
        <Text
          style={{
            lineHeight: 20,
            color: Constants.colors.grayText,
            fontSize: 13,
            textAlign: 'center',
          }}>
          By clicking "Create Account," you are agreeing to Castle's&nbsp;
          <Text
            style={{ fontWeight: 'bold' }}
            onPress={() => Linking.openURL('https://castle.xyz/privacy_policy')}>
            privacy policy
          </Text>
          &nbsp;and
          <Text
            style={{ fontWeight: 'bold' }}
            onPress={() => Linking.openURL('https://castle.xyz/terms')}>
            {' '}
            terms of service
          </Text>
          .
        </Text>
      </View>
    </Fragment>
  );
};

const ForgotPasswordForm = () => {
  const { navigate } = useNavigation();

  const [username, setUsername] = useState('');

  const [resettingPassword, setResettingPassword] = useState(false);
  const [errors, setErrors] = useState([]);

  const onPressResetPassword = async () => {
    try {
      await setResettingPassword(true);
      setErrors([]);
      await resetPasswordAsync({ username });
      await setResettingPassword(false);
      navigate('LoginScreen', {
        resetPassword: true,
      });
    } catch (e) {
      setResettingPassword(false);
      setErrors(parseErrors(e));
    }
  };

  return (
    <Fragment>
      {errors ? (
        <Fragment>
          {errors.map((error, ii) => (
            <Announcement key={`announcement-${ii}`} body={errorMessages[error.extensions.code]} />
          ))}
        </Fragment>
      ) : null}
      <View style={{ paddingBottom: 16 }}>
        <Text style={{ fontSize: 20, color: Constants.colors.white }}>Forgot your password?</Text>
      </View>
      <AuthTextInput
        value={username}
        onChangeText={(newUsername) => setUsername(newUsername)}
        placeholder="Email or username"
        placeholderTextColor={Constants.colors.white}
        editable={!resettingPassword}
        autoFocus={true}
        returnKeyType="go"
        onSubmitEditing={onPressResetPassword}
      />
      <View
        style={{
          paddingVertical: 8,
        }}>
        <TouchableOpacity onPress={onPressResetPassword}>
          <Button text="Reset Password" spinner={resettingPassword} />
        </TouchableOpacity>
      </View>
    </Fragment>
  );
};

const WithHeader = ({ children }) => {
  const { navigate } = useNavigation();
  const { isSignedIn, isAnonymous } = useSession();

  React.useEffect(() => {
    if (isSignedIn && !isAnonymous) {
      // this will close the auth modal if we finish signing in/up
      navigate('TabNavigator');
    }
  }, [isSignedIn, isAnonymous]);

  return (
    <>
      {Platform.OS === 'android' && ANDROID_USE_NATIVE_NAVIGATION ? (
        <ScreenHeader title="Castle" />
      ) : null}
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        style={{
          flex: 1,
          backgroundColor: Constants.colors.black,
        }}
        contentContainerStyle={{
          flex: 1,
          alignItems: 'center',
          padding: 15,
          paddingTop: 20,
        }}>
        <View
          style={{
            width: '100%',
            maxWidth: Constants.TABLET_MAX_FORM_WIDTH,
            alignItems: 'center',
          }}>
          {children}
        </View>
      </KeyboardAwareScrollView>
    </>
  );
};

export const LoginScreen = () => (
  <WithHeader>
    <LoginForm />
  </WithHeader>
);

export const CreateAccountScreen = () => (
  <WithHeader>
    <CreateAccountForm />
  </WithHeader>
);

export const ForgotPasswordScreen = () => (
  <WithHeader>
    <ForgotPasswordForm />
  </WithHeader>
);
