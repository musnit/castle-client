import * as React from 'react';

// entries are triggers, responses, or conditions.
// they are grouped into categories when sent over from lua.
export const getEntryByName = (entryName, entries) => {
  if (!entryName || !entries) return null;

  const categories = Object.keys(entries);
  for (let cc = 0; cc < categories.length; cc++) {
    const category = entries[categories[cc]];
    for (let ee = 0; ee < category.length; ee++) {
      const entry = category[ee];
      if (entry.name === entryName) return entry;
    }
  }
  return null;
};

export const filterAvailableBehaviors = ({ allBehaviors, possibleBehaviors }) => {
  let results = [];
  possibleBehaviors.forEach((possible) => {
    let available = true;
    if (allBehaviors[possible]?.dependencies) {
      for (let ii = 0; ii < allBehaviors[possible].dependencies.length; ii++) {
        const dep = allBehaviors[possible].dependencies[ii].name;
        if (!allBehaviors[dep]?.isActive) {
          available = false;
          break;
        }
      }
    }
    if (available) {
      results.push(possible);
    }
  });
  return results;
};

/**
 *  Wrapper for an optimistic property on an inspector behavior.
 *  We need to send all changes across the bridge to lua, but we don't want to wait for them
 *  to come back before we show them in the UI. Based on `Tools::useValue()`.
 *
 *  @param component a behavior component
 *  @param propName the property name to read from the behavior
 *  @param sendAction a method to send actions (i.e. set prop, remove behavior) to this behavior
 *         or component in the engine.
 */
export const useOptimisticBehaviorValue = ({ component, propName, sendAction, onNativeUpdate }) => {
  const [value, setValue] = React.useState(null);
  const [lastSentEventId, setLastSentEventId] = React.useState(null);

  let nativeValue;
  if (component) {
    nativeValue = component?.props[propName];
  }
  if (component && value !== nativeValue) {
    if (lastSentEventId === null || component.lastReportedEventId !== lastSentEventId) {
      setValue(nativeValue);
      setLastSentEventId(component.lastReportedEventId);
      if (onNativeUpdate) {
        onNativeUpdate(nativeValue);
      }
    }
  }

  const setValueAndSendAction = (action, newValue, actionValue) => {
    setValue(newValue);
    if (actionValue === undefined) {
      actionValue = newValue;
    }
    sendAction(action, propName, actionValue);
  };

  return [value, setValueAndSendAction];
};
