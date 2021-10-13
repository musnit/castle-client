import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Response as InspectorResponse } from './Response';
import { Trigger as InspectorTrigger } from './Trigger';

import * as Constants from '../../../Constants';

const styles = StyleSheet.create({
  trigger: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnWhiteBorder,
  },
  arrowWrapper: {
    position: 'absolute',
    bottom: -19,
    left: 16,
    padding: 10,
    backgroundColor: '#fff',
    transform: [{ rotate: '-90deg' }],
  },
  response: {
    padding: 16,
    paddingTop: 20,
  },
});

export const Rule = ({
  rule,
  behaviors,
  triggers,
  responses,
  conditions,
  addChildSheet,
  onChangeRule,
}) => {
  const onChangeTrigger = React.useCallback(
    (trigger) => {
      return onChangeRule({
        ...rule,
        trigger,
      });
    },
    [onChangeRule, rule]
  );

  const onChangeResponse = React.useCallback(
    (response) => {
      return onChangeRule({
        ...rule,
        response,
      });
    },
    [onChangeRule, rule]
  );

  return (
    <>
      <View style={styles.trigger}>
        <InspectorTrigger
          trigger={rule.trigger}
          behaviors={behaviors}
          addChildSheet={addChildSheet}
          triggers={triggers}
          onChangeTrigger={onChangeTrigger}
        />
        <View style={styles.arrowWrapper}>
          <Constants.CastleIcon name="back" size={18} color="#000" />
        </View>
      </View>
      <View style={styles.response}>
        <InspectorResponse
          response={rule.response}
          triggerFilter={rule.trigger?.name}
          behaviors={behaviors}
          addChildSheet={addChildSheet}
          responses={responses}
          conditions={conditions}
          onChangeResponse={onChangeResponse}
        />
      </View>
    </>
  );
};
