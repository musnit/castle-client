export const isParamNumeric = (paramSpec) =>
  paramSpec.type === 'f' ||
  paramSpec.type === 'i' ||
  paramSpec.type === 'd' ||
  paramSpec.type === 'expression';

export const canParamBePromotedToExpression = (paramSpec) => paramSpec.type === 'expression';

export const formatVariableName = (name) => `\$${name}`;

export const formatTag = (tag) => `#${tag}`;

export const getVariableName = (variable, variables) => {
  let variableName = '(none)';
  if (variable) {
    if (typeof variable === 'string') {
      // this is only a variable id
      if (variables && variable !== 'none' && variable !== '(none)') {
        const selectedVar = variables.find((v) => v.variableId === variable);
        if (selectedVar) {
          variableName = selectedVar.name;
        }
      }
    } else {
      // this is a scoped variable object
      if (variable.scope === 'actor') {
        if (variable.id.length) {
          variableName = variable.id;
        }
      } else {
        if (variables) {
          const selectedVar = variables.find((v) => v.variableId === variable.id);
          if (selectedVar) {
            variableName = selectedVar.name;
          }
        }
      }
    }
  }
  return variableName;
};

const COMPARISON_OPERATORS = {
  equal: 'equals',
  'not equal': 'does not equal',
  'greater than': 'is greater than',
  'greater or equal': 'is greater than or equal to',
  'less than': 'is less than',
  'less or equal': 'is less than or equal to',
};

export const readableOperator = (o) => {
  return COMPARISON_OPERATORS[o] ?? o;
};

export const getComparisonOperators = () => Object.keys(COMPARISON_OPERATORS);

export const promoteToExpression = (initialValue) => {
  const initialType = typeof initialValue;
  switch (initialType) {
    case 'object':
      return initialValue;
    case 'number':
    case 'boolean':
      // promote from primitive to object
      return {
        expressionType: 'number',
        returnType: 'number',
        params: { value: initialValue },
      };
    default:
      throw new Error(`Invalid expression: ${JSON.stringify(initialValue)}`);
  }
};

const makeActorRefSummary = (actorRef) => {
  let result = 'My own';
  if (actorRef?.kind === 'closest') {
    result = formatTag(actorRef.tag);
  } else if (actorRef?.kind === 'other') {
    result = `Other`;
  }
  return result;
};

const maybeExpressionParens = (str, depth) => (depth > 0 ? `(${str})` : str);

