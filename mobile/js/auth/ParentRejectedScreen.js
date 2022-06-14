import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { AuthButton } from './AuthButton';
import { AuthScreenLayout } from './AuthScreenLayout';
import { useNavigation } from '../ReactNavigation';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  paddingView: {
    height: 16,
  },
  message: {
    color: Constants.colors.white,
    fontSize: 16,
    textAlign: 'center',
  },
  resendEmail: { color: Constants.colors.grayText, fontSize: 16 },
});

export const ParentRejectedScreen = ({ route }) => {
  const { navigate } = useNavigation();

  const onSubmit = React.useCallback(async () => {
    navigate('RequestParentConsentScreen');
  }, [navigate]);

  return (
    <AuthScreenLayout>
      <Text style={styles.message}>
        Sorry! Your parent hasn't allowed you to sign up for Castle right now.
      </Text>
      <TouchableOpacity onPress={onSubmit}>
        <AuthButton text="Ask them again" />
      </TouchableOpacity>
    </AuthScreenLayout>
  );
};
