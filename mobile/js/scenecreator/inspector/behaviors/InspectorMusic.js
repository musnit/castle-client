import * as React from 'react';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { InspectorSegmentedControl } from '../components/InspectorSegmentedControl';
import { SongPreview } from '../../sound/components/SongPreview';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { useCoreState, sendAsync, sendBehaviorAction } from '../../../core/CoreEvents';

import * as Constants from '../../../Constants';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 16,
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
  },
});

const items = [
  {
    name: 'None',
    value: 'none',
  },
  {
    name: 'Once',
    value: 'once',
  },
  {
    name: 'Loop',
    value: 'loop',
  },
];

export default InspectorMusic = ({ music }) => {
  const component = useCoreState('EDITOR_SELECTED_COMPONENT:Music');
  const sendAction = React.useCallback(
    (...args) => sendBehaviorAction('Music', ...args),
    [sendBehaviorAction]
  );
  const editMusic = React.useCallback(async () => {
    sendAsync('EDITOR_GLOBAL_ACTION', {
      action: 'setMode',
      value: 'sound',
    });
  }, []);

  const addMusic = () => sendAction('add');
  const removeMusic = () => sendAction('remove');

  const [autoplay, setAutoplay] = useOptimisticBehaviorValue({
    component,
    propName: 'autoplay',
    propType: 'string',
    sendAction,
  });
  const selectedItemIndex = items.findIndex((item) => autoplay === item.value);
  const onChangeAutoplay = React.useCallback(
    (index) => {
      if (index !== selectedItemIndex) {
        setAutoplay('set', items[index].value);
      }
    },
    [setAutoplay, selectedItemIndex]
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.label}>Music</Text>
        {component ? (
          <Pressable
            style={SceneCreatorConstants.styles.inspectorSectionHeaderButton}
            onPress={removeMusic}>
            <Constants.CastleIcon name="minus" size={16} color="#000" />
          </Pressable>
        ) : (
          <Pressable
            style={SceneCreatorConstants.styles.inspectorSectionHeaderButton}
            onPress={addMusic}>
            <Constants.CastleIcon name="plus" size={16} color="#000" />
          </Pressable>
        )}
      </View>
      {component ? (
        <>
          <View style={styles.row}>
            <TouchableOpacity onPress={editMusic}>
              <SongPreview song={component.props.song} />
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <View style={{ width: '50%', paddingRight: 16, paddingBottom: 8 }}>
              <Text style={{ fontSize: 16 }}>Play when created</Text>
            </View>
            <InspectorSegmentedControl
              style={{ width: '50%' }}
              items={items}
              onChange={onChangeAutoplay}
              selectedItemIndex={selectedItemIndex}
            />
          </View>
        </>
      ) : null}
    </View>
  );
};
