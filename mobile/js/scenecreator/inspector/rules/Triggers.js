import {
  getVariableName,
  formatTag,
  makeExpressionSummary,
  readableOperator,
} from '../../SceneCreatorUtilities';

/**
 *  This file exports functions for rendering trigger cells.
 *  Functions might expect the following params:
 *    `trigger` - the raw trigger object
 *    `context` - the result of `getRuleRenderContext()`
 *    `isPreview` - whether we're rendering a non-interactable summary/preview of a rule
 *  Functions return an array of cells to be consumed by `ConfigureRuleEntry` or `RulePreview`.
 */

const withWhen = (tokens) => {
  tokens.unshift({
    type: 'text',
    label: 'When',
  });
  return tokens;
};

const Empty = ({ isPreview }) => {
  if (isPreview) {
    return [{ type: 'text', label: '(empty trigger)' }];
  } else {
    return withWhen([
      {
        type: 'selectEntryPlaceholder',
        label: 'Select trigger',
      },
    ]);
  }
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
      type: 'text',
      label: 'While',
    },
    {
      type: 'selectEntry',
      label: 'this is pressed',
    },
  ];
};

const TouchDown = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'a touch begins on this',
    },
  ]);
};

const TouchUp = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'a touch ends on this',
    },
  ]);
};

const DragStart = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'a drag starts on this',
    },
  ]);
};

const DragStop = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'a drag stops on this',
    },
  ]);
};

const Sling = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'this is slung',
    },
  ]);
};

const AnalogStickBegins = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'analog stick input begins',
    },
  ]);
};

const AnalogStickEnds = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'analog stick input ends',
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
      label: hasTag ? formatTag(trigger.params.tag) : 'any actor',
      paramName: 'tag',
      paramValue: trigger.params.tag,
    },
  ]);
};

const GainTag = ({ trigger }) => {
  const hasTag = trigger.params.tag && trigger.params.tag.length;
  return withWhen([
    {
      type: 'selectEntry',
      label: hasTag ? 'this gains the tag' : 'this gains a tag',
    },
    {
      type: hasTag ? 'selectParamSheet' : 'selectParamSheetPlaceholder',
      label: hasTag ? formatTag(trigger.params.tag) : 'Select tag',
      paramName: 'tag',
      paramValue: trigger.params.tag,
    },
  ]);
};

const LoseTag = ({ trigger }) => {
  const hasTag = trigger.params.tag && trigger.params.tag.length;
  return withWhen([
    {
      type: 'selectEntry',
      label: hasTag ? 'this loses the tag' : 'this loses a tag',
    },
    {
      type: hasTag ? 'selectParamSheet' : 'selectParamSheetPlaceholder',
      label: hasTag ? formatTag(trigger.params.tag) : 'Select tag',
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
        label: makeExpressionSummary(trigger.params.value, context),
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

const CounterReachesValue = ({ trigger, context }) => {
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
      label: makeExpressionSummary(trigger.params?.value ?? 0, context),
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

const EnterCameraViewPort = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'this enters the camera viewport',
    },
  ]);
};

const ExitCameraViewPort = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'this exits the camera viewport',
    },
  ]);
};

const AnimationLoop = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'the animation loops',
    },
  ]);
};

const AnimationEnd = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'the animation ends',
    },
  ]);
};

const AnimationReachesFrame = ({ trigger, context }) => {
  return withWhen([
    {
      type: 'selectEntry',
      label: `the animation frame`,
    },
    {
      type: 'selectParamSheet',
      paramName: 'comparison',
      paramValue: trigger.params?.comparison ?? 'equal',
      label: readableOperator(trigger.params?.comparison ?? 'equal'),
    },
    {
      type: 'selectParamSheet',
      paramName: 'frame',
      paramValue: trigger.params?.frame ?? 0,
      label: makeExpressionSummary(trigger.params?.frame ?? 0, context),
    },
  ]);
};

const AnimationFrameChanges = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'the animation frame changes',
    },
  ]);
};

