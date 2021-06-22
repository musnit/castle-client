export default {
  EDITOR_ALL_BEHAVIORS: (data) => {
    // want a map of BehaviorName -> behavior object
    return data.behaviors.reduce((behaviors, behavior) => {
      behaviors[behavior.name] = behavior;
      return behaviors;
    }, {});
  },
};
