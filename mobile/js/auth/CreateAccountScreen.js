import React from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { AuthButton } from './AuthButton';
import { AuthScreenLayout } from './AuthScreenLayout';
import { Announcement } from './Announcement';
import { AuthTextInput } from './AuthTextInput';
import { navigateToUri } from '../DeepLinks';
import { parseSignupErrors } from './AuthErrors';
import { useNavigation } from '../ReactNavigation';
import { useSession } from '../Session';

import debounce from 'lodash.debounce';

import * as Analytics from '../common/Analytics';
import * as Constants from '../Constants';

const styles = StyleSheet.create({
  paddingView: {
    height: 16,
  },
  finePrint: {
    lineHeight: 20,
    color: Constants.colors.grayText,
    fontSize: 13,
    textAlign: 'center',
  },
});

const maybeOpenURL = (url) => {
  try {
    Linking.openURL(url);
  } catch (_) {}
};

export const CreateAccountScreen = ({ route }) => {
  useNavigation();
  const { signUpAsync, validateSignupAsync, isUnder13 } = useSession();

  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const [creatingAccount, setCreatingAccount] = React.useState(false);
  const [errors, setErrors] = React.useState({});

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
  }, [setErrors, validateSignupAsync]);

  React.useEffect(() => {
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

  let uriAfter, referringScreen;
  if (route && route.params) {
    uriAfter = route.params.uriAfter;
    referringScreen = route.params.referringScreen;
  }

  const emailInput = React.useRef();
  const pwInput = React.useRef();

  React.useEffect(() => {
    Analytics.logEventSkipAmplitude('VIEW_SIGN_UP', {
      referringScreen,
    });
  }, [referringScreen]);

  const onPressCreateAccount = React.useCallback(async () => {
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
  }, [setCreatingAccount, setErrors, signUpAsync, email, password, uriAfter, username]);

  let usernameHint, usernameHintType;
  if (errors?.isUsernameAvailable) {
    usernameHint = 'Available';
    usernameHintType = 'ok';
  } else if (errors?.username) {
    usernameHint = errors.username;
    usernameHintType = 'error';
  }

  return (
    <AuthScreenLayout>
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
        <AuthButton text="Create Account" spinner={creatingAccount} />
      </TouchableOpacity>
      {/* Dont show terms here if under 13, because their parent already consented to the u13 privacy and terms if they reached this screen. */}
      {!isUnder13 ? (
        <View>
          <Text style={styles.finePrint}>
            By pressing "Create Account," you are agreeing to Castle's&nbsp;
            <Text
              style={{ fontWeight: 'bold' }}
              onPress={() => maybeOpenURL('https://castle.xyz/privacy_policy')}>
              privacy policy
            </Text>
            &nbsp;and
            <Text
              style={{ fontWeight: 'bold' }}
              onPress={() => maybeOpenURL('https://castle.xyz/terms')}>
              {' '}
              terms of service
            </Text>
            .
          </Text>
        </View>
      ) : null}
    </AuthScreenLayout>
  );
};
