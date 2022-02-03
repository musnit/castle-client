import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Amplitude } from '@amplitude/react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { useMutation, gql } from '@apollo/client';
import { useNavigation, useFocusEffect } from '../ReactNavigation';
import { useSession } from '../Session';

import * as Constants from '../Constants';
import * as Utilities from '../common/utilities';

import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.colors.black,
  },
  feedbackForm: {
    padding: 16,
    margin: 16,
    backgroundColor: '#fff',
    minHeight: 256,
    alignItems: 'center',
    borderRadius: 8,
  },
  feedbackInputWrapper: { width: '100%', flexShrink: 1, marginBottom: 16 },
  thanks: {
    fontSize: 16,
    color: '#000',
  },
});

export const FeedbackScreen = () => {
  const [feedbackSent, setFeedbackSent] = React.useState(false);
  useFocusEffect(
    React.useCallback(() => {
      Amplitude.getInstance().logEvent('VIEW_FEEDBACK');
      setFeedbackSent(false);
    }, [setFeedbackSent])
  );

  const [feedback, setFeedback] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sendFeedback] = useMutation(
    gql`
      mutation SendFeedback($text: String!) {
        sendFeedback(text: $text)
      }
    `
  );

  const maybeSendFeedback = React.useCallback(async () => {
    if (feedback?.length) {
      await setLoading(true);
      await sendFeedback({
        variables: { text: feedback },
      });
      setLoading(false);
      setFeedbackSent(true);
    }
  }, [feedback, sendFeedback, setFeedback, setFeedbackSent]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Feedback" />
      <View style={styles.feedbackForm}>
        {feedbackSent ? (
          <Text style={styles.thanks}>Thank you for your feedback!</Text>
        ) : (
          <>
            <View style={[Constants.styles.textInputWrapperOnWhite, styles.feedbackInputWrapper]}>
              <TextInput
                value={feedback}
                placeholder="How can we improve Castle?"
                multiline
                editable={!loading}
                onChangeText={setFeedback}
                style={[Constants.styles.textInputOnWhite, { minHeight: 72 }]}
                placeholderTextColor={Constants.colors.grayText}
              />
            </View>
            <TouchableOpacity style={Constants.styles.secondaryButton} onPress={maybeSendFeedback}>
              <Text style={Constants.styles.secondaryButtonLabel}>Leave feedback</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};
