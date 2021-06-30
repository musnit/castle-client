import RuleEntryMetadata from '../scenecreator/inspector/rules/RuleEntryMetadata';

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
  EDITOR_RULES_DATA: (name, eventId, data) => {
    // use RuleEntryMetadata to sort rule entries by UI category
    let result = {};
    const entriesToSort = ['triggers', 'responses', 'conditions'];
    entriesToSort.forEach((entryType) => {
      result[entryType] = {};
      if (!data[entryType]) return;
      data[entryType].forEach((entry) => {
        const category = RuleEntryMetadata[entryType][entry.name]?.category;
        if (category) {
          if (!result[entryType][category]) {
            result[entryType][category] = [];
          }
          result[entryType][category].push(entry);
        }
      });
    });
    return result;
  },
};
