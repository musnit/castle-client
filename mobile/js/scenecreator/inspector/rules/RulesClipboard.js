let clipboard = null;

export const copyRule = (rule) => (clipboard = JSON.parse(JSON.stringify(rule)));

export const paste = (existingRulesItems) => {
  // TODO: validate clipboard contents on destination actor
  // (probably engine-side after engine supports rule validation in general)
  if (clipboard) {
    if (existingRulesItems) {
      return existingRulesItems.concat([clipboard]);
    } else {
      return [clipboard];
    }
  }
  return existingRulesItems;
};

export const isEmpty = () => clipboard === null;

export const clear = () => (clipboard = null);
