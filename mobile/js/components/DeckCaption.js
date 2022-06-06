import * as React from 'react';
import { AppText as Text } from './AppText';
import { Pressable, StyleSheet } from 'react-native';
import { formatCaption } from '../common/chat-utilities';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  caption: {
    fontSize: 16,
  },
  tag: {
    fontSize: 16,
    color: Constants.colors.grayOnWhiteText,
  },
});

export const DeckCaption = ({ deck, style, onPressTag }) => {
  if (!deck?.caption) {
    return null;
  }
  const { caption } = deck;
  const items = formatCaption(caption);
  return (
    <Text style={[styles.caption, style]}>
      {items.map((item, ii) => {
        if (item.text) {
          return (
            <Text style={styles.caption} key={`caption-${ii}`}>
              {item.text}
            </Text>
          );
        } else if (item.tag) {
          return (
            <Text onPress={() => onPressTag(item.tag)} key={`tag-${ii}`} style={styles.tag}>
              #{item.tag}
            </Text>
          );
        }
      })}
    </Text>
  );
};
