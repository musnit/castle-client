import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useCoreState } from '../../core/CoreEvents';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  body: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingTop: 5,
    paddingHorizontal: 9,
    paddingBottom: 7,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
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
  },
});

const typeLabels = {
  undo: 'undid',
  redo: 'redid',
  alert: 'notice',
};

export const CommandsOverlay = ({ visible }) => {
  const { type, message } = useCoreState('EDITOR_COMMAND_NOTIFY') || {};
  if (!type?.length) return null;
  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.body}>
        <Text style={styles.messageLabel}>
          <Text style={styles.typeLabel}>{typeLabels[type] ?? 'notice'}</Text> {message}
        </Text>
      </View>
    </View>
  );
};
