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
];

export const InspectorActorRefInput = ({ value, onChange, context }) => {
  const kind = value?.kind;
  const onChangeKind = (kind) => onChange({ ...value, kind });
  const tag = value?.tag;
  const onChangeTag = (tag) => onChange({ ...value, tag });

  return (
    <React.Fragment>
      <InspectorDropdown
        labeledItems={ACTOR_REF_KINDS}
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
