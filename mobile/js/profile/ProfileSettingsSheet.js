import React, { Fragment, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Keyboard,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { gql } from '@apollo/client';
import Viewport from '../common/viewport';

import { AutocompleteTextInput } from '../components/AutocompleteTextInput';
import { BottomSheetHeader } from '../components/BottomSheetHeader';
import { BottomSheet } from '../components/BottomSheet';
import { flattenMessageBody, formatMessage } from '../common/chat-utilities';
import { MiscLinks } from './MiscLinks';
import { sanitizeUrl } from '@braintree/sanitize-url';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserAvatar } from '../components/UserAvatar';

import * as Constants from '../Constants';
import * as Session from '../Session';
import * as Utilities from '../common/utilities';
import { AndroidNavigationContext } from '../ReactNavigation';

let SHEET_HEIGHT = 100 * Viewport.vh - 100;
const TAB_BAR_HEIGHT = 49;

const styles = StyleSheet.create({
  section: {
    paddingTop: 16,
    paddingBottom: 4,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnWhiteBorder,
  },
  avatar: {
    width: 96,
    paddingBottom: 16,
  },
  row: {
    paddingBottom: 16,
  },
  avatarRow: {
    alignItems: 'center',
  },
  resetPasswordMessage: {
    fontSize: 16,
    lineHeight: 20,
    color: '#666',
  },
});

const updateUserAsync = async ({ user, aboutBodyCache = {} }) => {
  const clean = sanitizeUrl(user.websiteUrl);
  if (!clean || clean === 'about:blank') {
    user.websiteUrl = '';
  }
  user.tiktokUsername = Utilities.validateThirdPartyUsername(user.tiktokUsername);
  user.twitterUsername = Utilities.validateThirdPartyUsername(user.twitterUsername);
  user.itchUsername = Utilities.validateThirdPartyUsername(user.itchUsername);
  if (user.photo.isChanged) {
    // upload new avatar
    const uploadedFile = await Session.uploadFile({ uri: user.photo.url });
    if (uploadedFile?.fileId) {
      await Session.apolloClient.mutate({
        mutation: gql`
          mutation ($userId: ID!, $photoFileId: ID!) {
            updateUser(userId: $userId, user: { photoFileId: $photoFileId }) {
              userId
            }
          }
        `,
        variables: {
          userId: user.userId,
          photoFileId: uploadedFile.fileId,
        },
      });
    }
  }
  if (user.about) {
    user.about = formatMessage(user.about, aboutBodyCache);
  }
  const result = await Session.apolloClient.mutate({
    mutation: gql`
      mutation ($userId: ID!, $username: String!, $websiteUrl: String, $tiktokUsername: String, $twitterUsername: String, $itchUsername: String, $about: String) {
       updateUser(
         userId: $userId
         user: {
           username: $username,
           websiteUrl: $websiteUrl,
           tiktokUsername: $tiktokUsername,
           twitterUsername: $twitterUsername,
           itchUsername: $itchUsername,
           about: $about,
         }
       ) {
         ${Constants.USER_PROFILE_FRAGMENT}
       }
      }
    `,
    variables: {
      userId: user.userId,
      ...user,
    },
  });
  // TODO: handle errors
  if (result?.data?.updateUser) {
    return result.data.updateUser;
  } else {
    console.warn(`Issue updating profile: ${JSON.stringify(result.errors ?? result)}`);
  }
};

