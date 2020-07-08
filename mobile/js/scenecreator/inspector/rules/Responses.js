import { getVariableName } from '../../SceneCreatorUtilities';

const Empty = ({ order }) => {
  return [
    {
      type: 'selectEntry',
      label: order === 0 ? 'select response' : 'add response',
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
  if (response.params) {
    return [
      {
        type: 'selectEntry',
        label: 'a variable meets a condition:',
      },
      {
        type: 'selectParamSheet',
        label: getVariableName(response.params.variableId, context.variables),
        paramName: 'variableId',
        paramValue: response.params.variableId,
      },
      {
        type: 'selectParamSheet',
        paramName: 'comparison',
        paramValue: response.params.comparison,
        label: response.params.comparison,
      },
      {
        type: 'selectParamSheet',
        paramName: 'value',
        paramValue: response.params.value,
        label: response.params.value,
      },
    ];
  } else {
    return [
      {
        type: 'selectEntry',
        label: 'a variable meets a condition',
      },
    ];
  }
};

const Destroy = () => {
  return [
    {
      type: 'showEntryOptions',
      label: 'destroy this actor',
    },
  ];
};

const RestartScene = () => {
  return [
    {
      type: 'showEntryOptions',
      label: 'restart this card',
    },
  ];
};

const SetVariable = ({ response, context }) => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Set variable',
    },
    {
      type: 'selectParamSheet',
      label: getVariableName(response.params?.variableId, context.variables),
      paramName: 'variableId',
      paramValue: response.params?.variableId,
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

const ChangeVariable = ({ response, context }) => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Adjust variable',
    },
    {
      type: 'selectParamSheet',
      label: getVariableName(response.params?.variableId, context.variables),
      paramName: 'variableId',
      paramValue: response.params?.variableId,
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

export const Responses = {
  ['act on other']: ActOnOther,
  if: If,
  repeat: Repeat,
  wait: Wait,
  ['coin flip']: CoinFlip,
  ['is colliding']: IsColliding,
  ['variable meets condition']: VariableMeetsCondition,
  ['set variable']: SetVariable,
  ['change variable']: ChangeVariable,
  ['set velocity']: SetVelocity,
  ['restart scene']: RestartScene,
  destroy: Destroy,
  empty: Empty,
  default: Default,
};
