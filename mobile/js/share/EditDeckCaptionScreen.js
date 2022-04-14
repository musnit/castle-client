import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '../ReactNavigation';

import * as Constants from '../Constants';
import * as Analytics from '../common/Analytics';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.colors.black,
  },
  captionForm: {
    margin: 16,
    borderColor: '#888',
    borderWidth: 1,
  },
  captionInputWrapper: {
    padding: 12,
    paddingTop: 6,
    alignItems: 'flex-end',
  },
  captionInput: {
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
});

export const EditDeckCaptionScreen = ({ route }) => {
  const { navigate } = useNavigation();
  let deck, onChangeCaption;
  if (route?.params) {
    deck = route.params.deck;
    onChangeCaption = route.params.onChangeCaption;
  }

  const [loading, setLoading] = React.useState(false);
  const [caption, setCaption] = React.useState(deck?.caption);

  useFocusEffect(
    React.useCallback(() => {
      Analytics.logEvent('VIEW_EDIT_CAPTION');
      setLoading(false);
      setCaption(deck?.caption);
    }, [setLoading, setCaption, deck])
  );

  const maybeSaveCaption = React.useCallback(async () => {
    if (caption?.length) {
      await setLoading(true);
      await onChangeCaption(caption);
      setLoading(false);
      navigate('TabNavigator');
    }
  }, [caption, setLoading, onChangeCaption, navigate]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.captionForm}>
        <View style={styles.captionInputWrapper}>
          <TextInput
            value={caption}
            placeholder="My deck is about owls"
            multiline
            editable={!loading}
            onChangeText={setCaption}
            style={styles.captionInput}
            placeholderTextColor={Constants.colors.grayOnBlackText}
            autoFocus
          />
          <TouchableOpacity
            style={Constants.styles.buttonOnWhite}
            disabled={loading}
            onPress={maybeSaveCaption}>
            <Text style={Constants.styles.buttonLabelOnWhite}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};
