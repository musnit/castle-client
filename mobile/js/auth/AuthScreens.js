import React, { useState, Fragment, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  TextInput,
  Linking,
  ActivityIndicator,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation } from '../ReactNavigation';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { resetPasswordAsync, useSession } from '../Session';
import { navigateToUri } from '../DeepLinks';

import Icon from 'react-native-vector-icons/MaterialIcons';

import * as Constants from '../Constants';
import * as GhostChannels from '../ghost/GhostChannels';

const styles = StyleSheet.create({
  announcement: {
    padding: 16,
    paddingTop: 12,
    backgroundColor: Constants.colors.white,
    borderRadius: 4,
    marginBottom: 16,
    flexDirection: 'column',
  },
  announcementHeadline: {
    fontWeight: 'bold',
    color: Constants.colors.black,
    fontSize: 16,
    marginBottom: 4,
  },
  announcementBody: {
    color: Constants.colors.black,
    lineHeight: 20,
  },
  spinner: {
    backgroundColor: '#fff',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  textInput: {
    color: Constants.colors.white,
    backgroundColor: Constants.colors.black,
    width: '100%',
    borderWidth: 1,
    borderColor: Constants.colors.white,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
    fontSize: 16,
  },
  disabledTextInput: {
    color: Constants.colors.grayText,
    borderColor: Constants.colors.grayText,
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

const Announcement = (props) => {
  return (
    <View style={styles.announcement}>
      {props.headline ? <Text style={styles.announcementHeadline}>{props.headline}</Text> : null}
      <Text style={styles.announcementBody}>{props.body}</Text>
    </View>
  );
};

const Button = (props) => {
  return (
    <View
      style={{
        ...Constants.styles.primaryButton,
        ...Constants.styles.buttonLarge,
        marginVertical: 24,
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
      <TextInput
        style={signingIn ? [styles.textInput, styles.disabledTextInput] : styles.textInput}
        autoCapitalize="none"
        value={username}
        onChangeText={(newUsername) => setUsername(newUsername)}
        placeholder="Email or username"
        placeholderTextColor={Constants.colors.white}
        editable={!signingIn}
        returnKeyType="next"
        blurOnSubmit={false}
        autoCorrect={false}
        autoFocus={true}
        keyboardType="email-address"
      />
      <TextInput
        style={signingIn ? [styles.textInput, styles.disabledTextInput] : styles.textInput}
        autoCapitalize="none"
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
  const { signUpAsync } = useSession();

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [creatingAccount, setCreatingAccount] = useState(false);
  const [errors, setErrors] = useState([]);

  let uriAfter;
  if (route && route.params) {
    uriAfter = route.params.uriAfter;
  }

  const onPressLogin = () => {
    navigate('LoginScreen');
  };

  const onPressCreateAccount = async () => {
    try {
      setCreatingAccount(true);
      setErrors([]);
      await signUpAsync({ username, name, email, password });
      setCreatingAccount(false);
      if (uriAfter) {
        navigateToUri(uriAfter);
      }
    } catch (e) {
      setCreatingAccount(false);
      setErrors(parseErrors(e));
    }
  };

  return (
    <Fragment>
      <Fragment>
        {errors?.length
          ? errors.map((error, ii) => (
              <Announcement
                key={`announcement-${ii}`}
                body={errorMessages[error.extensions.code]}
              />
            ))
          : null}
      </Fragment>
      <TextInput
        style={creatingAccount ? [styles.textInput, styles.disabledTextInput] : styles.textInput}
        autoCapitalize="none"
        placeholder="Username"
        placeholderTextColor={Constants.colors.white}
        onChangeText={(newUsername) => setUsername(newUsername)}
        editable={!creatingAccount}
        returnKeyType="next"
        blurOnSubmit={false}
        autoCorrect={false}
        autoFocus={true}
      />
      <TextInput
        style={creatingAccount ? [styles.textInput, styles.disabledTextInput] : styles.textInput}
        placeholder="Your name"
        placeholderTextColor={Constants.colors.white}
        onChangeText={(newName) => setName(newName)}
        editable={!creatingAccount}
        returnKeyType="next"
        blurOnSubmit={false}
        autoCorrect={false}
      />
      <TextInput
        style={creatingAccount ? [styles.textInput, styles.disabledTextInput] : styles.textInput}
        autoCapitalize="none"
        placeholder="Email address"
        placeholderTextColor={Constants.colors.white}
        onChangeText={(newEmail) => setEmail(newEmail)}
        editable={!creatingAccount}
        returnKeyType="next"
        blurOnSubmit={false}
        autoCorrect={false}
        keyboardType="email-address"
      />
      <TextInput
        style={creatingAccount ? [styles.textInput, styles.disabledTextInput] : styles.textInput}
        secureTextEntry
        textContentType="password"
        placeholder="New password"
        placeholderTextColor={Constants.colors.white}
        onChangeText={(newPassword) => setPassword(newPassword)}
        editable={!creatingAccount}
        returnKeyType="go"
        onSubmitEditing={onPressCreateAccount}
      />
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
      <TextInput
        style={resettingPassword ? [styles.textInput, styles.disabledTextInput] : styles.textInput}
        autoCapitalize="none"
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
  const { navigate, pop } = useNavigation();
  const { isSignedIn, isAnonymous } = useSession();

  React.useEffect(() => {
    if (isSignedIn && !isAnonymous) {
      // this will close the auth modal if we finish signing in/up
      navigate('TabNavigator');
    }
  }, [isSignedIn, isAnonymous]);

  return (
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
      {Platform.OS === 'android' && (
        <View
          style={{
            alignItems: 'flex-start',
            width: '100%',
          }}>
          <Icon
            name="close"
            size={24}
            color="#fff"
            onPress={() => pop()}
            style={{ paddingVertical: 16 }}
          />
        </View>
      )}
      <View
        style={{ width: '100%', maxWidth: Constants.TABLET_MAX_FORM_WIDTH, alignItems: 'center' }}>
        {children}
      </View>
    </KeyboardAwareScrollView>
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
