/**
 *  This file is an index of frontend-specific metadata for rules, behaviors, and their props.
 *  When possible, prefer to put UI props directly in React components.
 *  This index is available for the many cases where we don't have a bespoke React component for
 *  a particular object in the engine.
 *
 *  See also: `getUIProps(entryPath)`
 */
const data = {
  triggerCategoryOrder: ['general', 'controls', 'state', 'motion', 'camera', 'draw'],
  responseCategoryOrder: [
    'general',
    'behavior',
    'tell other actors',
    'logic',
    'state',
    'visible',
    'motion',
    'sound',
    'camera',
    'meta',
  ],
  conditionCategoryOrder: ['state', 'collision', 'random', 'camera', 'draw'],
  expressionCategoryOrder: [
    'values',
    'choices',
    'randomness',
    'spatial relationships',
    'arithmetic',
    'functions',
  ],
  behaviors: {
    AnalogStick: {
      props: {
        speed: {
          step: 0.5,
        },
        turnFriction: {
          step: 0.1,
        },
      },
    },
    Bouncy: {
      props: {
        bounciness: {
          step: 0.05,
        },
      },
    },
    Falling: {
      props: {
        gravity: {
          step: 0.5,
        },
      },
    },
    Friction: {
      props: {
        friction: {
          step: 0.05,
        },
      },
    },
    Sling: {
      props: {
        speed: {
          step: 0.5,
        },
      },
    },
    Slowdown: {
      props: {
        rotationSlowdown: {
          step: 0.1,
        },
      },
    },
    Text: {
      props: {
        content: {
          multiline: true,
        },
      },
    },
  },
  triggers: {
    collide: {
      category: 'general',
    },
    tap: {
      category: 'controls',
    },
    press: {
      category: 'controls',
    },
    ['touch down']: {
      category: 'controls',
    },
    ['touch up']: {
      category: 'controls',
    },
    sling: {
      category: 'controls',
    },
    ['analog stick begins']: {
      category: 'controls',
    },
    ['analog stick ends']: {
      category: 'controls',
    },
    create: {
      category: 'general',
    },
    destroy: {
      category: 'general',
    },
    ['gain tag']: {
      category: 'state',
    },
    ['lose tag']: {
      category: 'state',
    },
    ['variable reaches value']: {
      category: 'state',
    },
    ['variable changes']: {
      category: 'state',
    },
    ['counter reaches value']: {
      category: 'state',
    },
    ['counter changes']: {
      category: 'state',
    },
    ['velocity changes']: {
      category: 'motion',
    },
    ['stops moving']: {
      category: 'motion',
    },
    ['enter camera viewport']: {
      category: 'camera',
    },
    ['exit camera viewport']: {
      category: 'camera',
    },
    ['animation loop']: {
      category: 'draw',
    },
    ['animation end']: {
      category: 'draw',
    },
    ['animation reaches frame']: {
      category: 'draw',
    },
    ['animation frame changes']: {
      category: 'draw',
    },
  },
  responses: {
    ['act on']: {
      category: 'tell other actors',
    },
    ['act on other']: {
      category: 'tell other actors',
    },
    if: {
      category: 'logic',
    },
    repeat: {
      category: 'logic',
    },
    ['infinite repeat']: {
      category: 'logic',
      props: {
        interval: {
          decimalDigits: 4,
        },
      },
    },
    ['stop repeating']: {
      category: 'logic',
    },
    wait: {
      category: 'logic',
      props: {
        duration: {
          decimalDigits: 4,
        },
      },
    },
    ['set behavior property']: {
      category: 'behavior',
    },
    ['enable behavior']: {
      category: 'behavior',
    },
    ['disable behavior']: {
      category: 'behavior',
    },
    ['reset variable']: {
      category: 'state',
    },
    ['set variable']: {
      category: 'state',
    },
    ['change variable']: {
      category: 'state',
    },
    ['set counter']: {
      category: 'state',
    },
    ['change counter']: {
      category: 'state',
    },
    ['send player to card']: {
      category: 'general',
    },
    ['restart scene']: {
      category: 'general',
    },
    ['reset all variables']: {
      category: 'state',
    },
    ['add tag']: {
      category: 'general',
    },
    ['remove tag']: {
      category: 'general',
    },
    ['move toward own angle']: {
      category: 'motion',
    },
    ['move toward actor']: {
      category: 'motion',
    },
    ['face direction of motion']: {
      category: 'motion',
    },
    ['play sound']: {
      category: 'sound',
    },
    ['follow with camera']: {
      category: 'camera',
    },
    create: {
      category: 'general',
    },
    ['create text']: {
      category: 'general',
      props: {
        content: {
          multiline: true,
        },
      },
    },
    destroy: {
      category: 'general',
    },
    ['hide text']: {
      category: 'general',
    },
    show: {
      category: 'behavior',
    },
    hide: {
      category: 'behavior',
    },
    note: {
      category: 'meta',
      props: {
        note: {
          multiline: true,
        },
      },
    },
  },
  conditions: {
    ['coin flip']: {
      category: 'random',
      props: {
        probability: {
          step: 0.1,
        },
      },
    },
    ['is colliding']: {
      category: 'collision',
    },
    ['expression meets condition']: {
      category: 'state',
    },
    ['variable meets condition']: {
      category: 'state',
    },
    ['counter meets condition']: {
      category: 'state',
    },
    ['has tag']: {
      category: 'state',
    },
    ['is in camera viewport']: {
      category: 'camera',
    },
    ['animation frame meets condition']: {
      category: 'draw',
    },
  },
  expressions: {
    number: {
      category: 'values',
    },
    variable: {
      category: 'values',
    },
    ['+']: {
      category: 'arithmetic',
    },
    ['*']: {
      category: 'arithmetic',
    },
    ['-']: {
      category: 'arithmetic',
    },
    ['/']: {
      category: 'arithmetic',
    },
    ['%']: {
      category: 'arithmetic',
    },
    ['^']: {
      category: 'arithmetic',
    },
    ['log']: {
      category: 'arithmetic',
    },
    ['behavior property']: {
      category: 'values',
    },
    ['counter value']: {
      category: 'values',
    },
    ['actor distance']: {
      category: 'spatial relationships',
    },
    ['actor angle']: {
      category: 'spatial relationships',
    },
    ['angle of motion']: {
      category: 'spatial relationships',
    },
    abs: {
      category: 'functions',
    },
    floor: {
      category: 'functions',
    },
    mix: {
      category: 'functions',
    },
    clamp: {
      category: 'functions',
    },
    ['number of actors']: {
      category: 'functions',
    },
    sin: {
      category: 'functions',
    },
    rad: {
      category: 'functions',
    },
    time: {
      category: 'functions',
    },
    min: {
      category: 'choices',
    },
    max: {
      category: 'choices',
    },
    choose: {
      category: 'choices',
    },
    ['weighted choose']: {
      category: 'choices',
    },
    random: {
      category: 'randomness',
    },
    perlin: {
      category: 'randomness',
    },
    gauss: {
      category: 'randomness',
    },
  },
};

