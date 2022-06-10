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
import { useSession } from '../Session';

import * as Analytics from '../common/Analytics';
import * as Constants from '../Constants';
import * as CoppaActions from './CoppaActions';

import DatePicker from 'react-native-date-picker';

const styles = StyleSheet.create({
  heading: { paddingBottom: 16 },
  headingLabel: { fontSize: 20, color: Constants.colors.white },
});

export const ChooseBirthdayScreen = ({ route }) => {
  const { navigate } = useNavigation();
  const { coppaStatus, setCoppaStatus } = useSession();
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

  const onSubmit = React.useCallback(async () => {
    try {
      await setLoading(true);
      setErrors([]);
      const result = await CoppaActions.setBirthday(birthday);
      await setCoppaStatus(result);
      await setLoading(false);

      navigate(CoppaActions.getNextCreateAccountScreen(result));
    } catch (e) {
      setLoading(false);
      if (
        e.message === 'Birthday already set' ||
        (e.graphQLErrors && e.graphQLErrors[0].extensions?.code === 'BIRTHDAY_ALREADY_SET')
      ) {
        // birthday already set isn't a blocking error, just advance to next screen
        navigate(CoppaActions.getNextCreateAccountScreen({ coppaStatus }));
      } else {
        setErrors(parseErrors(e));
      }
    }
  }, [birthday, setCoppaStatus, coppaStatus]);

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
      <View style={{ backgroundColor: 'white' }}>
        <DatePicker
          date={birthday}
          onDateChange={setBirthday}
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
