import RuleEntryMetadata from '../scenecreator/inspector/rules/RuleEntryMetadata';

// interpret initial params from engine
const parseInitialParamValue = (value) => {
  if (typeof value === 'object' && value !== null) {
    if (typeof value.value !== 'undefined') {
      // expression
      return value.value;
    }
    if (value.none === true) {
      // sentinel for empty tag or variable
      // TODO: think about this more
      return '(none)';
    }
  }
  return value;
};

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

    result.expressions = {};
    if (data.expressions) {
      data.expressions.forEach((entry) => {
        const category = RuleEntryMetadata.expressions[entry.name]?.category;
        result.expressions[entry.name] = {
          ...entry,
          category,
          initialParamsJson: undefined,
        };
        if (entry.paramSpecs.length) {
          let initialParams;
          try {
            let initialParamsData = JSON.parse(entry.initialParamsJson);
            initialParams = initialParamsData.initialParams;
          } catch (_) {}
          result.expressions[entry.name].paramSpecs = entry.paramSpecs.map((spec) => {
            const initialValue = parseInitialParamValue(initialParams[spec.name]);
            return {
              ...spec,
              initialValue,
            };
          });
        }
      });
    }

    return result;
  },
};
