import { USE_CLOCK } from './SceneCreatorConstants';

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
  addMotionBehaviors: [
    {
      label: 'Collisions',
      dependencies: ['Body'],
      behaviors: ['Solid', 'Bouncy', 'Friction'],
    },
    {
      label: 'Physics',
      dependencies: ['Body', 'Moving'],
      behaviors: ['Sliding', 'Falling', 'SpeedLimit', 'Slowdown'],
    },
    {
      label: 'Controls',
      dependencies: ['Body', 'Moving'],
      behaviors: ['AnalogStick', 'Drag', 'Sling'],
    },
  ],
  behaviors: {
    AnalogStick: {
      allowsDisableWithoutRemoval: true,
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
      allowsDisableWithoutRemoval: true,
      props: {
        bounciness: {
          step: 0.05,
        },
      },
    },
    Drag: {
      allowsDisableWithoutRemoval: true,
    },
    Falling: {
      allowsDisableWithoutRemoval: true,
      props: {
        gravity: {
          step: 0.5,
        },
      },
    },
    Friction: {
      allowsDisableWithoutRemoval: true,
      props: {
        friction: {
          step: 0.05,
        },
      },
    },
    Sliding: {
      allowsDisableWithoutRemoval: true,
    },
    Sling: {
      allowsDisableWithoutRemoval: true,
      props: {
        speed: {
          step: 0.5,
        },
      },
    },
    Slowdown: {
      allowsDisableWithoutRemoval: true,
      props: {
        rotationSlowdown: {
          step: 0.1,
        },
      },
    },
    Solid: {
      allowsDisableWithoutRemoval: true,
    },
    SpeedLimit: {
      allowsDisableWithoutRemoval: true,
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
    ['drag start']: {
      category: 'controls',
    },
    ['drag stop']: {
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
      props: {
        value: {
          expression: false,
        },
      },
    },
    ['variable changes']: {
      category: 'state',
    },
    ['counter reaches value']: {
      category: 'state',
      props: {
        value: {
          expression: false,
        },
      },
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
    ['clock reaches beat']: {
      category: 'clock',
    },
    ['clock reaches bar']: {
      category: 'clock',
    },
    ['animation loop']: {
      category: 'draw',
    },
    ['animation end']: {
      category: 'draw',
    },
    ['animation reaches frame']: {
      category: 'draw',
      props: {
        frame: {
          expression: false,
        },
      },
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
      triggerFilter: { collide: true },
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
      parentTypeFilter: { repeat: true },
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
      props: {
        type: {
          labeledItems: [
            {
              id: 'sfxr',
              name: 'generated effect',
            },
            {
              id: 'microphone',
              name: 'recorded from my microphone',
            },
            {
              id: 'library',
              name: 'from my files',
            },
          ],
        },
      },
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
    round: {
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
      category: USE_CLOCK ? 'clock' : 'functions',
    },
    ['beats elapsed']: {
      category: 'clock',
    },
    ['current beat in bar']: {
      category: 'clock',
    },
    ['current bar']: {
      category: 'clock',
    },
    ['time since last beat']: {
      category: 'clock',
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

if (USE_CLOCK) {
  data.triggerCategoryOrder.splice(-2, 0, 'clock');
  data.expressionCategoryOrder.splice(-1, 0, 'clock');
}

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
