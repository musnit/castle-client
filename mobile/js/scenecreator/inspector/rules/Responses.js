import { getVariableName, readableOperator } from '../../SceneCreatorUtilities';
import { makeCardPreviewTitle } from '../../../utilities';

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
      type: 'text',
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

const IsColliding = () => {
  return [
    {
      type: 'selectEntry',
      label: 'this is colliding',
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
        label: 'a variable meets a condition:',
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
        label: 'a variable meets a condition',
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

const SetBehavior = ({ response }) => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Set',
    },
    {
      type: 'selectBehaviorPropertySheet',
      label: response.params?.name ?? 'behavior',
      isPropertyVisible: (spec) => spec?.rules?.set === true,
    },
    {
      type: 'text',
      label: response.params?.propertyName
        ? `property '${response.params.propertyName}'`
        : 'property',
    },
    {
      type: 'text',
      label: 'to',
    },
    {
      type: 'selectParamSheet',
      label: response.params?.setToValue ?? 0,
      paramName: 'setToValue',
      paramValue: response.params?.setToValue,
    },
  ];
};

const ChangeBehavior = ({ response }) => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Adjust',
    },
    {
      type: 'selectBehaviorPropertySheet',
      label: response.params?.name ?? 'behavior',
      isPropertyVisible: (spec) => spec?.method === 'numberInput' && spec?.rules?.set === true,
    },
    {
      type: 'text',
      label: response.params?.propertyName
        ? `property '${response.params.propertyName}'`
        : 'property',
    },
    {
      type: 'text',
      label: 'by',
    },
    {
      type: 'selectParamSheet',
      label: response.params?.changeBy ?? 0,
      paramName: 'changeBy',
      paramValue: response.params?.changeBy,
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

const SetVelocity = ({ response }) => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Set velocity',
    },
    {
      type: 'text',
      label: 'to',
    },
    {
      type: 'selectParamSheet',
      label: `x: ${response.params.x ?? 0}, y: ${response.params.y ?? 0}`,
      title: 'Set Velocity',
      paramNames: ['x', 'y'],
      paramValues: {
        x: response.params.x,
        y: response.params.y,
      },
    },
  ];
};

const AddVelocity = ({ response }) => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Adjust velocity',
    },
    {
      type: 'text',
      label: 'by',
    },
    {
      type: 'selectParamSheet',
      label: `x: ${response.params.x ?? 0}, y: ${response.params.y ?? 0}`,
      title: 'Set Velocity',
      paramNames: ['x', 'y'],
      paramValues: {
        x: response.params.x,
        y: response.params.y,
      },
    },
  ];
};

const SetRotationSpeed = ({ response }) => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Set rotation speed',
    },
    {
      type: 'text',
      label: 'to',
    },
    {
      type: 'selectParamSheet',
      label: response.params?.speed,
      title: 'Set rotation speed',
      paramName: 'speed',
      paramValue: response.params?.speed ?? 0,
    },
  ];
};

const AddRotationSpeed = ({ response }) => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Adjust rotation speed',
    },
    {
      type: 'text',
      label: 'by',
    },
    {
      type: 'selectParamSheet',
      label: response.params?.speed,
      title: 'Set rotation speed',
      paramName: 'speed',
      paramValue: response.params?.speed ?? 0,
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
  ['set variable']: SetVariable,
  ['change variable']: ChangeVariable,
  ['set counter']: SetCounter,
  ['change counter']: ChangeCounter,
  ['set velocity']: SetVelocity,
  ['add velocity']: AddVelocity,
  ['set rotation speed']: SetRotationSpeed,
  ['add rotation speed']: AddRotationSpeed,
  ['send player to card']: SendPlayerToCard,
  ['restart scene']: RestartScene,
  create: Create,
  destroy: Destroy,
  show: Show,
  hide: Hide,
  empty: Empty,
  default: Default,
};
