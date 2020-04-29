import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useGhostUI } from './ghost/GhostUI';
import { getPaneData } from './Tools';

import LegacyCardBlocks from './CardBlocks';

/**
 *  TODO: we can remove this component once we have migrated to text actors.
 */

const USE_TEXT_ACTORS = false;
const TEXT_ACTORS_PANE = 'sceneCreatorTextActors';

const TextActors = () => {
  const { root } = useGhostUI();

  let textActors;
  if (root && root.panes) {
    const data = getPaneData(root.panes[TEXT_ACTORS_PANE]);
    if (data) {
      textActors = data.textActors;
    }
  }

  return (
    <View style={{ width: '100%', minHeight: 128, marginBottom: 8, backgroundColor: '#0f0' }}>
      <ScrollView style={{ flex: 1 }}>
        <Text>{JSON.stringify(textActors, null, 2)}</Text>
      </ScrollView>
    </View>
  );
};

export default (props) => {
  if (!USE_TEXT_ACTORS) {
    return <LegacyCardBlocks {...props} />;
  }
  return <TextActors />;
};
