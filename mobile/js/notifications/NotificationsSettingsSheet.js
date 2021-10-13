import React from 'react';
import { StyleSheet, Switch, Text, View, Platform } from 'react-native';

import { gql, useLazyQuery, useMutation } from '@apollo/client';
import { AndroidNavigationContext } from '../ReactNavigation';
import { BottomSheetHeader } from '../components/BottomSheetHeader';
import { BottomSheet } from '../components/BottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Constants from '../Constants';

import Viewport from '../common/viewport';

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

export const NotificationsSettingsSheet = ({ me = {}, isOpen, onClose }) => {
  if (Platform.OS === 'android') {
    const { navigatorWindowHeight } = React.useContext(AndroidNavigationContext);
    SHEET_HEIGHT = navigatorWindowHeight - 100;
  }

  const insets = useSafeAreaInsets();

  const [preferences, changePreferences] = React.useReducer((preferences, action) => {
    if (action.action === 'set') {
      return action.preferences;
    } else if (action.action === 'update') {
      const { type, status } = action;
      return preferences.map((p) => (p.type === type ? { ...p, status } : p));
    } else if (action.action === 'reset') {
      return null;
    }
    return preferences;
  }, null);

  const [getNotificationPreferences, query] = useLazyQuery(
    gql`
      query {
        notificationPreferences {
          type
          description
          status
        }
      }
    `
  );

  const [updateNotificationPreference] = useMutation(
    gql`
      mutation UpdateNotificationPreference(
        $type: String!
        $status: NotificationPreferenceStatus!
      ) {
        updateNotificationPreference(type: $type, status: $status) {
          status
        }
      }
    `
  );

  React.useEffect(() => {
    if (isOpen) {
      getNotificationPreferences({ fetchPolicy: 'no-cache' });
    }
  }, [isOpen, getNotificationPreferences]);

  React.useEffect(() => {
    if (query.called && !query.loading) {
      if (query.data) {
        changePreferences({ action: 'set', preferences: query.data.notificationPreferences });
      } else {
        changePreferences({ action: 'reset' });
      }
    }
  }, [query.called, query.loading, query.error, query.data, changePreferences]);

  const onChangePreference = React.useCallback(
    ({ type, status }) => {
      // optimistically change UI
      changePreferences({ action: 'update', type, status });

      // set on server
      updateNotificationPreference({
        variables: { type, status },
      });
    },
    [changePreferences, updateNotificationPreference]
  );

  const renderHeader = () => <BottomSheetHeader title="Settings" onClose={onClose} />;

  const renderContent = () => (
    <View style={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}>
      <View style={[styles.section]}>
        <Text style={styles.heading}>Send me push notifications for...</Text>
        {!isOpen || !preferences?.length
          ? null
          : preferences.map((setting) => (
              <View style={styles.row} key={setting.type}>
                <Text style={styles.description}>{setting.description}</Text>
                <View style={styles.toggle}>
                  <Switch
                    value={setting.status === 'enabled'}
                    onValueChange={(enabled) =>
                      onChangePreference({
                        type: setting.type,
                        status: enabled ? 'enabled' : 'disabled',
                      })
                    }
                  />
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
