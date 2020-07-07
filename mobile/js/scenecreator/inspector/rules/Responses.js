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
      type: 'selectEntry',
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
      type: 'selectEntry',
      label: 'If',
    },
  ];
};

const ActOnOther = () => {
  return [
    {
      type: 'selectEntry',
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
      type: 'selectEntry',
      label: 'A coin flip',
    },
    {
      type: 'text',
      label: 'shows heads with probability',
    },
    {
      type: 'selectParamSheet',
      paramName: 'probability',
      label: response.params.probability,
    },
  ];
};

const SetVelocity = ({ response }) => {
  return [
    {
      type: 'selectEntry',
      label: 'Set velocity',
    },
    {
      type: 'text',
      label: 'to',
    },
    {
      // TODO: multi-param sheet for x and y together
      type: 'selectParamSheet',
      label: `x: ${response.params.vx ?? 0}`,
      paramName: 'vx',
    },
    {
      type: 'text',
      label: ',',
    },
    {
      type: 'selectParamSheet',
      label: `y: ${response.params.vy ?? 0}`,
      paramName: 'vy',
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
