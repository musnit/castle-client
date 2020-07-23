import { getVariableName, readableOperator } from '../../SceneCreatorUtilities';

const withWhen = (tokens) => {
  tokens.unshift({
    type: 'showEntryOptions',
    label: 'When',
  });
  return tokens;
};

const Empty = () => {
  return withWhen([
    {
      type: 'selectEntryPlaceholder',
      label: 'Select trigger',
    },
  ]);
};

const Default = ({ trigger }) => {
  return withWhen([
    {
      type: 'selectEntry',
      label: trigger.name,
    },
    {
      type: 'text',
      label: `params: ${JSON.stringify(trigger.params, null, 2)}`,
    },
  ]);
};

const Tap = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'this is tapped',
    },
  ]);
};

const Press = () => {
  return [
    {
      type: 'showEntryOptions',
      label: 'While',
    },
    {
      type: 'selectEntry',
      label: 'this is pressed',
    },
  ];
};

const Sling = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'this is slung',
    },
  ]);
};

const Create = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'this is created',
    },
  ]);
};

const Destroy = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'this is destroyed',
    },
  ]);
};

const Collide = ({ trigger }) => {
  const hasTag = trigger.params.tag && trigger.params.tag.length;
  return withWhen([
    {
      type: 'selectEntry',
      label: 'this collides',
    },
    {
      type: 'text',
      label: hasTag ? 'with tag' : 'with',
    },
    {
      type: 'selectParamSheet',
      label: hasTag ? trigger.params.tag : 'any actor',
      paramName: 'tag',
      paramValue: trigger.params.tag,
    },
  ]);
};

const VariableReachesValue = ({ trigger, context }) => {
  const changeAllParams = {
    paramNames: ['variableId', 'comparison', 'value'],
    paramValues: { ...trigger.params },
  };
  if (trigger.params) {
    return withWhen([
      {
        type: 'selectEntry',
        label: 'variable',
      },
      {
        type: 'selectParamSheet',
        label: getVariableName(trigger.params.variableId, context.variables),
        ...changeAllParams,
      },
      {
        type: 'selectParamSheet',
        label: readableOperator(trigger.params.comparison),
        ...changeAllParams,
      },
      {
        type: 'selectParamSheet',
        label: trigger.params.value,
        ...changeAllParams,
      },
    ]);
  } else {
    return withWhen([
      {
        type: 'selectEntry',
        label: 'variable reaches value:',
      },
      {
        type: 'selectParamSheet',
        label: '(choose variable)',
        ...changeAllParams,
      },
    ]);
  }
};

const VariableChanges = ({ trigger, context }) => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'variable changes:',
    },
    {
      type: 'selectParamSheet',
      label: getVariableName(trigger.params.variableId, context.variables),
      paramName: 'variableId',
      paramValue: trigger.params.variableId,
    },
  ]);
};

const CounterReachesValue = ({ trigger }) => {
  return withWhen([
    {
      type: 'selectEntry',
      label: `this actor's counter`,
    },
    {
      type: 'selectParamSheet',
      paramName: 'comparison',
      paramValue: trigger.params?.comparison ?? 'equal',
      label: readableOperator(trigger.params?.comparison ?? 'equal'),
    },
    {
      type: 'selectParamSheet',
      paramName: 'value',
      paramValue: trigger.params?.value ?? 0,
      label: trigger.params?.value ?? 0,
    },
  ]);
};

const CounterChanges = ({ trigger }) => {
  return withWhen([
    {
      type: 'selectEntry',
      label: `this actor's counter changes`,
    },
  ]);
};

const VelocityChanges = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'x or y velocity changes',
    },
  ]);
};

const StopsMoving = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'this stops moving',
    },
  ]);
};

export const Triggers = {
  collide: Collide,
  tap: Tap,
  press: Press,
  sling: Sling,
  create: Create,
  destroy: Destroy,
  ['variable reaches value']: VariableReachesValue,
  ['variable changes']: VariableChanges,
  ['counter reaches value']: CounterReachesValue,
  ['counter changes']: CounterChanges,
  ['velocity changes']: VelocityChanges,
  ['stops moving']: StopsMoving,
  default: Default,
  empty: Empty,
};
