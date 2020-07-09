import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ConfigureRuleEntry } from './ConfigureRuleEntry';
import { getEntryByName } from '../InspectorUtilities';
import { makeResponseActions } from './ResponseActions';
import { Responses } from './Responses';

import RuleOptionsSheet from './RuleOptionsSheet';
import RulePartPickerSheet from './RulePartPickerSheet';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  // TODO: merge shared styles
  ruleName: {
    marginBottom: 8,
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

  const onPickCondition = (handler) =>
    addChildSheet({
      key: 'rulePartPicker',
      Component: RulePartPickerSheet,
      behaviors,
      entries: conditions,
      onSelectEntry: (entry) => handler(_entryToResponse(entry)),
      title: 'Select condition',
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
          <Else response={response.params.else} onChangeResponse={onChangeElse} {...props} />
        </View>
      </View>
    </React.Fragment>
  );
};

const Else = ({ response, onChangeResponse, ...props }) => {
  // TODO: style this component
  if (!response) {
    return (
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity style={SceneCreatorConstants.styles.button} onPress={() => onChangeResponse({ name: 'none' })}>
          <Text style={SceneCreatorConstants.styles.buttonLabel}>Add else</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <React.Fragment>
      <TouchableOpacity
        onPress={() => {
          /* TODO: delete else */
        }}>
        <Text style={styles.ruleName}>Else:</Text>
      </TouchableOpacity>
      <View style={SceneCreatorConstants.styles.insetContainer}>
        <Response response={response} onChangeResponse={onChangeResponse} {...props} />
      </View>
    </React.Fragment>
  );
};

const Repeat = ({ response, onChangeResponse, children, ...props }) => {
  const onChangeBody = (body) =>
    onChangeResponse({
      ...response,
      params: {
        ...response.params,
        body,
      },
    });
  return (
    <React.Fragment>
      {children}
      <View style={SceneCreatorConstants.styles.insetContainer}>
        <Response response={response.params.body} onChangeResponse={onChangeBody} {...props} />
      </View>
    </React.Fragment>
  );
};

const ActOn = ({ response, onChangeResponse, children, ...props }) => {
  const onChangeBody = (body) =>
    onChangeResponse({
      ...response,
      params: {
        ...response.params,
        body,
      },
    });
  return (
    <React.Fragment>
      {children}
      <View style={SceneCreatorConstants.styles.insetContainer}>
        <Response response={response.params.body} onChangeResponse={onChangeBody} {...props} />
      </View>
    </React.Fragment>
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
      <ResponseComponent response={response} onChangeResponse={onChangeResponse} order={order} {...props}>
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

  return (
    <React.Fragment>
      {responseContents}
      {response && (
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
