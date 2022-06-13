import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { AuthButton } from './AuthButton';
import { AuthScreenLayout } from './AuthScreenLayout';
import { Announcement } from './Announcement';
import { AuthTextInput } from './AuthTextInput';
import { parseErrors } from './AuthErrors';
import { useNavigation } from '../ReactNavigation';
import { useSession } from '../Session';

import * as Constants from '../Constants';
import * as CoppaActions from './CoppaActions';

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
  const { navigate } = useNavigation();
  const { userId: signedInUserId, coppaStatus, setCoppaStatus } = useSession();

  const [childName, setChildName] = React.useState('');
  const [parentEmail, setParentEmail] = React.useState('');

  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const parentEmailInput = React.useRef();

  const onSubmit = React.useCallback(async () => {
    try {
      setLoading(true);
      setErrors({});
      let result = await CoppaActions.setParentInfo({ childName, parentEmail });
      await setCoppaStatus(result);
      setLoading(false);

      navigate(CoppaActions.getNextCreateAccountScreen(result));
    } catch (e) {
      setLoading(false);
      if (
        e.message === 'Parent info already set' ||
        (e.graphQLErrors && e.graphQLErrors[0].extensions?.code === 'PARENT_INFO_ALREADY_SET')
      ) {
        const newStatus = `under_13_pending_parent_decision`;
        await setCoppaStatus({ coppaStatus: newStatus });
        navigate(CoppaActions.getNextCreateAccountScreen({ coppaStatus: newStatus }));
      } else {
        setErrors(parseErrors(e));
      }
    }
  }, [
    setLoading,
    setErrors,
    parentEmail,
    childName,
    navigate,
    signedInUserId,
    coppaStatus,
    setCoppaStatus,
  ]);

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