export default data;

/**
 *  Look up UI props for an entry based on a path. Example paths are given in the code below.
 */
export const getUIProps = (entryPath) => {
  if (entryPath) {
    const components = entryPath.split('.');
    if (components.length > 1) {
      if (components[0] === 'Expression') {
        // Expression.random.min
        const name = components[1];
        const paramName = components[2];
        const expression = data.expressions[name];
        if (expression) {
          return expression.props ? expression.props[paramName] : null;
        }
      }
      if (components[1] === 'entries') {
        // Rules.entries.set variable.setToValue
        // could be either a trigger or a response
        const name = components[2];
        const paramName = components[3];
        if (data.triggers[name]) {
          return data.triggers[name].props ? data.triggers[name].props[paramName] : null;
        }
        if (data.responses[name]) {
          return data.responses[name].props ? data.responses[name].props[paramName] : null;
        }
        if (data.conditions[name]) {
          return data.conditions[name].props ? data.conditions[name].props[paramName] : null;
        }
      }
      if (components[1] === 'properties') {
        // Body.properties.vx
        const behaviorName = components[0];
        const propertyName = components[2];
        if (data.behaviors[behaviorName]) {
          return data.behaviors[behaviorName].props
            ? data.behaviors[behaviorName].props[propertyName]
            : null;
        }
      }
    }
  }
  return null;
};
