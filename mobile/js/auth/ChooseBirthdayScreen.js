import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { AuthButton } from './AuthButton';
import { AuthScreenLayout } from './AuthScreenLayout';
import { Announcement } from './Announcement';
import { AuthTextInput } from './AuthTextInput';
import { parseErrors, errorMessages } from './AuthErrors';
import { resetPasswordFromEmailAsync } from '../Session';
import { useNavigation } from '../ReactNavigation';

import * as Analytics from '../common/Analytics';
import * as Constants from '../Constants';

import DatePicker from 'react-native-date-picker';

const styles = StyleSheet.create({
  heading: { paddingBottom: 16 },
  headingLabel: { fontSize: 20, color: Constants.colors.white },
});

export const ChooseBirthdayScreen = ({ route }) => {
  const { navigate } = useNavigation();
  let referringScreen;
  if (route && route.params) {
    referringScreen = route.params.referringScreen;
  }

  React.useEffect(() => {
    Analytics.logEventSkipAmplitude('VIEW_CHOOSE_BIRTHDAY', {
      referringScreen,
    });
  }, [referringScreen]);

  const [birthday, setBirthday] = React.useState(new Date());
  const minBirthday = React.useRef(
    new Date(new Date().setFullYear(new Date().getFullYear() - 100))
  );
  const maxBirthday = React.useRef(new Date(new Date().setFullYear(new Date().getFullYear() - 6)));

  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState([]);

  const onSubmit = async () => {
    try {
      await setLoading(true);
      setErrors([]);
      // TODO: set birthday gql mutation
      await setLoading(false);

      // TODO: maybe enter u13 flow here
      navigate('CreateAccountScreen');
    } catch (e) {
      setLoading(false);
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
      <View style={styles.heading}>
        <Text style={styles.headingLabel}>When is your birthday?</Text>
      </View>
      {/* <AuthTextInput
        value={birthday}
        onChangeText={(newBirthday) => setBirthday(newBirthday)}
        placeholder="Birthday"
        placeholderTextColor={Constants.colors.white}
        editable={!loading}
        autoFocus={true}
        returnKeyType="go"
        onSubmitEditing={onSubmit}
        /> */}
      <View style={{ backgroundColor: 'white' }}>
        <DatePicker
          date={birthday}
          onChangeDate={setBirthday}
          mode="date"
          minimumDate={minBirthday.current}
          maximumDate={maxBirthday.current}
        />
      </View>
      <View
        style={{
          paddingVertical: 8,
        }}>
        <TouchableOpacity onPress={onSubmit}>
          <AuthButton text="Submit" spinner={loading} />
        </TouchableOpacity>
      </View>
    </AuthScreenLayout>
  );
};
