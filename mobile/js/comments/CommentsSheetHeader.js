import * as React from 'react';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { useNavigation } from '../ReactNavigation';
import { UserAvatar } from '../components/UserAvatar';

import * as Constants from '../Constants';
import * as SceneCreatorConstants from '../scenecreator/SceneCreatorConstants';

const CastleIcon = Constants.CastleIcon;
const ICON_SIZE = 34;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    flexShrink: 1,
    paddingLeft: 16,
  },
  creator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  username: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
  },
  back: {
    flexShrink: 0,
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 16,
  },
});

export const CommentsSheetHeader = ({ deck, onClose }) => {
  const { push, navigate } = useNavigation();
  const { creator } = deck;
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft} pointerEvents="box-none">
        <Pressable
          style={styles.creator}
          onPress={() => push('Profile', { userId: creator.userId })}>
          <View style={styles.avatar}>
            <UserAvatar url={creator.photo?.url} />
          </View>
          <Text style={styles.username}>{creator.username}</Text>
        </Pressable>
      </View>
      <TouchableOpacity style={styles.back} onPress={onClose}>
        <CastleIcon name="close" size={22} color="#000" />
      </TouchableOpacity>
    </View>
  );
};
