export default {
  EDITOR_ALL_BEHAVIORS: (data) => {
    // want a map of BehaviorName -> behavior object
    return data.behaviors.reduce((behaviors, behavior) => {
      behaviors[behavior.name] = {
        ...behavior,
        propertySpecs: behavior.propertySpecs.reduce((specs, spec) => {
          specs[spec.name] = spec;
          return specs;
        }, {}),
      };
      return behaviors;
    }, {});
  },
};
