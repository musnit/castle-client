import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ConfigureRuleEntry } from './ConfigureRuleEntry';
import { Responses } from './Responses';

import RulePartPickerSheet from './RulePartPickerSheet';

const styles = StyleSheet.create({
  // TODO: merge shared styles
  ruleName: {
    marginBottom: 8,
  },
  insetContainer: {
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

const If = ({ response, onChangeResponse, onPickResponse, ...props }) => {
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

  return (
    <React.Fragment>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={onPickResponse} style={{ marginRight: 8 }}>
          <Text style={styles.ruleName}>If:</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPickCondition}>
          <Text style={styles.ruleName}>
            {response.params.condition?.name
              ? `${response.params.condition?.name} ${JSON.stringify(
                  response.params.condition?.params
                )}`
              : '<select condition>'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.insetContainer}>
        <Response response={response.params.then} onChangeResponse={onChangeThen} {...props} />
      </View>
      <Else response={response.params.else} onChangeResponse={onChangeElse} {...props} />
    </React.Fragment>
  );
};

const Else = ({ response, onChangeResponse, ...props }) => {
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

export const Response = ({ response, onChangeResponse, order = 0, ...props }) => {
  const { addChildSheet, behaviors, responses, conditions } = props;

  const onPickResponse = () =>
    addChildSheet({
      key: 'rulePartPicker',
      Component: RulePartPickerSheet,
      behaviors,
      entries: responses,
      onSelectEntry: (entry) => onChangeResponse(_entryToResponse(entry)),
      title: 'Select response',
    });

  // render the cells to configure this response
  let responseContents;
  let cells;
  if (!response || response.name === 'none') {
    cells = Responses.empty({ order });
  } else if (Responses[response.name]) {
    cells = Responses[response.name]({ response, order });
  } else {
    cells = Responses.default({ response, order });
  }
  responseContents = (
    <View style={styles.responseCells}>
      <ConfigureRuleEntry cells={cells} onPickEntry={onPickResponse} />
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
