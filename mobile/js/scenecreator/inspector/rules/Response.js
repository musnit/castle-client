import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BehaviorPropertyRule } from './BehaviorPropertyRule';
import { ConfigureRuleEntry } from './ConfigureRuleEntry';
import { getEntryByName } from '../InspectorUtilities';
import { getRuleRenderContext } from './RuleRenderContext';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { makeResponseActions } from './ResponseActions';
import { PlaySoundResponse as PlaySound } from './PlaySoundResponse';
import { PlayPatternResponse as PlayPattern } from './PlayPatternResponse';
import { Responses } from './Responses';
import { SetVariableResponse as SetVariable } from './SetVariableResponse';
import { useActionSheet } from '@expo/react-native-action-sheet';

import Metadata from '../../Metadata';
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
  checkboxRow: {
    padding: 12,
    paddingBottom: 0,
  },
});

const _entryToResponse = (entry) => ({
  name: entry.name,
  behaviorId: entry.behaviorId,
  params: entry.paramSpecs
    ? entry.paramSpecs.reduce((params, spec) => {
        const { name } = spec;
        params[name] = spec.initialValue;
        return params;
      }, {})
    : {},
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
        entries: conditions,
        onSelectEntry: (entry) => handler(_entryToResponse(entry)),
        title: 'Select condition',
        categoryOrder: Metadata.conditionCategoryOrder,
      }),
    [conditions, addChildSheet]
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
          cells={Responses.makeCells({
            response: response.params.condition,
            context,
            isCondition: true,
          })}
          behaviors={behaviors}
          useAllBehaviors={props.useAllBehaviors}
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
        <Response
          parentType={'repeat'}
          response={response.params.body}
          onChangeResponse={onChangeBody}
          {...props}
        />
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

const CreateText = ({ response, onChangeResponse, children, order, ...props }) => {
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
      {response.params?.action === 'perform response' ? (
        <View style={SceneCreatorConstants.styles.insetContainer}>
          <Response
            response={response.params.body}
            onChangeResponse={onChangeBody}
            useAllBehaviors
            {...props}
          />
        </View>
      ) : null}
    </React.Fragment>
  );
};

const Wait = ({ response, onChangeResponse, children, order, ...props }) => {
  const onChangeQuantize = React.useCallback(
    (quantize) =>
      onChangeResponse({
        ...response,
        params: {
          ...response.params,
          quantize,
        },
      }),
    [response, onChangeResponse]
  );
  return (
    <>
      <View style={styles.responseCells}>{children}</View>
      {response.params?.intervalType !== 'second' ? (
        <View style={styles.checkboxRow}>
          <InspectorCheckbox
            label="Quantize to clock"
            value={response.params.quantize}
            onChange={onChangeQuantize}
          />
        </View>
      ) : null}
    </>
  );
};

const RESPONSE_COMPONENTS = {
  if: If,
  repeat: Repeat,
  ['infinite repeat']: Repeat,
  ['act on other']: ActOn,
  ['act on closest']: ActOn,
  ['act on']: ActOn,
  ['create text']: CreateText,
  ['set behavior property']: BehaviorPropertyRule,
  ['change behavior property']: BehaviorPropertyRule,
  ['set variable']: SetVariable,
  ['change variable']: SetVariable,
  ['set counter']: SetVariable,
  ['change counter']: SetVariable,
  ['play sound']: PlaySound,
  ['wait']: Wait,
};

const Response = ({ response, onChangeResponse, order = 0, ...props }) => {
  const { context, addChildSheet, behaviors, responses, conditions, triggerFilter, parentType } =
    props;
  const entry = getEntryByName(response?.name, responses);

  const onShowResponsePicker = React.useCallback(
    (handler) =>
      addChildSheet({
        parentType,
        key: 'rulePartPicker',
        Component: RulePartPickerSheet,
        useAllBehaviors: props.useAllBehaviors,
        entries: responses,
        triggerFilter,
        onSelectEntry: (entry) => handler(_entryToResponse(entry)),
        title: 'Select response',
        categoryOrder: Metadata.responseCategoryOrder,
      }),
    [addChildSheet, props.useAllBehaviors, response, responses, triggerFilter, parentType]
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
  let cells = Responses.makeCells({ response, order, context });
  responseContents = (
    <View style={styles.responseCells}>
      <ConfigureRuleEntry
        entry={entry}
        cells={cells}
        triggerFilter={triggerFilter}
        useAllBehaviors={props.useAllBehaviors}
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
  const context = getRuleRenderContext();
  return <Response context={context} {...props} />;
};

export { ResponseWithContext as Response };
