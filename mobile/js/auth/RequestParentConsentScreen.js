import React from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { AuthButton } from './AuthButton';
import { AuthScreenLayout } from './AuthScreenLayout';
import { Announcement } from './Announcement';
import { AuthTextInput } from './AuthTextInput';
import { parseSignupErrors } from './AuthErrors';
import { useNavigation } from '../ReactNavigation';
import { useSession } from '../Session';

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

export const RequestParentConsentScreen = ({ route }) => {
  useNavigation();
  const { signUpAsync } = useSession();

  const [childName, setChildName] = React.useState('');
  const [parentEmail, setParentEmail] = React.useState('');

  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const parentEmailInput = React.useRef();

  const onSubmit = React.useCallback(async () => {
    try {
      setLoading(true);
      setErrors({});
      let result = null; // TODO: submit parent info
      setLoading(false);

      if (result.user) {
        // TODO: navigate to next step
      } else if (result.errors) {
        setErrors(result.errors);
      }
    } catch (e) {
      setLoading(false);
      setErrors(parseSignupErrors(e));
    }
  }, [setLoading, setErrors, signUpAsync, parentEmail, childName]);

  return (
    <AuthScreenLayout>
      {errors?.global ? <Announcement body={errors.global} /> : null}
      <AuthTextInput
        placeholder="Your name"
        placeholderTextColor={Constants.colors.white}
        value={childName}
        onChangeText={(newChildName) => setChildName(newChildName)}
        editable={!loading}
        returnKeyType="next"
        blurOnSubmit={false}
        autoFocus={true}
        onSubmitEditing={() => parentEmailInput.current.focus()}
      />
      <View style={styles.paddingView} />
      <AuthTextInput
        inputRef={parentEmailInput}
        placeholder="Parent's email address"
        placeholderTextColor={Constants.colors.white}
        value={parentEmail}
        onChangeText={(newParentEmail) => setParentEmail(newParentEmail)}
        editable={!loading}
        returnKeyType="go"
        blurOnSubmit={false}
        keyboardType="email-address"
        onSubmitEditing={onSubmit}
        hint={errors?.parentEmail}
      />
      <View style={styles.paddingView} />
      <TouchableOpacity onPress={onSubmit}>
        <AuthButton text="Submit" spinner={loading} />
      </TouchableOpacity>
      <View>
        <Text style={styles.finePrint}>
          Castle needs your parent's permission to finish signing up. We'll send them an email
          explaining how Castle works and asking them to consent to create your account.
        </Text>
      </View>
    </AuthScreenLayout>
  );
};
