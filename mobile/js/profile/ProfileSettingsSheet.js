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

const ProfileSettingsPasswordSheet = ({ isOpen, onClose }) => {
  const renderHeader = () => (
    <BottomSheetHeader
      title="Edit password"
      onClose={onClose}
      onDone={() => console.log('Hi Ben')}
    />
  );

  const renderContent = () => (
    <View>
      <View style={[styles.section]}>
        <View style={styles.row}>
          <Text style={Constants.styles.textInputLabelOnWhite}>Current password</Text>
          <TextInput style={Constants.styles.textInputOnWhite} />
        </View>
        <View style={styles.row}>
          <Text style={Constants.styles.textInputLabelOnWhite}>New password</Text>
          <TextInput style={Constants.styles.textInputOnWhite} />
        </View>
        <View style={styles.row}>
          <Text style={Constants.styles.textInputLabelOnWhite}>New password, again</Text>
          <TextInput style={Constants.styles.textInputOnWhite} />
        </View>
      </View>
    </View>
  );

  return (
    <BottomSheet
      snapPoints={[500]}
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
      style={{
        backgroundColor: '#fff',
        borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
        borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
        ...Constants.styles.dropShadowUp,
      }}
    />
  );
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

  const saveUserAndClose = React.useCallback(async () => {
    const updatedUser = await updateUserAsync({ user });
    if (updatedUser) {
      onClose();
    }
  }, [user, onClose]);

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

  const renderHeader = () => (
    <BottomSheetHeader title="Settings" onClose={onClose} onDone={saveUserAndClose} />
  );

  const [passwordSheetIsOpen, setPasswordSheet] = useState(false);
  const onPressPassword = () => {
    setPasswordSheet(true);
  };
  const passwordSheetOnClose = () => {
    setPasswordSheet(false);
  };

  const renderContent = () => (
    <View style={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}>
      <View style={[styles.section]}>
        <View style={[styles.row, styles.avatarRow]}>
          <View style={styles.avatar}>
            <UserAvatar url={user.photo?.url} />
          </View>
          <TouchableOpacity style={Constants.styles.buttonOnWhite} onPress={chooseAvatar}>
            <Text style={Constants.styles.buttonLabelOnWhite}>Edit avatar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <Text style={Constants.styles.textInputLabelOnWhite}>Username</Text>
          <TextInput
            value={user.username}
            onChangeText={(username) => changeUser({ username })}
            style={Constants.styles.textInputOnWhite}
            placeholderTextColor={Constants.colors.grayText}
          />
        </View>
        <View style={styles.row}>
          <Text style={Constants.styles.textInputLabelOnWhite}>Link</Text>
          <TextInput
            value={user.websiteUrl}
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
            <TouchableOpacity onPress={onPressPassword} style={Constants.styles.buttonOnWhite}>
              <Text style={Constants.styles.buttonLabelOnWhite}>Edit password</Text>
            </TouchableOpacity>
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
      <ProfileSettingsPasswordSheet isOpen={passwordSheetIsOpen} onClose={passwordSheetOnClose} />
    </Fragment>
  );
};
