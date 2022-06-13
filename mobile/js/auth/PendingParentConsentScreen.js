import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { AuthButton } from './AuthButton';
import { AuthScreenLayout } from './AuthScreenLayout';
import { Announcement } from './Announcement';
import { parseErrors } from './AuthErrors';
import { useNavigation } from '../ReactNavigation';
import { useSession } from '../Session';

import * as Constants from '../Constants';
import * as CoppaActions from './CoppaActions';

const styles = StyleSheet.create({
  paddingView: {
    height: 16,
  },
  message: {
    color: Constants.colors.white,
    fontSize: 16,
    textAlign: 'center',
  },
});

export const PendingParentConsentScreen = ({ route }) => {
  const { navigate } = useNavigation();
  const { coppaStatus, setCoppaStatus } = useSession();

  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const onSubmit = React.useCallback(async () => {
    try {
      setLoading(true);
      setErrors({});
      let result = await CoppaActions.refreshCoppaStatus();
      setLoading(false);

      if (result.coppaStatus !== coppaStatus) {
        await setCoppaStatus(result);
        navigate(CoppaActions.getNextCreateAccountScreen(result));
      }
    } catch (e) {
      setLoading(false);
      setErrors(parseErrors(e));
    }
  }, [setLoading, setErrors, navigate, coppaStatus, setCoppaStatus]);

  return (
    <AuthScreenLayout>
      {errors?.global ? <Announcement body={errors.global} /> : null}
      <Text style={styles.message}>
        Thanks! We've sent an email to your parent asking them to give you permission to sign up for
        Castle.
      </Text>
      <TouchableOpacity onPress={onSubmit}>
        <AuthButton text="Refresh" spinner={loading} />
      </TouchableOpacity>
    </AuthScreenLayout>
  );
};
