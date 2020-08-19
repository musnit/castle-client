import { getVariableName, readableOperator } from '../../SceneCreatorUtilities';
import { makeCardPreviewTitle } from '../../../common/utilities';

const Empty = ({ order, isCondition }) => {
  let label;
  if (isCondition) {
    label = 'Select condition';
  } else {
    label = order === 0 ? 'Select response' : 'Add response';
  }
  return [
    {
      type: 'selectEntryPlaceholder',
      label,
    },
  ];
};

const Default = ({ response }) => {
  let paramsToRender = { ...response.params };
  delete paramsToRender.nextResponse;

  return [
    {
      type: 'showEntryOptions',
      label: response.name,
    },
    {
      type: 'text',
      label: `params: ${JSON.stringify(paramsToRender, null, 2)}`,
    },
  ];
};

const If = () => {
  return [
    {
      type: 'showEntryOptions',
      label: 'If',
    },
  ];
};

const ActOnOther = () => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Act on other',
    },
  ];
};

const ActOn = ({ response }) => {
  const hasTag = response.params.tag && response.params.tag.length;
  if (hasTag) {
    return [
      {
        type: 'showEntryOptions',
        label: 'Act on',
      },
      {
        type: 'text',
        label: 'actors with tag',
      },
      {
        type: 'selectParamSheet',
        label: response.params.tag,
        paramName: 'tag',
        paramValue: response.params.tag,
      },
    ];
  } else {
    return [
      {
        type: 'showEntryOptions',
        label: 'Act on',
      },
      {
        type: 'selectParamSheetPlaceholder',
        label: 'Select tag',
        paramName: 'tag',
        paramValue: '',
      },
    ];
  }
};

const Repeat = ({ response }) => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Repeat',
    },
    {
      type: 'selectParamSheet',
      paramName: 'count',
      paramValue: response.params?.count,
      label: response.params?.count ?? 0,
    },
    {
      type: 'text',
      label: 'times',
    },
  ];
};

const Wait = ({ response }) => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Wait',
    },
    {
      type: 'text',
      label: 'for',
    },
    {
      type: 'selectParamSheet',
      paramName: 'duration',
      paramValue: response.params?.duration,
      label: response.params?.duration ?? 0,
    },
    {
      type: 'text',
      label: response.params?.duration === 1 ? 'second' : 'seconds',
    },
  ];
};

const CoinFlip = ({ response }) => {
  return [
    {
      type: 'selectEntry',
      label: 'a coin flip',
    },
    {
      type: 'text',
      label: 'shows heads with probability',
    },
    {
      type: 'selectParamSheet',
      paramName: 'probability',
      paramValue: response.params.probability,
      label: response.params.probability,
    },
  ];
};

const IsColliding = ({ response }) => {
  const hasTag = response.params?.tag && response.params?.tag.length;
  return [
    {
      type: 'selectEntry',
      label: 'this is colliding',
    },
    {
      type: 'text',
      label: hasTag ? 'with tag' : 'with',
    },
    {
      type: 'selectParamSheet',
      label: hasTag ? response.params.tag : 'any tag',
      paramName: 'tag',
      paramValue: response.params?.tag,
    },
  ];
};

const VariableMeetsCondition = ({ response, context }) => {
  const changeAllParams = {
    paramNames: ['variableId', 'comparison', 'value'],
    paramValues: { ...response.params },
  };
  if (response.params) {
    return [
      {
        type: 'selectEntry',
        label: 'variable',
      },
      {
        type: 'selectParamSheet',
        label: getVariableName(response.params.variableId, context.variables),
        ...changeAllParams,
      },
      {
        type: 'selectParamSheet',
        label: readableOperator(response.params.comparison),
        ...changeAllParams,
      },
      {
        type: 'selectParamSheet',
        label: response.params.value,
        ...changeAllParams,
      },
    ];
  } else {
    return [
      {
        type: 'selectEntry',
        label: 'variable',
      },
      {
        type: 'selectParamSheet',
        label: '(choose variable)',
        ...changeAllParams,
      },
    ];
  }
};

const CounterMeetsCondition = ({ response }) => {
  return [
    {
      type: 'selectEntry',
      label: `the actor's counter`,
    },
    {
      type: 'selectParamSheet',
      paramName: 'comparison',
      paramValue: response.params?.comparison ?? 'equal',
      label: readableOperator(response.params?.comparison ?? 'equal'),
    },
    {
      type: 'selectParamSheet',
      paramName: 'value',
      paramValue: response.params?.value ?? 0,
      label: response.params?.value ?? 0,
    },
  ];
};

