import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InspectorDropdown } from './InspectorDropdown';
import { InspectorTagPicker } from './InspectorTagPicker';

const styles = StyleSheet.create({
  cell: {
    marginLeft: 8,
  },
});

const ACTOR_REF_KINDS = [
  {
    id: 'self',
    name: 'Myself',
  },
  {
    id: 'closest',
    name: 'The closest actor',
  },
  {
    id: 'other',
    name: 'The colliding actor',
    triggerFilter: 'collide',
  },
];

export const InspectorActorRefInput = ({ value, onChange, context, triggerFilter }) => {
  const kind = value?.kind;
  const onChangeKind = (kind) => onChange({ ...value, kind });
  const tag = value?.tag;
  const onChangeTag = (tag) => onChange({ ...value, tag });

  const kinds = ACTOR_REF_KINDS.filter(
    (kind) => !kind.triggerFilter || !triggerFilter || kind.triggerFilter === triggerFilter
  );

  return (
    <React.Fragment>
      <InspectorDropdown
        labeledItems={kinds}
        value={kind}
        style={{ marginBottom: 0 }}
        onChange={onChangeKind}
      />
      {kind === 'closest' ? (
        <React.Fragment>
          <Text style={styles.cell}>with tag</Text>
          <InspectorTagPicker
            value={tag}
            onChange={onChangeTag}
            context={context}
            style={[styles.cell, { alignItems: 'center' }]}
            singleSelect={true}
          />
        </React.Fragment>
      ) : null}
    </React.Fragment>
  );
};
