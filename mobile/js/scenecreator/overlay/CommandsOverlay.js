import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useCoreState } from '../../core/CoreEvents';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingTop: 96,
  },
  body: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#fff',
  },
  messageLabel: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 24,
  },
});

export const CommandsOverlay = () => {
  const { type, message } = useCoreState('EDITOR_COMMAND_NOTIFY') || {};
  if (!type?.length) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.body}>
        <Text style={styles.messageLabel}>
          <Text style={styles.typeLabel}>{type === 'undo' ? 'undid' : 'redid'}:</Text> {message}
        </Text>
      </View>
    </View>
  );
};
