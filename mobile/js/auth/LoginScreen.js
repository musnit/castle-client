import React from 'react';
import { DeviceEventEmitter, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { AuthButton } from './AuthButton';
import { AuthScreenLayout } from './AuthScreenLayout';
import { AuthTextInput } from './AuthTextInput';
import { Announcement } from './Announcement';
import { navigateToUri } from '../DeepLinks';
import { parseErrors, errorMessages } from './AuthErrors';
import { useNavigation } from '../ReactNavigation';
import { useSession } from '../Session';

import * as Constants from '../Constants';
import * as GhostChannels from '../ghost/GhostChannels';

const styles = StyleSheet.create({
  paddingView: {
    height: 16,
  },
  forgotPassword: { color: Constants.colors.grayText, fontSize: 16 },
});

export const LoginScreen = ({ route }) => {
  const { navigate } = useNavigation();
  const { signInAsync } = useSession();

  let uriAfter, resetPassword;
  if (route && route.params) {
    uriAfter = route.params.uriAfter;
    resetPassword = route.params.resetPassword;
  }

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const pwInput = React.useRef();

  if (Platform.OS === 'android') {
    React.useEffect(() => {
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

  const [signingIn, setSigningIn] = React.useState(false);
  const [errors, setErrors] = React.useState([]);

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

  const onPressForgotPassword = () => {
    navigate('ForgotPasswordScreen');
  };

  return (
    <AuthScreenLayout>
      {errors ? (
        <>
          {errors.map((error, ii) => (
            <Announcement key={`announcement-${ii}`} body={errorMessages[error.extensions.code]} />
          ))}
        </>
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
        <AuthButton text="Log in" spinner={signingIn} />
      </TouchableOpacity>
      <TouchableOpacity
        style={{ paddingTop: 8, paddingBottom: 16 }}
        onPress={onPressForgotPassword}>
        <Text style={styles.forgotPassword}>Forgot password?</Text>
      </TouchableOpacity>
    </AuthScreenLayout>
  );
};
