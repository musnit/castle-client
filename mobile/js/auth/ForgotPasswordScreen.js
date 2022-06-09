import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { AuthButton } from './AuthButton';
import { AuthScreenLayout } from './AuthScreenLayout';
import { Announcement } from './Announcement';
import { AuthTextInput } from './AuthTextInput';
import { parseErrors, errorMessages } from './AuthErrors';
import { resetPasswordFromEmailAsync } from '../Session';
import { useNavigation } from '../ReactNavigation';

import * as Constants from '../Constants';

export const ForgotPasswordScreen = () => {
  const { navigate } = useNavigation();

  const [email, setEmail] = React.useState('');

  const [resettingPassword, setResettingPassword] = React.useState(false);
  const [errors, setErrors] = React.useState([]);

  const onPressResetPassword = async () => {
    try {
      await setResettingPassword(true);
      setErrors([]);
      await resetPasswordFromEmailAsync({ email });
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
    <AuthScreenLayout>
      {errors ? (
        <>
          {errors.map((error, ii) => (
            <Announcement key={`announcement-${ii}`} body={errorMessages[error.extensions.code]} />
          ))}
        </>
      ) : null}
      <View style={{ paddingBottom: 16 }}>
        <Text style={{ fontSize: 20, color: Constants.colors.white }}>Forgot your password?</Text>
      </View>
      <AuthTextInput
        value={email}
        onChangeText={(newEmail) => setEmail(newEmail)}
        placeholder="Email"
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
          <AuthButton text="Reset Password" spinner={resettingPassword} />
        </TouchableOpacity>
      </View>
    </AuthScreenLayout>
  );
};
