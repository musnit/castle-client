import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Response as InspectorResponse } from './Response';
import { Trigger as InspectorTrigger } from './Trigger';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  rule: {},
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
    <View style={styles.rule}>
      <InspectorTrigger
        trigger={rule.trigger}
        behaviors={behaviors}
        addChildSheet={addChildSheet}
        triggers={triggers}
        onChangeTrigger={onChangeTrigger}
      />
      <View style={SceneCreatorConstants.styles.insetContainer}>
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
    </View>
  );
};
