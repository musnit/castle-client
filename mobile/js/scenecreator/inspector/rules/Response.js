import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ConfigureRuleEntry } from './ConfigureRuleEntry';
import { getEntryByName } from '../InspectorUtilities';
import { Responses } from './Responses';

import RuleOptionsSheet from './RuleOptionsSheet';
import RulePartPickerSheet from './RulePartPickerSheet';

const styles = StyleSheet.create({
  // TODO: merge shared styles
  ruleName: {
    marginBottom: 8,
  },
  insetContainer: {
    marginTop: 8,
    paddingTop: 16,
    paddingLeft: 16,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopLeftRadius: 6,
    borderColor: '#ccc',
  },

  response: {
    paddingBottom: 8,
  },
  nextResponse: {
    paddingTop: 8,
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

// delete myself:
// change myself to self.params.nextResponse
const removeResponse = (response) => {
  return response.params?.nextResponse;
};

// move myself up:
// grandparent's child is myself, my child is my former parent, parent's child is my nextResponse
// TODO:

// move myself down:
// change myself to nextResponse, and change nextResponse to myself
const moveResponseDown = (response) => {
  const child = response.params?.nextResponse;
  if (!child) return response;

  return {
    ...child,
    params: {
      ...child.params,
      nextResponse: {
        ...response,
        params: {
          ...response.params,
          nextResponse: child.params?.nextResponse,
        },
      },
    },
  };
};

// replace myself: open a sheet, then change myself into sheet's result

// insert before: open a sheet, change myself into sheet's result and change nextResponse to myself

const makeResponseActions = (response, onChangeResponse) => {
  return {
    remove: () => onChangeResponse(removeResponse(response)),
    moveDown: () => onChangeResponse(moveResponseDown(response)),
  };
};

const If = ({ response, onChangeResponse, onPickResponse, children, ...props }) => {
  const { addChildSheet, behaviors, conditions } = props;

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

  const onPickCondition = () =>
    addChildSheet({
      key: 'rulePartPicker',
      Component: RulePartPickerSheet,
      behaviors,
      entries: conditions,
      onSelectEntry: (entry) => onChangeCondition(_entryToResponse(entry)),
      title: 'Select condition',
    });

  const onChangeParams = (params) =>
    onChangeResponse({
      ...response,
      params: {
        ...response.params,
        condition: {
          ...response.params.condition.params,
          ...params,
        },
      },
    });

  return (
    <React.Fragment>
      <View style={styles.responseCells}>
        {children}
        <ConfigureRuleEntry
          entry={getEntryByName(response.params.condition?.name, conditions)}
          cells={makeResponseCells({ response: response.params.condition })}
          onPickEntry={onPickCondition}
          onChangeParams={onChangeParams}
          addChildSheet={addChildSheet}
        />
      </View>
      <View style={styles.insetContainer}>
        <Response response={response.params.then} onChangeResponse={onChangeThen} {...props} />
      </View>
      <Else response={response.params.else} onChangeResponse={onChangeElse} {...props} />
    </React.Fragment>
  );
};

const Else = ({ response, onChangeResponse, ...props }) => {
  // TODO: style this component
  if (!response) {
    return (
      <TouchableOpacity onPress={() => onChangeResponse({ name: 'none' })}>
        <Text>{`<use 'else' branch>`}</Text>
      </TouchableOpacity>
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
      <View style={styles.insetContainer}>
        <Response response={response} onChangeResponse={onChangeResponse} {...props} />
      </View>
    </React.Fragment>
  );
};

const Repeat = ({ response, onChangeResponse, onPickResponse, children, ...props }) => {
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
      <View style={styles.insetContainer}>
        <Response response={response.params.body} onChangeResponse={onChangeBody} {...props} />
      </View>
    </React.Fragment>
  );
};

const ActOnOther = ({ response, onChangeResponse, onPickResponse, children, ...props }) => {
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
      <View style={styles.insetContainer}>
        <Response response={response.params.body} onChangeResponse={onChangeBody} {...props} />
      </View>
    </React.Fragment>
  );
};

const RESPONSE_COMPONENTS = {
  if: If,
  repeat: Repeat,
  ['act on other']: ActOnOther,
};

const makeResponseCells = ({ response, order }) => {
  if (!response || response.name === 'none') {
    return Responses.empty({ order });
  } else if (Responses[response.name]) {
    return Responses[response.name]({ response, order });
  } else {
    return Responses.default({ response, order });
  }
};

export const Response = ({ response, onChangeResponse, order = 0, ...props }) => {
  const { addChildSheet, behaviors, responses, conditions } = props;
  const entry = getEntryByName(response?.name, responses);

  const onPickResponse = () =>
    addChildSheet({
      key: 'rulePartPicker',
      Component: RulePartPickerSheet,
      behaviors,
      entries: responses,
      onSelectEntry: (entry) => onChangeResponse(_entryToResponse(entry)),
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
      actions: makeResponseActions(response, onChangeResponse),
      entry,
    });

  // render the cells to configure this response
  let responseContents;
  let cells = makeResponseCells({ response, order });
  responseContents = (
    <View style={styles.responseCells}>
      <ConfigureRuleEntry
        entry={entry}
        cells={cells}
        onPickEntry={onPickResponse}
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
      <View style={[styles.response, order > 0 ? styles.nextResponse : null]}>
        <ResponseComponent
          response={response}
          onChangeResponse={onChangeResponse}
          onPickResponse={onPickResponse}
          {...props}>
          {responseContents}
        </ResponseComponent>
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
