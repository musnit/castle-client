import React, { Fragment, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Keyboard,
  Linking,
  TextInput,
} from 'react-native';
import gql from 'graphql-tag';
import Viewport from '../common/viewport';

import { BottomSheetHeader } from '../components/BottomSheetHeader';
import { BottomSheet } from '../components/BottomSheet';
import { useSession } from '../Session';
import { useSafeArea } from 'react-native-safe-area-context';
import { UserAvatar } from '../components/UserAvatar';

import * as Constants from '../Constants';
import * as Session from '../Session';
import * as Utilities from '../common/utilities';

const SHEET_HEIGHT = 100 * Viewport.vh - 100;
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
  links: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  link: {
    fontSize: 16,
    color: Constants.colors.grayText,
  },
  resetPasswordMessage: {
    fontSize: 16,
    lineHeight: 20,
    color: '#666',
  },
});

const updateUserAsync = async ({ user }) => {
  if (user.photo.isChanged) {
    // upload new avatar
    const uploadedFile = await Session.uploadFile({ uri: user.photo.url });
    if (uploadedFile?.fileId) {
      const result = await Session.apolloClient.mutate({
        mutation: gql`
          mutation($userId: ID!, $photoFileId: ID!) {
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
  const result = await Session.apolloClient.mutate({
    mutation: gql`
      mutation ($userId: ID!, $websiteUrl: String) {
       updateUser(
         userId: $userId
         user: {
           websiteUrl: $websiteUrl
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
  const { signOutAsync, userId: signedInUserId } = useSession();
  const insets = useSafeArea();
  const [user, changeUser] = React.useReducer(
    (user, changes) => ({
      ...user,
      ...changes,
    }),
    me
  );
  const [loading, setLoading] = useState(false);
  const [resetPassword, setResetPassword] = useState({
    sent: false,
    message: null,
  });

  const saveUserAndClose = React.useCallback(async () => {
    await setLoading(true);
    const updatedUser = await updateUserAsync({ user });
    if (updatedUser) {
      onClose();
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
  }, [setResetPassword, setLoading]);

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
          <TextInput
            value={user.username}
            editable={!loading}
            onChangeText={(username) => changeUser({ username })}
            style={Constants.styles.textInputOnWhite}
            placeholderTextColor={Constants.colors.grayText}
          />
        </View>
        <View style={styles.row}>
          <Text style={Constants.styles.textInputLabelOnWhite}>Link</Text>
          <TextInput
            value={user.websiteUrl}
            editable={!loading}
            onChangeText={(websiteUrl) => changeUser({ websiteUrl })}
            style={Constants.styles.textInputOnWhite}
            placeholder="http://geocities.com"
            placeholderTextColor={Constants.colors.grayText}
          />
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
      <View style={styles.links}>
        <TouchableOpacity onPress={signOutAsync}>
          <Text style={styles.link}>Log out</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://discord.gg/rQETB4H')}>
          <Text style={styles.link}>Discord</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://castle.xyz/terms')}>
          <Text style={styles.link}>Terms</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://castle.xyz/privacy_policy')}>
          <Text style={styles.link}>Privacy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Fragment>
      <BottomSheet
        snapPoints={[SHEET_HEIGHT]}
        isOpen={isOpen}
        renderHeader={renderHeader}
        renderContent={renderContent}
        onOpenEnd={Keyboard.dismiss}
        onCloseEnd={Keyboard.dismiss}
        style={{
          backgroundColor: '#fff',
          borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
          borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
          ...Constants.styles.dropShadowUp,
        }}
      />
    </Fragment>
  );
};
