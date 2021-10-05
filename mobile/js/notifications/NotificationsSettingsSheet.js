import React, { Fragment, useState } from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
  NativeModules,
  Alert,
} from 'react-native';

import { gql } from '@apollo/client';
import Viewport from '../common/viewport';

import { BottomSheetHeader } from '../components/BottomSheetHeader';
import { BottomSheet } from '../components/BottomSheet';
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
  heading: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  row: {
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  description: {
    flexShrink: 1,
  },
  toggle: {
    flexShrink: 0,
    paddingLeft: 16,
  },
});

const DUMMY_SETTINGS = [
  {
    type: 'comment_deck',
    description: 'When somone comments on a deck I created',
    notify: 'all',
  },
  {
    type: 'comment_reply',
    description: 'When someone replies to my comment',
    notify: 'all',
  },
  {
    type: 'follow',
    description: 'When someone follows me',
    notify: 'all',
  },
  {
    type: 'new_deck',
    description: 'When someone I follow posts a new deck',
    notify: 'all',
  },
  {
    type: 'play_deck',
    description: 'When someone plays a deck I created',
    notify: 'none',
  },
  {
    type: 'react_deck',
    description: 'When someone reacts to a deck I created',
    notify: 'all',
  },
];

export const NotificationsSettingsSheet = ({ me = {}, isOpen, onClose }) => {
  if (Platform.OS === 'android') {
    const { navigatorWindowHeight } = React.useContext(AndroidNavigationContext);
    SHEET_HEIGHT = navigatorWindowHeight - 100;
  }

  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setLoading(false);
      // changeUser(me);
      // TODO: load initial state
    }
  }, [isOpen]);

  const renderHeader = () => (
    <BottomSheetHeader title="Settings" onClose={onClose} loading={loading} />
  );

  const renderContent = () => (
    <View style={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}>
      <View style={[styles.section]}>
        <Text style={styles.heading}>Send a push notification...</Text>
        {!isOpen
          ? null
          : DUMMY_SETTINGS.map((setting) => (
              <View style={styles.row}>
                <Text style={styles.description}>{setting.description}</Text>
                <View style={styles.toggle}>
                  <Switch value={setting.notify === 'all'} onValueChange={() => {}} />
                </View>
              </View>
            ))}
      </View>
    </View>
  );

  return (
    <BottomSheet
      snapPoints={[SHEET_HEIGHT]}
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
