import Metadata from '../scenecreator/Metadata';

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

const addInitialParamValues = (entry) => {
  if (entry.paramSpecs?.length) {
    let initialParams;
    try {
      let initialParamsData = JSON.parse(entry.initialParamsJson);
      initialParams = initialParamsData.initialParams;
    } catch (_) {
      initialParams = {};
    }
    entry.paramSpecs = entry.paramSpecs.map((spec) => {
      const initialValue = parseInitialParamValue(initialParams[spec.name]);
      return {
        ...spec,
        initialValue,
      };
    });
  }
};

export default {
  EDITOR_ALL_BEHAVIORS: (name, eventId, data) => {
    return data?.behaviors;
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
    // use Metadata to sort rule entries by UI category
    let result = {};
    const entriesToSort = ['triggers', 'responses', 'conditions'];
    entriesToSort.forEach((entryType) => {
      result[entryType] = {};
      if (!data[entryType]) return;
      data[entryType].forEach((entry) => {
        const metadata = Metadata[entryType][entry.name];
        if (metadata) {
          const { category } = metadata;
          if (!result[entryType][category]) {
            result[entryType][category] = [];
          }
          const fullEntry = {
            ...entry,
            ...metadata,
          };
          addInitialParamValues(fullEntry);
          result[entryType][category].push(fullEntry);
        }
      });
    });

    result.expressions = {};
    if (data.expressions) {
      data.expressions.forEach((entry) => {
        const category = Metadata.expressions[entry.name]?.category;
        result.expressions[entry.name] = {
          ...entry,
          category,
          initialParamsJson: undefined,
        };
        addInitialParamValues(result.expressions[entry.name]);
      });
    }

    return result;
  },
};
