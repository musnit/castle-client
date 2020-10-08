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

import * as Constants from '../Constants';
import * as Session from '../Session';
import * as Utilities from '../common/utilities';

const SHEET_HEIGHT = 320;
const TAB_BAR_HEIGHT = 49;

const styles = StyleSheet.create({
  section: {
    paddingTop: 16,
    paddingBottom: 4,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnWhiteBorder,
  },
  row: {
    paddingBottom: 16,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemName: {
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 16,
  },
  itemDescription: {
    fontSize: 16,
  },
});

export const DeckVisibilitySheet = ({ deck, isOpen, onClose, onChangeVisibility }) => {
  const insets = useSafeArea();

  const [loading, setLoading] = useState(false);

  const changeVisibilityAndClose = React.useCallback(
    async (visibility) => {
      await setLoading(true);
      await onChangeVisibility(visibility);
      onClose();
      setLoading(false);
    },
    [deck, onClose, setLoading]
  );

  const renderHeader = () => (
    <BottomSheetHeader title="Edit visibility" onClose={onClose} loading={loading} />
  );

  const renderContent = () => (
    <View style={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}>
      <TouchableOpacity style={styles.item} onPress={() => changeVisibilityAndClose('public')}>
        <Text style={styles.itemName}>Public</Text>
        <Text style={styles.itemDescription}>Anyone can find and view</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => changeVisibilityAndClose('unlisted')}>
        <Text style={styles.itemName}>Unlisted</Text>
        <Text style={styles.itemDescription}>Anyone with the link can view</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.item, { borderBottomWidth: 0 }]}
        onPress={() => changeVisibilityAndClose('private')}>
        <Text style={styles.itemName}>Private</Text>
        <Text style={styles.itemDescription}>Only visible to you</Text>
      </TouchableOpacity>
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
      style={{
        backgroundColor: '#fff',
        borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
        borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
        ...Constants.styles.dropShadowUp,
      }}
    />
  );
};
