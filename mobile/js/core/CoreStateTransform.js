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
    return {
      ...data,
      lastReportedEventId: eventId,
    };
  },
};
