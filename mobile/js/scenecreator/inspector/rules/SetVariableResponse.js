import React from 'react';
import { StyleSheet, View } from 'react-native';
import { InspectorCheckbox } from '../components/InspectorCheckbox';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  relativeRow: {
    ...SceneCreatorConstants.styles.button,
    marginTop: 12,
  },
});

export const SetVariableResponse = ({ response, onChangeResponse, children, ...props }) => {
  const onChangeRelative = React.useCallback(
    (relative) => {
      onChangeResponse({
        ...response,
        params: {
          ...response.params,
          relative,
        },
      });
    },
    [response, onChangeResponse]
  );

  return (
    <View>
      {children}
      <View style={styles.relativeRow}>
        <InspectorCheckbox
          label="Relative to current value"
          value={response.params.relative}
          onChange={onChangeRelative}
        />
      </View>
    </View>
  );
};