export const ProfileSettingsSheet = ({ me = {}, isOpen, onClose }) => {
  if (Platform.OS === 'android') {
    const { navigatorWindowHeight } = React.useContext(AndroidNavigationContext);
    SHEET_HEIGHT = navigatorWindowHeight - 100;
  }

  const insets = useSafeAreaInsets();
  const [user, changeUser] = React.useReducer(
    (user, changes) => ({
      ...user,
      ...changes,
    }),
    {
      ...me,
      about: flattenMessageBody(me.about),
    }
  );

  const [loading, setLoading] = useState(false);
  const [resetPassword, setResetPassword] = useState({
    sent: false,
    message: null,
  });

  React.useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setResetPassword({ sent: false });
      changeUser({
        ...me,
        about: flattenMessageBody(me.about),
      });
    }
  }, [isOpen]);

  // maintain cache of entities (e.g. user mentions) to help assemble the about body when
  // sending it to the server
  const aboutBodyCache = React.useRef({});
  const updateCache = React.useCallback((action) => {
    if (action.type === 'addUser') {
      const { user } = action;
      aboutBodyCache.current[user.username] = user;
    }
  }, []);

  const saveUserAndClose = React.useCallback(async () => {
    await setLoading(true);
    const updatedUser = await updateUserAsync({ user, aboutBodyCache: aboutBodyCache.current });
    if (updatedUser) {
      onClose(true);
    }
    setLoading(false);
  }, [user, onClose, setLoading]);

  const chooseAvatar = React.useCallback(
    async () =>
      Utilities.launchImageLibrary(
        ({ uri, error }) => {
          if (!error && uri) {
            changeUser({
              photo: {
                isChanged: true,
                url: uri,
              },
            });
          }
        },
        { noUpload: true } // don't upload until the user saves changes
      ),
    [changeUser]
  );

  const onPressPassword = React.useCallback(async () => {
    await setLoading(true);
    const result = await Session.resetPasswordAsync({ username: user.username });
    if (result && !result.errors) {
      setResetPassword({
        sent: true,
        message: 'We emailed you a link to reset your password.',
      });
    } else {
      setResetPassword({
        sent: true,
        message: `Oops, there was an issue resetting your password: ${result.errors.join(', ')}`,
      });
    }
    setLoading(false);
  }, [setResetPassword, setLoading, user.username]);

  const renderHeader = () => (
    <BottomSheetHeader
      title="Settings"
      onClose={onClose}
      onDone={saveUserAndClose}
      loading={loading}
    />
  );

  const renderContent = () => (
    <View style={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}>
      <View style={[styles.section]}>
        <View style={[styles.row, styles.avatarRow]}>
          <View style={styles.avatar}>
            <UserAvatar url={user.photo?.url} />
          </View>
          <TouchableOpacity
            style={Constants.styles.buttonOnWhite}
            onPress={chooseAvatar}
            disabled={loading}>
            <Text style={Constants.styles.buttonLabelOnWhite}>Edit avatar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <Text style={Constants.styles.textInputLabelOnWhite}>Username</Text>
          <View style={Constants.styles.textInputWrapperOnWhite}>
            <TextInput
              value={user.username}
              editable={!loading}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(username) => changeUser({ username })}
              style={Constants.styles.textInputOnWhite}
              placeholderTextColor={Constants.colors.grayText}
            />
          </View>
        </View>
        <View style={styles.row}>
          <Text style={Constants.styles.textInputLabelOnWhite}>Link</Text>
          <View style={Constants.styles.textInputWrapperOnWhite}>
            <TextInput
              value={user.websiteUrl}
              editable={!loading}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(websiteUrl) => changeUser({ websiteUrl })}
              style={Constants.styles.textInputOnWhite}
              placeholder="http://geocities.com"
              placeholderTextColor={Constants.colors.grayText}
            />
          </View>
        </View>
        <View style={styles.row}>
          <Text style={Constants.styles.textInputLabelOnWhite}>Tiktok</Text>
          <View style={Constants.styles.textInputWrapperOnWhite}>
            <TextInput
              value={user.tiktokUsername}
              editable={!loading}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(tiktokUsername) => changeUser({ tiktokUsername })}
              style={Constants.styles.textInputOnWhite}
              placeholder="Your Tiktok username"
              placeholderTextColor={Constants.colors.grayText}
            />
          </View>
        </View>
        <View style={styles.row}>
          <Text style={Constants.styles.textInputLabelOnWhite}>Twitter</Text>
          <View style={Constants.styles.textInputWrapperOnWhite}>
            <TextInput
              value={user.twitterUsername}
              editable={!loading}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(twitterUsername) => changeUser({ twitterUsername })}
              style={Constants.styles.textInputOnWhite}
              placeholder="Your Twitter username"
              placeholderTextColor={Constants.colors.grayText}
            />
          </View>
        </View>
        <View style={styles.row}>
          <Text style={Constants.styles.textInputLabelOnWhite}>Itch</Text>
          <View style={Constants.styles.textInputWrapperOnWhite}>
            <TextInput
              value={user.itchUsername}
              editable={!loading}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(itchUsername) => changeUser({ itchUsername })}
              style={Constants.styles.textInputOnWhite}
              placeholder="Your itch username"
              placeholderTextColor={Constants.colors.grayText}
            />
          </View>
        </View>
        <View style={styles.row}>
          <Text style={Constants.styles.textInputLabelOnWhite}>About me</Text>
          <View style={Constants.styles.textInputWrapperOnWhite}>
            <AutocompleteTextInput
              updateCache={updateCache}
              style={Constants.styles.textInputOnWhite}
              placeholder="I like turtles"
              placeholderTextColor={Constants.colors.grayText}
              value={user.about}
              onChangeText={(about) => changeUser({ about })}
            />
          </View>
        </View>
      </View>
      <View style={[styles.section]}>
        {/* <View style={styles.row}>
          <Text style={Constants.styles.textInputLabelOnWhite}>Email</Text>
          <TextInput
            value={user.email}
            editable={!loading}
            onChangeText={(email) => changeUser({ email })}
            style={Constants.styles.textInputOnWhite}
            placeholderTextColor={Constants.colors.grayText}
          />
        </View> */}
        <View style={styles.row}>
          <View>
            <Text style={Constants.styles.textInputLabelOnWhite}>Password</Text>
          </View>
          <View style={{ alignItems: 'flex-start' }}>
            {resetPassword.sent ? (
              <Text style={styles.resetPasswordMessage}>{resetPassword.message}</Text>
            ) : (
              <TouchableOpacity
                onPress={onPressPassword}
                style={Constants.styles.buttonOnWhite}
                disabled={loading}>
                <Text style={Constants.styles.buttonLabelOnWhite}>Send reset password email</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      <View style={{ paddingVertical: 15, alignItems: 'center' }}>
        <MiscLinks />
      </View>
    </View>
  );

  return (
    <BottomSheet
      snapPoints={[SHEET_HEIGHT]}
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
      onOpenEnd={Keyboard.dismiss}
      onCloseEnd={Keyboard.dismiss}
      onClose={onClose}
      style={{
        backgroundColor: '#fff',
        borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
        borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
        ...Constants.styles.dropShadowUp,
      }}
    />
  );
};
