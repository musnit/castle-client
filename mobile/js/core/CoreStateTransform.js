export default {
  EDITOR_ALL_BEHAVIORS: (name, eventId, data) => {
    // want a map of BehaviorName -> behavior object
    return data.behaviors.reduce((behaviors, behavior) => {
      behaviors[behavior.name] = {
        ...behavior,
        lastReportedEventId: eventId,
        propertySpecs: behavior.propertySpecs.reduce((specs, spec) => {
          specs[spec.name] = spec;
          return specs;
        }, {}),
      };
      return behaviors;
    }, {});
  },
  EDITOR_SELECTED_COMPONENT: (name, eventId, data) => {
    if (data.componentNotFound) {
      // sentinel sent from the engine when the selection no longer has a behavior
      return null;
    }
    const result = {
      ...data,
      lastReportedEventId: eventId,
    };
    if (name === 'EDITOR_SELECTED_COMPONENT:Rules') {
      // parse rules json

      // TODO: sort by index?
      /*
        .map(([index, rule]) => ({ ...rule, index }))
        .sort((a, b) => parseInt(b.index, 10) < parseInt(a.index, 10));
      */

      const rulesObj = JSON.parse(data.rulesJson);
      result.rules = rulesObj.rules;
      delete result.rulesJson;
    }
    return result;
  },
  EDITOR_VARIABLES: (name, eventId, data) => {
    return data?.variables;
  },
};
