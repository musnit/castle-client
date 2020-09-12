import React, { useState, Fragment, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  StatusBar,
  Linking,
  ActivityIndicator,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation } from './ReactNavigation';
import FastImage from 'react-native-fast-image';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { resetPasswordAsync, useSession } from './Session';
import { navigateToUri } from './DeepLinks';

import * as Constants from './Constants';
import * as GhostChannels from './ghost/GhostChannels';

const textInputStyle = {
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
};

const disabledTextInputStyle = {
  color: Constants.colors.grayText,
  borderColor: Constants.colors.grayText,
};

const errorMessages = {
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
    <View
      style={{
        padding: 16,
        paddingTop: 12,
        backgroundColor: Constants.colors.white,
        borderRadius: 4,
        marginBottom: 16,
        flexDirection: 'column',
      }}>
      {props.headline ? (
        <Text
          style={{
            fontWeight: 'bold',
            color: Constants.colors.black,
            fontSize: 16,
            marginBottom: 4,
          }}>
          {props.headline}
        </Text>
      ) : null}
      <Text
        style={{
          color: Constants.colors.black,
          lineHeight: 20,
        }}>
        {props.body}
      </Text>
    </View>
  );
};

const Button = (props) => {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 4,
        paddingVertical: 6,
        paddingHorizontal: 9,
        alignItems: 'center',
        overflow: 'hidden',
      }}>
      <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>{props.text}</Text>
      {props.spinner ? (
        <View
          style={{
            backgroundColor: '#fff',
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            justifyContent: 'center',
          }}>
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
      setErrors(e.graphQLErrors);
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
          {errors.map((error) => (
            <Announcement body={errorMessages[error.extensions.code]} />
          ))}
        </Fragment>
      ) : null}
      {resetPassword ? (
        <Announcement
          headline="Check your email"
          body="We've sent you an email with a link to reset your password."
        />
      ) : null}
      <View style={{ width: '100%', alignItems: 'center', paddingBottom: 16 }}>
        <TouchableOpacity onPress={onPressSignUp}>
          <Text style={{ color: Constants.colors.grayText, fontSize: 16 }}>
            Don't have an account?&nbsp;
            <Text style={{ fontWeight: 'bold', color: Constants.colors.white }}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={signingIn ? [textInputStyle, disabledTextInputStyle] : textInputStyle}
        autoCapitalize="none"
        value={username}
        onChangeText={(newUsername) => setUsername(newUsername)}
        placeholder="Email or username"
        placeholderTextColor={Constants.colors.white}
        editable={!signingIn}
        returnKeyType="next"
        onSubmitEditing={() => {
          this._password.focus();
        }}
        blurOnSubmit={false}
        autoCorrect={false}
        keyboardType="email-address"
      />
      <TextInput
        style={signingIn ? [textInputStyle, disabledTextInputStyle] : textInputStyle}
        autoCapitalize="none"
        secureTextEntry
        textContentType="password"
        value={password}
        onChangeText={(newPassword) => setPassword(newPassword)}
        placeholder="Password"
        placeholderTextColor={Constants.colors.white}
        editable={!signingIn}
        ref={(input) => {
          this._password = input;
        }}
        returnKeyType="go"
        onSubmitEditing={onPressSignIn}
      />
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 8,
        }}>
        <TouchableOpacity
          style={{ paddingTop: 8, paddingBottom: 16 }}
          onPress={onPressForgotPassword}>
          <Text style={{ color: Constants.colors.grayText, fontSize: 16 }}>Forgot password?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPressSignIn}>
          <Button text="Log In" spinner={signingIn} />
        </TouchableOpacity>
      </View>
    </Fragment>
  );
};