const ClockReachesBeat = ({ trigger, isPreview }) => {
  const intervalType = trigger.params?.intervalType ?? 'beat';
  const superIntervalType = intervalType == 'beat' ? 'bar' : 'beat';
  if (isPreview) {
    // preview:
    // when the clock reaches a beat
    // when the clock reaches beat 2 of a bar
    // when the clock reaches step 2 of a beat
    if (!trigger.params?.count) {
      return withWhen([
        {
          type: 'selectEntry',
          label: `the clock reaches a ${intervalType}`,
        },
      ]);
    } else {
      return withWhen([
        {
          type: 'selectEntry',
          label: `the clock reaches ${intervalType} ${trigger.params.count} of a ${superIntervalType}`,
        },
      ]);
    }
  } else {
    return withWhen([
      {
        type: 'selectEntry',
        label: `the clock reaches`,
      },
      {
        type: 'text',
        label: 'a',
      },
      {
        type: 'selectParamSheet',
        paramName: 'intervalType',
        paramValue: intervalType,
        label: intervalType,
      },
      {
        type: 'text',
        label: `in a ${superIntervalType}:`,
      },
      {
        type: 'selectParamSheet',
        paramName: 'count',
        paramValue: trigger.params?.count ?? 0,
        label: trigger.params?.count > 0 ? trigger.params.count : 'any',
      },
    ]);
  }
};

const ClockReachesBar = ({ trigger, isPreview }) => {
  let cycle = trigger.params?.cycle;
  if (!cycle) {
    cycle = 1;
  }
  let suffix = 'th';
  if (cycle == 2) {
    suffix = 'nd';
  } else if (cycle == 3) {
    suffix = 'rd';
  }
  if (isPreview) {
    if (cycle <= 1) {
      return withWhen([
        {
          type: 'selectEntry',
          label: `the clock reaches a bar`,
        },
      ]);
    } else {
      return withWhen([
        {
          type: 'selectEntry',
          label: `the clock reaches every ${cycle}${suffix} bar`,
        },
      ]);
    }
  } else {
    return withWhen([
      {
        type: 'selectEntry',
        label: `the clock reaches a bar`,
      },
      {
        type: 'text',
        label: ':',
      },
      {
        type: 'selectParamSheet',
        paramName: 'cycle',
        paramValue: trigger.params?.cycle ?? 1,
        label: trigger.params?.cycle > 1 ? `every ${cycle}${suffix}` : 'any',
      },
    ]);
  }
};

const makeCells = (props) => {
  let cells;
  const { trigger } = props;
  if (!trigger || trigger.name === 'none') {
    cells = Triggers.empty(props);
  } else if (Triggers[trigger.name]) {
    cells = Triggers[trigger.name](props);
  } else {
    cells = Triggers.default(props);
  }
  return cells;
};

export const Triggers = {
  collide: Collide,
  tap: Tap,
  press: Press,
  ['touch down']: TouchDown,
  ['touch up']: TouchUp,
  ['drag start']: DragStart,
  ['drag stop']: DragStop,
  sling: Sling,
  ['analog stick begins']: AnalogStickBegins,
  ['analog stick ends']: AnalogStickEnds,
  create: Create,
  destroy: Destroy,
  ['gain tag']: GainTag,
  ['lose tag']: LoseTag,
  ['variable reaches value']: VariableReachesValue,
  ['variable changes']: VariableChanges,
  ['counter reaches value']: CounterReachesValue,
  ['counter changes']: CounterChanges,
  ['velocity changes']: VelocityChanges,
  ['stops moving']: StopsMoving,
  ['enter camera viewport']: EnterCameraViewPort,
  ['exit camera viewport']: ExitCameraViewPort,
  ['clock reaches beat']: ClockReachesBeat,
  ['clock reaches bar']: ClockReachesBar,
  ['animation loop']: AnimationLoop,
  ['animation end']: AnimationEnd,
  ['animation reaches frame']: AnimationReachesFrame,
  ['animation frame changes']: AnimationFrameChanges,
  default: Default,
  empty: Empty,
  makeCells,
};
