import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Response as InspectorResponse } from './Response';
import { Trigger as InspectorTrigger } from './Trigger';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';
import * as Constants from '../../../Constants';

const styles = StyleSheet.create({
  rule: {
    paddingTop: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderColor: Constants.colors.grayOnWhiteBorder,
    borderTopWidth: 1,
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
  onCopyRule,
  onRemoveRule,
  sendRuleAction,
}) => {
  const onChangeTrigger = React.useCallback(
    (trigger) => {
      return onChangeRule({
        ...rule,
        trigger,
      });
    },
    [onChangeRule]
  );

  const onChangeResponse = React.useCallback(
    (response) => {
      return onChangeRule({
        ...rule,
        response,
      });
    },
    [onChangeRule]
  );

  return (
    <View style={styles.rule}>
      <InspectorTrigger
        trigger={rule.trigger}
        behaviors={behaviors}
        addChildSheet={addChildSheet}
        triggers={triggers}
        onChangeTrigger={onChangeTrigger}
        onRemoveRule={onRemoveRule}
        onCopyRule={onCopyRule}
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
          sendRuleAction={sendRuleAction}
        />
      </View>
    </View>
  );
};
