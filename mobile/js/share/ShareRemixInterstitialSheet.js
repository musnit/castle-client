import * as React from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { BottomSheet } from '../components/BottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CastleIcon } from '../Constants';
import Viewport from '../common/viewport';

import * as Constants from '../Constants';
import * as SceneCreatorConstants from '../scenecreator/SceneCreatorConstants';

let SHEET_HEIGHT = 50 * Viewport.vh;

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
    borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
    ...Constants.styles.dropShadowUp,
  },
  content: {
    padding: 16,
    paddingTop: 64,
    alignItems: 'center',
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  creator: {
    fontWeight: 'bold',
  },
  message: {
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: {
    marginTop: 24,
    marginBottom: 16,
    flexDirection: 'row',
  },
  learnMore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  learnMoreLabel: {
    color: Constants.colors.grayOnWhiteText,
    fontSize: 16,
    marginRight: 4,
  },
});

const ShareRemixInterstitial = ({ deck, onConfirm, onCancel }) => {
  const insets = useSafeAreaInsets();
  const openRemixWiki = React.useCallback(
    () => Linking.openURL('https://wiki.castle.xyz/Remix'),
    []
  );
  return (
    <View style={[styles.content, { paddingBottom: insets.bottom }]}>
      <FastImage
        style={{ width: 36, height: 36, marginBottom: 12, marginRight: 12 }}
        source={require('../../assets/images/emoji/key-black.png')}
      />
      <Text style={styles.heading}>You're publishing a remix!</Text>
      <Text style={styles.message}>
        Just so you know, <Text style={styles.creator}>@{deck.parentDeck?.creator?.username}</Text>{' '}
        will be credited underneath your deck and will receive a notification about your remix of
        their deck.
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onCancel}
          style={[SceneCreatorConstants.styles.button, { marginRight: 12 }]}>
          <Text style={SceneCreatorConstants.styles.buttonLabel}>Go back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onConfirm} style={SceneCreatorConstants.styles.button}>
          <Text style={SceneCreatorConstants.styles.buttonLabel}>Save and publish</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={openRemixWiki} style={styles.learnMore}>
        <Text style={styles.learnMoreLabel}>Learn more about remixing</Text>
        <CastleIcon
          name="back"
          style={{ marginLeft: 2, transform: [{ scaleX: -1 }] }}
          color={Constants.colors.grayOnWhiteText}
          size={13}
        />
      </TouchableOpacity>
    </View>
  );
};

export const ShareRemixInterstitialSheet = ({ deck, isOpen, onClose, onConfirm }) => {
  const renderHeader = () => null;
  const renderContent = () => (
    <ShareRemixInterstitial deck={deck} onConfirm={onConfirm} onCancel={onClose} />
  );
  return (
    <BottomSheet
      snapPoints={[SHEET_HEIGHT]}
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
      onClose={onClose}
      style={styles.sheetContainer}
    />
  );
};
