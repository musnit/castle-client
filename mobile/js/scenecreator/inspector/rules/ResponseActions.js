// TODO: stop hardcoding behavior id
const RULES_BEHAVIOR_ID = 16;

// delete myself
const removeResponse = (response) => {
  if (response.params?.then) {
    // this is an 'if'
    return flattenNestedResponse(response, ['then', 'else']);
  } else if (response.params?.body) {
    // this is 'act on' or 'repeat'
    return flattenNestedResponse(response, ['body']);
  }
  // change myself to self.params.nextResponse
  return response.params?.nextResponse;
};

const flattenNestedResponse = (response, paramNames) => {
  for (let ii = 0; ii < paramNames.length; ii++) {
    const paramName = paramNames[ii];
    let tailResponse = response.params[paramName];
    while (tailResponse.params?.nextResponse) {
      tailResponse = tailResponse.params?.nextResponse;
    }
    let nextResponse;
    if (ii < paramNames.length - 1) {
      nextResponse = response.params[paramNames[ii + 1]];
    }
    if (!nextResponse) {
      nextResponse = response.params.nextResponse;
      ii = paramNames.length;
    }
    tailResponse.params = {
      ...tailResponse.params,
      nextResponse,
    };
  }
  return response.params[paramNames[0]];
};

// TODO: move myself up:
// grandparent's child is myself, my child is my former parent, parent's child is my nextResponse

// move myself down:
// change myself to nextResponse, and change nextResponse to myself
const moveResponseDown = (response) => {
  const child = response.params?.nextResponse;
  if (!child) return response;

  return {
    ...child,
    params: {
      ...child.params,
      nextResponse: {
        ...response,
        params: {
          ...response.params,
          nextResponse: child.params?.nextResponse,
        },
      },
    },
  };
};

// insert before: change myself into newResponse and change nextResponse to myself
const insertBefore = (response, newResponse) => {
  return {
    ...newResponse,
    params: {
      ...newResponse.params,
      nextResponse: response,
    },
  };
};

// wrap in condition: change myself into 'if' and change params.then to myself
const wrapInCondition = (response) => {
  return {
    name: 'if',
    behaviorId: RULES_BEHAVIOR_ID,
    params: {
      then: { ...response },
    },
  };
};

// wrap in 'act on': change myself into 'act on' and change params.body to myself
const wrapInActOn = (response) => {
  return {
    name: 'act on',
    behaviorId: RULES_BEHAVIOR_ID,
    params: {
      body: { ...response },
    },
  };
};

const wrapInRepeat = (response) => {
  return {
    name: 'repeat',
    behaviorId: RULES_BEHAVIOR_ID,
    params: {
      count: 1,
      body: { ...response },
    },
  };
};

const wrapInInfiniteRepeat = (response) => {
  return {
    name: 'infinite repeat',
    behaviorId: RULES_BEHAVIOR_ID,
    params: {
      interval: 1,
      body: { ...response },
    },
  };
};

const replace = (response, newResponse) => {
  return {
    ...newResponse,
    params: {
      ...newResponse.params,
      nextResponse: response.params?.nextResponse,
    },
  };
};

export const makeResponseActions = (response, onChangeResponse) => {
  return {
    remove: () => onChangeResponse(removeResponse(response)),
    moveDown: response.params?.nextResponse
      ? () => onChangeResponse(moveResponseDown(response))
      : null,
    replace: (newResponse) => onChangeResponse(replace(response, newResponse)),
    insertBefore: (newResponse) => onChangeResponse(insertBefore(response, newResponse)),
    wrapInCondition: () => onChangeResponse(wrapInCondition(response)),
    wrapInActOn: () => onChangeResponse(wrapInActOn(response)),
    wrapInRepeat: () => onChangeResponse(wrapInRepeat(response)),
    wrapInInfiniteRepeat: () => onChangeResponse(wrapInInfiniteRepeat(response)),
  };
};
