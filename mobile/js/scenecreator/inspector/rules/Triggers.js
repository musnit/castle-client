const withWhen = (tokens) => {
  tokens.unshift({
    type: 'text',
    label: 'When',
  });
  return tokens;
};

const Empty = () => {
  return withWhen([
    {
      type: 'selectEntry',
      label: 'select trigger',
    },
  ]);
};

const Default = ({ trigger }) => {
  return withWhen([
    {
      type: 'selectEntry',
      label: trigger.name,
    },
    {
      type: 'text',
      label: `params: ${JSON.stringify(trigger.params, null, 2)}`,
    },
  ]);
};

const Collide = ({ trigger }) => {
  const hasTag = trigger.params.tag && trigger.params.tag.length;
  return withWhen([
    {
      type: 'selectEntry',
      label: 'this collides',
    },
    {
      type: 'text',
      label: hasTag ? 'with tag' : 'with',
    },
    {
      type: 'selectParamSheet',
      label: hasTag ? trigger.params.tag : 'any actor',
      paramName: 'tag',
      paramValue: trigger.params.tag,
    },
  ]);
};

export const Triggers = {
  collide: Collide,
  default: Default,
  empty: Empty,
};