export const makeExpressionSummary = (expression, context, depth = 0) => {
  if (!expression?.expressionType) {
    if (typeof expression === 'number') {
      return Math.round((expression + Number.EPSILON) * 10000) / 10000;
    }
    return expression;
  }
  switch (expression.expressionType) {
    case 'number':
      return Math.round((expression.params.value + Number.EPSILON) * 10000) / 10000;
    case 'random': {
      let min = makeExpressionSummary(expression.params.min, context, depth + 1),
        max = makeExpressionSummary(expression.params.max, context, depth + 1);
      return maybeExpressionParens(`Random from ${min} to ${max}`, depth);
    }
    case '+':
    case '*':
    case '-':
    case '/':
    case '%':
    case '^': {
      let lhs = makeExpressionSummary(expression.params.lhs, context, depth + 1),
        rhs = makeExpressionSummary(expression.params.rhs, context, depth + 1);
      return maybeExpressionParens(`${lhs} ${expression.expressionType} ${rhs}`, depth);
    }
    case 'abs':
    case 'floor':
    case 'round':
    case 'sin':
    case 'rad': {
      let number = makeExpressionSummary(expression.params.number, context, depth + 1);
      return `${expression.expressionType}(${number})`;
    }
    case 'time': {
      return '⏰';
    }
    case 'log': {
      let base = makeExpressionSummary(expression.params.base, context, depth + 1),
        number = makeExpressionSummary(expression.params.number, context, depth + 1);
      return maybeExpressionParens(`Log base ${base} of ${number}`, depth);
    }
    case 'number of actors': {
      if (expression.params.tag) {
        return `The number of actors tagged ${formatTag(expression.params.tag)}`;
      } else {
        return `The total number of actors`;
      }
    }
    case 'min':
    case 'max':
    case 'choose':
    case 'weighted choose': {
      let lhs = makeExpressionSummary(expression.params.lhs, context, depth + 1),
        rhs = makeExpressionSummary(expression.params.rhs, context, depth + 1);
      return `${expression.expressionType}(${lhs}, ${rhs})`;
    }
    case 'mix': {
      let lhs = makeExpressionSummary(expression.params.lhs, context, depth + 1),
        rhs = makeExpressionSummary(expression.params.rhs, context, depth + 1),
        mix = makeExpressionSummary(expression.params.mix, context, depth + 1);
      return maybeExpressionParens(`${lhs} and ${rhs} mixed by ${mix}`);
    }
    case 'clamp': {
      let number = makeExpressionSummary(expression.params.number, context, depth + 1),
        min = makeExpressionSummary(expression.params.min, context, depth + 1),
        max = makeExpressionSummary(expression.params.max, context, depth + 1);
      return maybeExpressionParens(`${number} clamped between ${min} and ${max}`);
    }
    case 'perlin': {
      let x = makeExpressionSummary(expression.params.x, context, depth + 1),
        y = makeExpressionSummary(expression.params.y, context, depth + 1);
      return `${expression.expressionType}(${x}, ${y})`;
    }
    case 'gauss': {
      let mean = makeExpressionSummary(expression.params.mean, context, depth + 1),
        sigma = makeExpressionSummary(expression.params.sigma, context, depth + 1);
      return `${expression.expressionType}(${mean}, ${sigma})`;
    }
    case 'variable': {
      let variableLabel = getVariableName(expression.params.variableId, context.variables);
      return formatVariableName(variableLabel);
    }
    case 'counter value': {
      const actorRef = makeActorRefSummary(expression.params.actorRef);
      return `${actorRef}: Counter: Value`;
    }
    case 'behavior property': {
      const { behaviors } = context;
      let selectedBehavior, selectedProperty;
      if (expression.params?.behaviorId) {
        const entry = Object.entries(behaviors).find(
          ([_, b]) => b.behaviorId === expression.params.behaviorId
        );
        if (entry) {
          selectedBehavior = entry[1];
        }
      }
      if (selectedBehavior && expression.params?.propertyName) {
        selectedProperty = selectedBehavior.propertySpecs[expression.params.propertyName];
      }
      if (selectedBehavior && selectedProperty) {
        const actorRef = makeActorRefSummary(expression.params.actorRef);
        return `${actorRef}: ${selectedBehavior.displayName}: ${selectedProperty.attribs.label}`;
      }
    }
    case 'actor distance': {
      const fromActor = makeActorRefSummary(expression.params.fromActor),
        toActor = makeActorRefSummary(expression.params.toActor);
      return maybeExpressionParens(
        `The distance from ${fromActor} position to ${toActor} position`
      );
    }
    case 'actor angle': {
      const fromActor = makeActorRefSummary(expression.params.fromActor),
        toActor = makeActorRefSummary(expression.params.toActor);
      return maybeExpressionParens(`The angle from ${fromActor} position to ${toActor} position`);
    }
    case 'angle of motion': {
      const actorRef = makeActorRefSummary(expression.params.actorRef);
      return maybeExpressionParens(`${actorRef}: angle of motion`);
    }
    case 'speed': {
      const actorRef = makeActorRefSummary(expression.params.actorRef);
      return maybeExpressionParens(`${actorRef}: speed`);
    }
    default: {
      if (context?.expressions) {
        if (context.expressions[expression.expressionType]) {
          return context.expressions[expression.expressionType].description;
        }
      }
    }
  }
  return null;
};

export const makeDefaultPatternName = (pattern) => {
  if (pattern) {
    if (pattern.name && pattern.name != '') {
      return pattern.name;
    }
    return `pattern-${pattern.patternId.substring(0, 4)}`;
  } else {
    return 'no pattern';
  }
};

export const makeTrackName = (track) => {
  if (track?.instrument.props?.name && track.instrument.props.name !== '') {
    return track.instrument.props.name;
  }
  if (track?.instrument.type) {
    return track.instrument.type;
  }
  return 'track';
};
