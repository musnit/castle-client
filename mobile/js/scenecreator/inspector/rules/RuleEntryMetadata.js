/**
 * Index of frontend-specific metadata for rules
 */
export default {
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
    },
    ['stop repeating']: {
      category: 'logic',
    },
    wait: {
      category: 'logic',
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
    },
  },
  conditions: {
    ['coin flip']: {
      category: 'random',
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