const CreateAccountForm = () => {
  const { navigate } = useNavigation();
  const { signUpAsync } = useSession();

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [creatingAccount, setCreatingAccount] = useState(false);
  const [errors, setErrors] = useState([]);

  const onPressLogin = () => {
    navigate('LoginScreen');
  };

  const onPressCreateAccount = async () => {
    try {
      setCreatingAccount(true);
      setErrors([]);
      await signUpAsync({ username, name, email, password });
      setCreatingAccount(false);
      if (Platform.OS != 'android') {
        navigate('HomeScreen');
      }
      if (uriAfter) {
        navigateToUri(uriAfter);
      }
    } catch (e) {
      setCreatingAccount(false);
      setErrors(e.graphQLErrors);
    }
  };

  return (
    <Fragment>
      <Fragment>
        {errors.map((error) => (
          <Announcement body={errorMessages[error.extensions.code]} />
        ))}
      </Fragment>
      <View style={{ paddingBottom: 16, alignItems: 'center' }}>
        <Text style={{ fontSize: 20, color: Constants.colors.white }}>Create a new account</Text>
        <TouchableOpacity onPress={onPressLogin}>
          <Text style={{ marginTop: 16, color: Constants.colors.grayText, fontSize: 16 }}>
            Already have an account?&nbsp;
            <Text style={{ fontWeight: 'bold', color: Constants.colors.white }}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={creatingAccount ? [textInputStyle, disabledTextInputStyle] : textInputStyle}
        autoCapitalize="none"
        placeholder="Username"
        placeholderTextColor={Constants.colors.white}
        onChangeText={(newUsername) => setUsername(newUsername)}
        editable={!creatingAccount}
        returnKeyType="next"
        onSubmitEditing={() => {
          this._name.focus();
        }}
        blurOnSubmit={false}
        autoCorrect={false}
      />
      <TextInput
        style={creatingAccount ? [textInputStyle, disabledTextInputStyle] : textInputStyle}
        placeholder="Your name"
        placeholderTextColor={Constants.colors.white}
        onChangeText={(newName) => setName(newName)}
        editable={!creatingAccount}
        returnKeyType="next"
        ref={(input) => {
          this._name = input;
        }}
        onSubmitEditing={() => {
          this._email.focus();
        }}
        blurOnSubmit={false}
        autoCorrect={false}
      />
      <TextInput
        style={creatingAccount ? [textInputStyle, disabledTextInputStyle] : textInputStyle}
        autoCapitalize="none"
        placeholder="Email address"
        placeholderTextColor={Constants.colors.white}
        onChangeText={(newEmail) => setEmail(newEmail)}
        editable={!creatingAccount}
        returnKeyType="next"
        ref={(input) => {
          this._email = input;
        }}
        onSubmitEditing={() => {
          this._password.focus();
        }}
        blurOnSubmit={false}
        autoCorrect={false}
        keyboardType="email-address"
      />
      <TextInput
        style={creatingAccount ? [textInputStyle, disabledTextInputStyle] : textInputStyle}
        secureTextEntry
        textContentType="password"
        placeholder="New password"
        placeholderTextColor={Constants.colors.white}
        onChangeText={(newPassword) => setPassword(newPassword)}
        editable={!creatingAccount}
        returnKeyType="go"
        ref={(input) => {
          this._password = input;
        }}
        onSubmitEditing={onPressCreateAccount}
      />
      <View style={{ paddingTop: 8, paddingBottom: 24 }}>
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
      <TouchableOpacity onPress={onPressCreateAccount}>
        <Button text="Create Account" spinner={creatingAccount} />
      </TouchableOpacity>
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
      setErrors(e.graphQLErrors ?? e);
    }
  };

  return (
    <Fragment>
      {errors ? (
        <Fragment>
          {errors.map((error) => (
            <Announcement body={errorMessages[error.extensions.code]} />
          ))}
        </Fragment>
      ) : null}
      <View style={{ paddingBottom: 16 }}>
        <Text style={{ fontSize: 20, color: Constants.colors.white }}>Forgot your password?</Text>
      </View>
      <TextInput
        style={resettingPassword ? [textInputStyle, disabledTextInputStyle] : textInputStyle}
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

const WithHeader = ({ children }) => (
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
      justifyContent: 'center',
      padding: 16,
    }}>
    <StatusBar backgroundColor="#000" barStyle="light-content" />
    <View
      style={{
        alignItems: 'center',
        paddingBottom: 16,
      }}>
      <FastImage
        style={{
          width: 100,
          aspectRatio: 1,
          marginBottom: 16,
        }}
        source={require('../assets/images/castle-icon-onblack.png')}
      />
      <FastImage
        style={{
          width: 100,
          height: 34,
          marginBottom: 16,
        }}
        source={require('../assets/images/castle-wordmark-onblack.png')}
      />
    </View>
    <View style={{ width: '100%', alignItems: 'center' }}>{children}</View>
  </KeyboardAwareScrollView>
);

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