const Create = ({ response, context }) => {
  let blueprintName;
  if (context?.library && response.params?.entryId) {
    const blueprint = context.library[response.params.entryId];
    if (blueprint) {
      blueprintName = blueprint.title;
    }
  }
  return [
    {
      type: 'showEntryOptions',
      label: 'Create',
    },
    {
      type: 'selectBlueprintSheet',
      label: blueprintName ?? '(choose blueprint)',
    },
    {
      type: 'text',
      label: 'at relative position',
    },
    {
      type: 'selectParamSheet',
      paramNames: ['xOffset', 'yOffset'],
      paramValues: {
        xOffset: response.params?.xOffset ?? 0,
        yOffset: response.params?.yOffset ?? 0,
      },
      label: `x: ${response.params?.xOffset ?? 0}, y: ${response.params?.yOffset ?? 0}`,
    },
  ];
};

const Destroy = () => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Destroy this actor',
    },
  ];
};

const Show = () => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Show this text',
    },
  ];
};

const Hide = () => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Hide this text',
    },
  ];
};

const RestartScene = () => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Restart this card',
    },
  ];
};

const SetBehavior = ({ response, context }) => {
  let behaviorName;
  if (response.params?.behaviorId) {
    const entry = Object.entries(context.behaviors).find(
      ([_, b]) => b.behaviorId === response.params.behaviorId
    );
    if (entry) {
      behaviorName = entry[1].displayName;
    }
  }
  return [
    {
      type: 'showEntryOptions',
      label: 'Set',
    },
    {
      type: 'selectBehaviorPropertySheet',
      label: behaviorName ?? 'behavior',
      isPropertyVisible: (spec) => spec?.rules?.set === true,
    },
    {
      type: 'text',
      label: 'property',
    },
  ];
};

const ChangeBehavior = ({ response, context }) => {
  let behaviorName;
  if (response.params?.behaviorId) {
    const entry = Object.entries(context.behaviors).find(
      ([_, b]) => b.behaviorId === response.params.behaviorId
    );
    if (entry) {
      behaviorName = entry[1].displayName;
    }
  }
  return [
    {
      type: 'showEntryOptions',
      label: 'Adjust',
    },
    {
      type: 'selectBehaviorPropertySheet',
      label: behaviorName ?? 'behavior',
      isPropertyVisible: (spec) => spec?.method === 'numberInput' && spec?.rules?.set === true,
    },
    {
      type: 'text',
      label: 'property',
    },
  ];
};

const EnableBehavior = ({ response, context }) => {
  let behaviorName;
  if (response.params?.behaviorId) {
    const entry = Object.entries(context.behaviors).find(
      ([_, b]) => b.behaviorId === response.params.behaviorId
    );
    if (entry) {
      behaviorName = entry[1].displayName;
    }
  }
  return [
    {
      type: 'showEntryOptions',
      label: 'Enable behavior',
    },
    {
      type: 'selectBehaviorSheet',
      label: behaviorName ?? '(choose behavior)',
      isBehaviorVisible: (behavior) => behavior.allowsDisableWithoutRemoval,
    },
  ];
};

const DisableBehavior = ({ response, context }) => {
  let behaviorName;
  if (response.params?.behaviorId) {
    const entry = Object.entries(context.behaviors).find(
      ([_, b]) => b.behaviorId === response.params.behaviorId
    );
    if (entry) {
      behaviorName = entry[1].displayName;
    }
  }
  return [
    {
      type: 'showEntryOptions',
      label: 'Disable behavior',
    },
    {
      type: 'selectBehaviorSheet',
      label: behaviorName ?? '(choose behavior)',
      isBehaviorVisible: (behavior) => behavior.allowsDisableWithoutRemoval,
    },
  ];
};

const ResetVariable = ({ response, context }) => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Reset variable',
    },
    {
      type: 'selectParamSheet',
      label: getVariableName(response.params?.variableId, context.variables),
      paramName: 'variableId',
      paramValue: response.params?.variableId,
    },
  ];
};

const SetVariable = ({ response, context }) => {
  const changeAllParams = {
    paramNames: ['variableId', 'setToValue'],
    paramValues: {
      ...response.params,
    },
  };
  return [
    {
      type: 'showEntryOptions',
      label: 'Set variable',
    },
    {
      type: 'selectParamSheet',
      label: getVariableName(response.params?.variableId, context.variables),
      ...changeAllParams,
    },
    {
      type: 'text',
      label: 'to',
    },
    {
      type: 'selectParamSheet',
      label: response.params?.setToValue ?? 0,
      ...changeAllParams,
    },
  ];
};

const ChangeVariable = ({ response, context }) => {
  const changeAllParams = {
    paramNames: ['variableId', 'changeBy'],
    paramValues: {
      ...response.params,
    },
  };
  return [
    {
      type: 'showEntryOptions',
      label: 'Adjust variable',
    },
    {
      type: 'selectParamSheet',
      label: getVariableName(response.params?.variableId, context.variables),
      ...changeAllParams,
    },
    {
      type: 'text',
      label: 'by',
    },
    {
      type: 'selectParamSheet',
      label: response.params?.changeBy ?? 0,
      ...changeAllParams,
    },
  ];
};

