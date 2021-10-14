import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import * as SceneCreatorConstants from '../scenecreator/SceneCreatorConstants';
import { CastleIcon } from '../Constants';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  back: {
    flexShrink: 0,
    width: 60,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 16,
  },
  done: {
    ...SceneCreatorConstants.styles.button,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    width: 60,
  },
  doneText: {
    fontSize: 16,
  },
  headingContainer: {
    width: '100%',
    height: '100%',
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerHeading: {
    zIndex: -1, // required to prevent negative margin from blocking back button
    marginLeft: -54, // required to center properly with back button
  },
  headingLabel: {
    color: '#000',
    textTransform: 'uppercase',
    fontSize: 14,
    letterSpacing: 0.5,
    fontWeight: 'bold',
    width: '100%',
    textAlign: 'center',
  },
});

export const BottomSheetHeader = ({
  title,
  onClose,
  onDone,
  doneLabel,
  renderActions,
  loading,
  closeable = true,
}) => (
  <View style={styles.header}>
    {closeable ? (
      <TouchableOpacity style={styles.back} onPress={onClose}>
        <CastleIcon name="close" size={22} color="#000" />
      </TouchableOpacity>
    ) : (
      <View style={styles.back} />
    )}
    <View style={[styles.headingContainer, onDone || renderActions ? null : styles.centerHeading]}>
      <Text style={styles.headingLabel}>{title}</Text>
    </View>
    {renderActions ? renderActions() : null}
    {onDone ? (
      <TouchableOpacity style={styles.done} onPress={onDone} disabled={loading}>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.doneText}>{doneLabel ?? 'Done'}</Text>
        )}
      </TouchableOpacity>
    ) : null}
  </View>
);
