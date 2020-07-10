import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ConfigureRuleEntry } from './ConfigureRuleEntry';
import { getEntryByName } from '../InspectorUtilities';
import { makeResponseActions } from './ResponseActions';
import { Responses } from './Responses';
import { useActionSheet } from '@expo/react-native-action-sheet';

import RuleOptionsSheet from './RuleOptionsSheet';
import RulePartPickerSheet from './RulePartPickerSheet';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  ruleName: {
    fontSize: 16,
  },
  response: {},
  nextResponse: {
    marginTop: 16,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  responseCells: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

const RESPONSE_CATEGORY_ORDER = ['general', 'interaction', 'logic', 'state', 'visible'];
const CONDITION_CATEGORY_ORDER = ['state', 'collision', 'random'];

const _entryToResponse = (entry) => ({
  name: entry.name,
  behaviorId: entry.behaviorId,
  params: entry.initialParams ?? {},
});

const If = ({ response, onChangeResponse, children, order, ...props }) => {
  const { addChildSheet, behaviors, conditions, context } = props;

  const onChangeCondition = (condition) =>
    onChangeResponse({
      ...response,
      params: {
        ...response.params,
        condition,
      },
    });

  const onChangeThen = (then) =>
    onChangeResponse({
      ...response,
      params: {
        ...response.params,
        then,
      },
    });

  const onChangeElse = (elseResponse) =>
    onChangeResponse({
      ...response,
      params: {
        ...response.params,
        else: elseResponse,
      },
    });

  const onRemoveElse = () => {
    const newParams = { ...response.params };
    delete newParams.else;
    onChangeResponse({
      ...response,
      params: {
        ...newParams,
      },
    });
  };

  const onPickCondition = (handler) =>
    addChildSheet({
      key: 'rulePartPicker',
      Component: RulePartPickerSheet,
      behaviors,
      entries: conditions,
      onSelectEntry: (entry) => handler(_entryToResponse(entry)),
      title: 'Select condition',
      categoryOrder: CONDITION_CATEGORY_ORDER,
    });

  const onChangeParams = (params) =>
    onChangeResponse({
      ...response,
      params: {
        ...response.params,
        condition: {
          ...response.params.condition,
          params: {
            ...response.params.condition.params,
            ...params,
          },
        },
      },
    });

  return (
    <React.Fragment>
      <View style={[styles.response, order > 0 ? styles.nextResponse : null]}>
        <View style={styles.responseCells}>
          {children}
          <ConfigureRuleEntry
            entry={getEntryByName(response.params.condition?.name, conditions)}
            cells={makeResponseCells({ response: response.params.condition, context })}
            onChangeEntry={onChangeCondition}
            onShowPicker={onPickCondition}
            onChangeParams={onChangeParams}
            addChildSheet={addChildSheet}
          />
        </View>
        <View style={SceneCreatorConstants.styles.insetContainer}>
          <Response response={response.params.then} onChangeResponse={onChangeThen} {...props} />
        </View>
        <View style={{ paddingTop: 16 }}>
          <Else
            response={response.params.else}
            onChangeResponse={onChangeElse}
            onRemoveElse={onRemoveElse}
            {...props}
          />
        </View>
      </View>
    </React.Fragment>
  );
};

const Else = ({ response, onChangeResponse, onRemoveElse, ...props }) => {
  // TODO: a real sheet here?
  const { showActionSheetWithOptions } = useActionSheet();
  const maybeRemoveElse = () =>
    showActionSheetWithOptions(
      { options: [`Remove 'else'`, 'Cancel'], destructiveButtonIndex: 0, cancelButtonIndex: 1 },
      (index) => {
        if (index === 0) {
          onRemoveElse();
        }
      }
    );

  if (!response) {
    return (
      <View style={styles.responseCells}>
        <TouchableOpacity
          style={SceneCreatorConstants.styles.button}
          onPress={() => onChangeResponse({ name: 'none' })}>
          <Text style={SceneCreatorConstants.styles.buttonLabel}>Add else</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <React.Fragment>
      <View style={styles.responseCells}>
        <TouchableOpacity style={SceneCreatorConstants.styles.button} onPress={maybeRemoveElse}>
          <Text style={SceneCreatorConstants.styles.buttonLabel}>Else</Text>
        </TouchableOpacity>
      </View>
      <View style={SceneCreatorConstants.styles.insetContainer}>
        <Response response={response} onChangeResponse={onChangeResponse} {...props} />
      </View>
    </React.Fragment>
  );
};

const Repeat = ({ response, onChangeResponse, children, order, ...props }) => {
  const onChangeBody = (body) =>
    onChangeResponse({
      ...response,
      params: {
        ...response.params,
        body,
      },
    });
  return (
    <View style={[styles.response, order > 0 ? styles.nextResponse : null]}>
      <View style={styles.responseCells}>{children}</View>
      <View style={SceneCreatorConstants.styles.insetContainer}>
        <Response response={response.params.body} onChangeResponse={onChangeBody} {...props} />
      </View>
    </View>
  );
};

const ActOn = ({ response, onChangeResponse, children, order, ...props }) => {
  const onChangeBody = (body) =>
    onChangeResponse({
      ...response,
      params: {
        ...response.params,
        body,
      },
    });
  return (
    <View style={[styles.response, order > 0 ? styles.nextResponse : null]}>
      <View style={styles.responseCells}>{children}</View>
      <View style={SceneCreatorConstants.styles.insetContainer}>
        <Response response={response.params.body} onChangeResponse={onChangeBody} {...props} />
      </View>
    </View>
  );
};

const RESPONSE_COMPONENTS = {
  if: If,
  repeat: Repeat,
  ['act on other']: ActOn,
  ['act on']: ActOn,
};

const makeResponseCells = ({ response, order, context }) => {
  if (!response || response.name === 'none') {
    return Responses.empty({ order });
  } else if (Responses[response.name]) {
    return Responses[response.name]({ response, order, context });
  } else {
    return Responses.default({ response, order, context });
  }
};

export const Response = ({ response, onChangeResponse, order = 0, ...props }) => {
  const { context, addChildSheet, behaviors, responses, conditions, triggerFilter } = props;
  const entry = getEntryByName(response?.name, responses);

  const onShowResponsePicker = (handler) =>
    addChildSheet({
      key: 'rulePartPicker',
      Component: RulePartPickerSheet,
      behaviors,
      entries: responses,
      triggerFilter,
      onSelectEntry: (entry) => handler(_entryToResponse(entry)),
      title: 'Select response',
      categoryOrder: RESPONSE_CATEGORY_ORDER,
    });

  const onChangeParams = (params) =>
    onChangeResponse({
      ...response,
      params: {
        ...response.params,
        ...params,
      },
    });

  const onShowResponseOptions = () =>
    addChildSheet({
      key: 'ruleOptions',
      Component: RuleOptionsSheet,
      onShowPicker: onShowResponsePicker,
      actions: makeResponseActions(response, onChangeResponse),
      entry,
    });

  // render the cells to configure this response
  let responseContents;
  let cells = makeResponseCells({ response, order, context });
  responseContents = (
    <View style={styles.responseCells}>
      <ConfigureRuleEntry
        entry={entry}
        cells={cells}
        onChangeEntry={onChangeResponse}
        onShowPicker={onShowResponsePicker}
        onShowOptions={onShowResponseOptions}
        onChangeParams={onChangeParams}
        addChildSheet={addChildSheet}
      />
    </View>
  );

  // if applicable, render a wrapper component around the cells
  if (response && RESPONSE_COMPONENTS[response.name]) {
    const ResponseComponent = RESPONSE_COMPONENTS[response.name];
    responseContents = (
      <ResponseComponent
        response={response}
        onChangeResponse={onChangeResponse}
        order={order}
        {...props}>
        {responseContents}
      </ResponseComponent>
    );
  } else {
    responseContents = (
      <View style={[styles.response, order > 0 ? styles.nextResponse : null]}>
        {responseContents}
      </View>
    );
  }

  const onChangeNextResponse = (nextResponse) =>
    onChangeResponse({
      ...response,
      params: {
        ...response.params,
        nextResponse,
      },
    });

  const hideNextResponse = !response || (response.name === 'none' && !response.params);
  return (
    <React.Fragment>
      {responseContents}
      {!hideNextResponse && (
        <Response
          response={response.params?.nextResponse}
          onChangeResponse={onChangeNextResponse}
          order={order + 1}
          {...props}
        />
      )}
    </React.Fragment>
  );
};
