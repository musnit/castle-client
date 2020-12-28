import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { sendDataPaneAction, useFastDataMemo } from '../../ghost/GhostUI';
import _ from 'lodash';

import { BottomSheet } from '../../components/BottomSheet';

import FastImage from 'react-native-fast-image';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import DraggableFlatList from 'react-native-draggable-flatlist';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  headingLabel: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
    width: '100%',
    textAlign: 'center',
  },
  image: {
    width: 64,
    height: 64,
  },
});

const ICON_SIZE = 22;

const renderItem = ({ item, index, drag, isActive }) => {
  let layer = item;

  return (
    <TouchableOpacity style={{ flexDirection: 'row', marginTop: 20 }} onLongPress={drag}>
      <TouchableOpacity onPress={() => item.fastAction('onSelectLayer', layer.id)}>
        <Text style={layer.isSelected && { fontWeight: 'bold' }}>{layer.title}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ paddingLeft: 20 }}
        onPress={() =>
          item.fastAction('onSetLayerIsVisible', {
            layerId: layer.id,
            isVisible: !layer.isVisible,
          })
        }>
        <MCIcon
          name={layer.isVisible ? 'eye-outline' : 'eye-off-outline'}
          size={ICON_SIZE}
          color={'#000'}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={{ paddingLeft: 20 }}
        onPress={() => item.fastAction('onDeleteLayer', layer.id)}>
        <Text>X</Text>
      </TouchableOpacity>
      <View style={{ paddingLeft: 20 }}>
        <FastImage
          source={{ uri: `data:image/png;base64,${layer.frames[0].base64Png}` }}
          style={styles.image}
        />
      </View>
    </TouchableOpacity>
  );
};

const DrawingLayers = useFastDataMemo('draw-layers', ({ fastData, fastAction }) => {
  const [stateLayers, setStateLayers] = React.useState([]);

  useEffect(() => {
    if (fastData.layers) {
      let newLayers = fastData.layers;
      if (!Array.isArray(newLayers)) {
        newLayers = Object.values(fastData.layers);
      }

      newLayers.sort((a, b) => b.order - a.order);

      for (let i = 0; i < newLayers.length; i++) {
        let layer = newLayers[i];
        layer.isSelected = layer.id === fastData.selectedLayerId;
        layer.fastAction = fastAction;
      }

      setStateLayers(newLayers);
    }
  }, [fastData]);

  const onAddLayer = useCallback(() => fastAction('onAddLayer'));
  const keyExtractor = useCallback((item) => item.id, []);
  const onDragEnd = useCallback(({ data }) => {
    setStateLayers(data);
    fastAction('onReorderLayers', data.map((layer) => layer.id));
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity onPress={onAddLayer}>
        <Text>Add Layer</Text>
      </TouchableOpacity>
      <DraggableFlatList
        data={stateLayers}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onDragEnd={onDragEnd}
        extraData={fastData.selectedLayerId}
      />
    </View>
  );
});

export const DrawingLayersSheet = ({ onClose, ...props }) => {
  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headingLabel}>Layers</Text>
      </View>
    </View>
  );

  const renderContent = () => <DrawingLayers style={{ flex: 1 }} />;

  return (
    <BottomSheet
      useViewInsteadOfScrollview
      renderContent={renderContent}
      renderHeader={renderHeader}
      style={styles.container}
      {...props}
    />
  );
};
