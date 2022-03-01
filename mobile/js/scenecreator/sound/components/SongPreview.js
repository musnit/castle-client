import React from 'react';
import { StyleSheet, View } from 'react-native';
import { InstrumentIcon } from './InstrumentIcon';

import tinycolor from 'tinycolor2';

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
  },
  trackRow: {
    flexDirection: 'row',
    borderBottomColor: '#000',
    alignItems: 'center',
    paddingVertical: 4,
  },
  instrumentIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sequenceElem: {
    width: 22,
    height: '100%',
    marginRight: 4,
    borderRadius: 2,
    backgroundColor: '#000',
  },
});

const PREVIEW_MAX_SEQ_ELEMS = 6;
const PREVIEW_MAX_TRACKS = 6;

const patternColorToHex = (value) => {
  const r255 = 255 * value.r;
  const g255 = 255 * value.g;
  const b255 = 255 * value.b;
  const valueStr = `rgb(${r255}, ${g255}, ${b255})`;
  return '#' + tinycolor(valueStr).toHex();
};

export const SongPreview = ({ song }) => {
  if (!song?.tracks?.length) {
    return null;
  }
  return (
    <View style={styles.container}>
      {song.tracks.slice(0, PREVIEW_MAX_TRACKS).map((track, ti) => {
        const sequenceKeys = Object.keys(track.sequence)
          .sort((a, b) => parseFloat(a) - parseFloat(b))
          .slice(0, PREVIEW_MAX_SEQ_ELEMS);
        return (
          <View key={`track-${ti}`} style={styles.trackRow}>
            <View style={styles.instrumentIcon}>
              <InstrumentIcon instrument={track.instrument} size={18} color="#000" />
            </View>
            {sequenceKeys.map((seqTime, ei) => {
              const seqElem = track.sequence[seqTime];
              const patternColor = song.patterns[seqElem.patternId].color;
              return (
                <View
                  key={`sequence-elem-${ei}`}
                  style={[
                    styles.sequenceElem,
                    { backgroundColor: patternColorToHex(patternColor) },
                  ]}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
};
