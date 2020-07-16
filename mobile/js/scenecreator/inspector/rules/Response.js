import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCardCreator } from '../../CreateCardContext';
import { BehaviorPropertyRule } from './BehaviorPropertyRule';
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

const RESPONSE_CATEGORY_ORDER = [
  'general',
  'interaction',
  'logic',
  'state',
  'visible',
  'Dynamic Motion',
];
const CONDITION_CATEGORY_ORDER = ['state', 'collision', 'random'];

const _entryToResponse = (entry) => ({
  name: entry.name,
  behaviorId: entry.behaviorId,
  params: entry.initialParams ?? {},
});

const If = ({ response, onChangeResponse, children, order, ...props }) => {
  const { addChildSheet, behaviors, conditions, context } = props;

  const onChangeCondition = React.useCallback(
    (condition) =>
      onChangeResponse({
        ...response,
        params: {
          ...response.params,
          condition,
        },
      }),
    [response, onChangeResponse]
  );

  const onChangeThen = React.useCallback(
    (then) =>
      onChangeResponse({
        ...response,
        params: {
          ...response.params,
          then,
        },
      }),
    [response, onChangeResponse]
  );

  const onChangeElse = React.useCallback(
    (elseResponse) =>
      onChangeResponse({
        ...response,
        params: {
          ...response.params,
          else: elseResponse,
        },
      }),
    [response, onChangeResponse]
  );

  const onRemoveElse = React.useCallback(() => {
    const newParams = { ...response.params };
    delete newParams.else;
    onChangeResponse({
      ...response,
      params: {
        ...newParams,
      },
    });
  }, [response, onChangeResponse]);

  const onPickCondition = React.useCallback(
    (handler) =>
      addChildSheet({
        key: 'rulePartPicker',
        Component: RulePartPickerSheet,
        behaviors,
        entries: conditions,
        onSelectEntry: (entry) => handler(_entryToResponse(entry)),
        title: 'Select condition',
        categoryOrder: CONDITION_CATEGORY_ORDER,
      }),
    [behaviors, conditions, addChildSheet]
  );

  const onChangeParams = React.useCallback(
    (params) =>
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
      }),
    [response, onChangeResponse]
  );

  return (
    <React.Fragment>
      <View style={styles.responseCells}>
        {children}
        <ConfigureRuleEntry
          entry={getEntryByName(response.params.condition?.name, conditions)}
          cells={makeResponseCells({
            response: response.params.condition,
            context,
            isCondition: true,
          })}
          behaviors={behaviors}
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
    </React.Fragment>
  );
};

const Else = ({ response, onChangeResponse, onRemoveElse, ...props }) => {
  // TODO: a real sheet here?
  const { showActionSheetWithOptions } = useActionSheet();
  const maybeRemoveElse = React.useCallback(
    () =>
      showActionSheetWithOptions(
        { options: [`Remove 'else'`, 'Cancel'], destructiveButtonIndex: 0, cancelButtonIndex: 1 },
        (index) => {
          if (index === 0) {
            onRemoveElse();
          }
        }
      ),
    [showActionSheetWithOptions, onRemoveElse]
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
  const onChangeBody = React.useCallback(
    (body) =>
      onChangeResponse({
        ...response,
        params: {
          ...response.params,
          body,
        },
      }),
    [response, onChangeResponse]
  );
  return (
    <React.Fragment>
      <View style={styles.responseCells}>{children}</View>
      <View style={SceneCreatorConstants.styles.insetContainer}>
        <Response response={response.params.body} onChangeResponse={onChangeBody} {...props} />
      </View>
    </React.Fragment>
  );
};

const ActOn = ({ response, onChangeResponse, children, order, ...props }) => {
  const onChangeBody = React.useCallback(
    (body) =>
      onChangeResponse({
        ...response,
        params: {
          ...response.params,
          body,
        },
      }),
    [response, onChangeResponse]
  );
  return (
    <React.Fragment>
      <View style={styles.responseCells}>{children}</View>
      <View style={SceneCreatorConstants.styles.insetContainer}>
        <Response
          response={response.params.body}
          onChangeResponse={onChangeBody}
          useAllBehaviors
          {...props}
        />
      </View>
    </React.Fragment>
  );
};

const RESPONSE_COMPONENTS = {
  if: If,
  repeat: Repeat,
  ['act on other']: ActOn,
  ['act on']: ActOn,
  ['set behavior property']: BehaviorPropertyRule,
  ['change behavior property']: BehaviorPropertyRule,
};

const makeResponseCells = (props) => {
  const { response } = props;
  if (!response || response.name === 'none') {
    return Responses.empty(props);
  } else if (Responses[response.name]) {
    return Responses[response.name](props);
  } else {
    return Responses.default(props);
  }
};

const Response = ({ response, onChangeResponse, order = 0, ...props }) => {
  const { context, addChildSheet, behaviors, responses, conditions, triggerFilter } = props;
  const entry = getEntryByName(response?.name, responses);

  const onShowResponsePicker = React.useCallback(
    (handler) =>
      addChildSheet({
        key: 'rulePartPicker',
        Component: RulePartPickerSheet,
        behaviors: props.useAllBehaviors ? null : behaviors,
        entries: responses,
        triggerFilter,
        onSelectEntry: (entry) => handler(_entryToResponse(entry)),
        title: 'Select response',
        categoryOrder: RESPONSE_CATEGORY_ORDER,
      }),
    [addChildSheet, behaviors, response, responses, triggerFilter]
  );

  const onChangeParams = React.useCallback(
    (params) =>
      onChangeResponse({
        ...response,
        params: {
          ...response.params,
          ...params,
        },
      }),
    [response, onChangeResponse]
  );

  const onShowResponseOptions = React.useCallback(
    () =>
      addChildSheet({
        key: 'ruleOptions',
        Component: RuleOptionsSheet,
        onShowPicker: onShowResponsePicker,
        actions: makeResponseActions(response, onChangeResponse),
        entry,
      }),
    [addChildSheet, onShowResponsePicker, response, onChangeResponse]
  );

  // render the cells to configure this response
  let responseContents;
  let cells = makeResponseCells({ response, order, context });
  responseContents = (
    <View style={styles.responseCells}>
      <ConfigureRuleEntry
        entry={entry}
        cells={cells}
        behaviors={behaviors}
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
  }
  responseContents = (
    <View style={[styles.response, order > 0 ? styles.nextResponse : null]}>
      {responseContents}
    </View>
  );

  const onChangeNextResponse = React.useCallback(
    (nextResponse) =>
      onChangeResponse({
        ...response,
        params: {
          ...response.params,
          nextResponse,
        },
      }),
    [response, onChangeResponse]
  );

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

const ResponseWithContext = (props) => {
  // we'll be using <Response /> recursively, so only subscribe once at the top
  const context = useCardCreator();
  return <Response context={context} {...props} />;
};

export { ResponseWithContext as Response };
