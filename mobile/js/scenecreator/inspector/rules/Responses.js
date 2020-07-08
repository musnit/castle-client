const Empty = ({ order }) => {
  return [
    {
      type: 'selectEntry',
      label: order === 0 ? 'select response' : 'add response',
    },
  ];
};

const Default = ({ response }) => {
  let paramsToRender = { ...response.params };
  delete paramsToRender.nextResponse;

  return [
    {
      type: 'showEntryOptions',
      label: response.name,
    },
    {
      type: 'text',
      label: `params: ${JSON.stringify(paramsToRender, null, 2)}`,
    },
  ];
};

const If = () => {
  return [
    {
      type: 'showEntryOptions',
      label: 'If',
    },
  ];
};

const ActOnOther = () => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Act on other',
    },
  ];
};

const Repeat = ({ response }) => {
  return [
    {
      type: 'text',
      label: 'Repeat',
    },
    {
      type: 'selectParamSheet',
      label: response.params?.count ?? 0,
    },
    {
      type: 'text',
      label: 'times',
    },
  ];
};

const CoinFlip = ({ response }) => {
  return [
    {
      type: 'showEntryOptions',
      label: 'a coin flip',
    },
    {
      type: 'text',
      label: 'shows heads with probability',
    },
    {
      type: 'selectParamSheet',
      paramName: 'probability',
      paramValue: response.params.probability,
      label: response.params.probability,
    },
  ];
};

const SetVelocity = ({ response }) => {
  return [
    {
      type: 'showEntryOptions',
      label: 'Set velocity',
    },
    {
      type: 'text',
      label: 'to',
    },
    {
      type: 'selectParamSheet',
      label: `x: ${response.params.x ?? 0}, y: ${response.params.y ?? 0}`,
      title: 'Set Velocity',
      paramNames: ['x', 'y'],
      paramValues: {
        x: response.params.x,
        y: response.params.y,
      },
    },
  ];
};

export const Responses = {
  ['act on other']: ActOnOther,
  if: If,
  repeat: Repeat,
  ['coin flip']: CoinFlip,
  ['set velocity']: SetVelocity,
  empty: Empty,
  default: Default,
};
