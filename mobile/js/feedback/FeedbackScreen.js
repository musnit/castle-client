import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { useMutation, gql } from '@apollo/client';
import { useNavigation, useFocusEffect } from '../ReactNavigation';
import { useSession } from '../Session';

import * as Constants from '../Constants';
import * as Utilities from '../common/utilities';
import * as Analytics from '../common/Analytics';

import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.colors.black,
  },
  feedbackForm: {
    marginTop: 20,
    marginHorizontal: 16,
    borderColor: '#888',
    borderWidth: 1,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#888',
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  feedbackInputWrapper: {
    padding: 12,
    paddingTop: 6,
    alignItems: 'flex-end',
  },
  feedbackInput: {
    width: '100%',
    fontSize: 16,
    minHeight: 72,
    color: '#fff',
  },
  header: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  thanks: {
    width: '100%',
    height: 220,
    padding: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thanksLabel: {
    textAlign: 'center',
    fontFamily: 'Basteleur-Bold',
    fontSize: 24,
    color: '#fff',
    marginTop: 24,
    textTransform: 'uppercase',
  },
});

export const FeedbackScreen = () => {
  const [feedbackSent, setFeedbackSent] = React.useState(false);
  useFocusEffect(
    React.useCallback(() => {
      Analytics.logEventSkipAmplitude('VIEW_FEEDBACK');
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
      <ScreenHeader title="Leave Feedback" />
      <View style={styles.feedbackForm}>
        {feedbackSent ? (
          <View style={styles.thanks}>
            <FastImage
              style={{ width: 48, height: 48 }}
              source={require('../../assets/images/emoji/coin-white.png')}
            />
            <Text style={styles.thanksLabel}>Thank you for the feedback!</Text>
          </View>
        ) : (
          <>
            <View style={styles.feedbackHeader}>
              <FastImage
                style={{ width: 22, height: 25, marginRight: 12 }}
                source={require('../../assets/images/emoji/chair-white.png')}
              />
              <Text style={styles.header}>How can we make Castle better?</Text>
            </View>
            <View style={styles.feedbackInputWrapper}>
              <TextInput
                value={feedback}
                placeholder="Leave your feedback here..."
                multiline
                editable={!loading}
                onChangeText={setFeedback}
                style={styles.feedbackInput}
                placeholderTextColor={Constants.colors.grayOnBlackText}
                autoFocus
              />
              <TouchableOpacity
                style={Constants.styles.buttonOnWhite}
                disabled={loading}
                onPress={maybeSendFeedback}>
                <Text style={Constants.styles.buttonLabelOnWhite}>Send</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};
