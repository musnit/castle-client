import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
});

const _entryToResponse = (entry) => ({
  name: entry.name,
  behaviorId: entry.behaviorId,
  params: entry.initialParams ?? {},
});

const If = ({ response, onChangeResponse, ...props }) => {
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
      <TouchableOpacity onPress={onPickCondition}>
        <Text style={styles.ruleName}>
          If: {response.params.condition?.name} {JSON.stringify(response.params.condition?.params)}
        </Text>
      </TouchableOpacity>
      <View style={styles.insetContainer}>
        <Response response={response.params.then} onChangeResponse={onChangeThen} {...props} />
      </View>
    </React.Fragment>
  );
};

const Repeat = ({ response, onChangeResponse, ...props }) => {
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
      <Text style={styles.ruleName}>Repeat {response.params?.count ?? 0} times</Text>
      <View style={styles.insetContainer}>
        <Response response={response.params.body} onChangeResponse={onChangeBody} {...props} />
      </View>
    </React.Fragment>
  );
};

const ActOnOther = ({ response, onChangeResponse, ...props }) => {
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
      <Text style={styles.ruleName}>Act on other</Text>
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
  if (!response) {
    return null;
  }
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

  let responseContents;
  if (RESPONSE_COMPONENTS[response.name]) {
    const ResponseComponent = RESPONSE_COMPONENTS[response.name];
    responseContents = (
      <ResponseComponent response={response} onChangeResponse={onChangeResponse} {...props} />
    );
  } else {
    let paramsToRender = { ...response.params };
    delete paramsToRender.nextResponse;
    responseContents = (
      <TouchableOpacity onPress={onPickResponse}>
        <Text>
          {response.name}: {JSON.stringify(paramsToRender, null, 2)}
        </Text>
      </TouchableOpacity>
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
      <View style={[styles.response, order > 0 ? styles.nextResponse : null]}>
        {responseContents}
      </View>
      <Response
        response={response.params?.nextResponse}
        onChangeResponse={onChangeNextResponse}
        order={order + 1}
        {...props}
      />
    </React.Fragment>
  );
};