const SetCounter = ({ response }) => {
  return [
    {
      type: 'showEntryOptions',
      label: `Set the actor's counter`,
    },
    {
      type: 'text',
      label: 'to',
    },
    {
      type: 'selectParamSheet',
      label: response.params?.setToValue ?? 0,
      paramName: 'setToValue',
      paramValue: response.params?.setToValue ?? 0,
    },
  ];
};

const ChangeCounter = ({ response }) => {
  return [
    {
      type: 'showEntryOptions',
      label: `Adjust the actor's counter`,
    },
    {
      type: 'text',
      label: 'by',
    },
    {
      type: 'selectParamSheet',
      label: response.params?.changeBy ?? 0,
      paramName: 'changeBy',
      paramValue: response.params?.changeBy ?? 0,
    },
  ];
};

const SendPlayerToCard = ({ response, context }) => {
  let cardTitle;
  if (context && context.deck && response.params?.card?.cardId) {
    cardTitle = makeCardPreviewTitle(response.params.card, context.deck);
  } else {
    cardTitle = '(choose card)';
  }
  return [
    {
      type: 'showEntryOptions',
      label: 'Send player to card:',
    },
    {
      type: 'selectCardSheet',
      label: cardTitle,
    },
  ];
};

const AddTag = ({ response }) => {
  let plural = true;
  if (response.params?.tag) {
    const tags = response.params.tag.split(' ');
    plural = !(tags && tags.length == 1);
  }
  return [
    {
      type: 'showEntryOptions',
      label: plural ? 'Add tags' : 'Add tag',
    },
    {
      type: response.params?.tag ? 'selectParamSheet' : 'selectParamSheetPlaceholder',
      label:
        response.params?.tag && response.params.tag.length ? response.params.tag : 'Select tag',
      paramName: 'tag',
      paramValue: response.params?.tag ?? '',
    },
  ];
};

const RemoveTag = ({ response }) => {
  let plural = true;
  if (response.params?.tag) {
    const tags = response.params.tag.split(' ');
    plural = !(tags && tags.length == 1);
  }
  return [
    {
      type: 'showEntryOptions',
      label: plural ? 'Remove tags' : 'Remove tag',
    },
    {
      type: response.params?.tag ? 'selectParamSheet' : 'selectParamSheetPlaceholder',
      label:
        response.params?.tag && response.params.tag.length ? response.params.tag : 'Select tag',
      paramName: 'tag',
      paramValue: response.params?.tag ?? '',
    },
  ];
};

const MoveTowardActor = ({ response }) => {
  const hasTag = response.params?.tag && response.params?.tag.length;
  return [
    {
      type: 'showEntryOptions',
      label: 'Move toward',
    },
    {
      type: 'text',
      label: hasTag ? 'the closest actor with tag' : 'the closest actor with',
    },
    {
      type: 'selectParamSheet',
      label: hasTag ? response.params.tag : 'any tag',
      paramName: 'tag',
      paramValue: response.params?.tag,
    },
    {
      type: 'text',
      label: 'at speed',
    },
    {
      type: 'selectParamSheet',
      label: response.params?.speed ?? 0,
      paramName: 'speed',
      paramValue: response.params?.speed,
    },
  ];
};

const FaceDirectionOfMotion = () => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Face direction of motion',
    },
  ];
};

export const Responses = {
  ['act on']: ActOn,
  ['act on other']: ActOnOther,
  if: If,
  repeat: Repeat,
  wait: Wait,
  ['coin flip']: CoinFlip,
  ['is colliding']: IsColliding,
  ['variable meets condition']: VariableMeetsCondition,
  ['counter meets condition']: CounterMeetsCondition,
  ['set behavior property']: SetBehavior,
  ['change behavior property']: ChangeBehavior,
  ['enable behavior']: EnableBehavior,
  ['disable behavior']: DisableBehavior,
  ['reset variable']: ResetVariable,
  ['set variable']: SetVariable,
  ['change variable']: ChangeVariable,
  ['set counter']: SetCounter,
  ['change counter']: ChangeCounter,
  ['send player to card']: SendPlayerToCard,
  ['restart scene']: RestartScene,
  ['add tag']: AddTag,
  ['remove tag']: RemoveTag,
  ['move toward actor']: MoveTowardActor,
  ['face direction of motion']: FaceDirectionOfMotion,
  create: Create,
  destroy: Destroy,
  show: Show,
  hide: Hide,
  empty: Empty,
  default: Default,
};
