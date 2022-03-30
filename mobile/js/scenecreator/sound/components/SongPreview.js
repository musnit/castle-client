import React from 'react';
import { StyleSheet, View } from 'react-native';
import { InstrumentIcon } from './InstrumentIcon';
import * as Constants from '../../../Constants';

import tinycolor from 'tinycolor2';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    ...Constants.styles.dropShadow,
    padding: 4,
  },
  wrapper: {
    backgroundColor: '#0001',
    padding: 2,
    paddingRight: 0,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  instrumentIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 3,
    marginRight: 6,
    // borderWidth: 1,
    borderColor: '#000',
  },
  sequenceElem: {
    width: 30,
    height: '100%',
    marginRight: 4,
    borderRadius: 3,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#0005',
  },
});

const PREVIEW_MAX_SEQ_ELEMS = 6;
const PREVIEW_MAX_TRACKS = 6;

const patternColorToHex = (value) => {
  if (!value) return value;

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
      <View style={styles.wrapper}>
        {song.tracks.slice(0, PREVIEW_MAX_TRACKS).map((track, ti) => {
          const sequenceKeys = Object.keys(track.sequence)
            .sort((a, b) => parseFloat(a) - parseFloat(b))
            .slice(0, PREVIEW_MAX_SEQ_ELEMS);
          return (
            <View key={`track-${ti}`} style={styles.trackRow}>
              <View style={styles.instrumentIcon}>
                <InstrumentIcon instrument={track.instrument} size={14} color="#555" />
              </View>
              {sequenceKeys.map((seqTime, ei) => {
                const seqElem = track.sequence[seqTime];
                if (seqElem) {
                  const patternColor = song.patterns[seqElem.patternId]?.color;
                  return (
                    <View
                      key={`sequence-elem-${ei}`}
                      style={[
                        styles.sequenceElem,
                        { backgroundColor: patternColorToHex(patternColor) },
                      ]}
                    />
                  );
                } else {
                  return null;
                }
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
};
