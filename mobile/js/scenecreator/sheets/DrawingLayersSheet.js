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
    height: 64,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  image: {
    width: 50,
    height: 50,
  },
  headingLabel: {
    paddingLeft: 20,
    color: '#000',
    fontWeight: '500',
    fontSize: 16,
    width: '100%',
    textAlign: 'center',
  },
  layerRow: {
    height: 64,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  firstCell: {
    flexDirection: 'row',
    width: 150,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  cell: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  selectedCell: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
});

const ICON_SIZE = 22;

const renderItem = ({ item, index, drag, isActive }) => {
  let layer = item;

  return (
    <View style={styles.layerRow}>
      <TouchableOpacity
        style={[
          styles.firstCell,
          {
            backgroundColor: isActive ? '#ccc' : 'transparent',
          },
        ]}
        onLongPress={drag}>
        <TouchableOpacity
          onPress={() =>
            item.fastAction('onSetLayerIsVisible', {
              layerId: layer.id,
              isVisible: !layer.isVisible,
            })
          }
          onLongPress={drag}>
          <MCIcon
            name={layer.isVisible ? 'eye-outline' : 'eye-off-outline'}
            size={ICON_SIZE}
            color={'#000'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => item.fastAction('onSelectLayer', layer.id)}
          onLongPress={drag}>
          <Text style={layer.isSelected && { fontWeight: 'bold' }}>{layer.title}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => item.fastAction('onDeleteLayer', layer.id)}
          onLongPress={drag}>
          <Text>X</Text>
        </TouchableOpacity>
      </TouchableOpacity>
      {layer.frames.map((frame, idx) => {
        return (
          <TouchableOpacity
            onPress={() =>
              item.fastAction('onSelectLayerAndFrame', {
                layerId: layer.id,
                frame: idx + 1,
              })
            }
            onLongPress={drag}
            key={idx}
            style={
              layer.selectedFrame == idx + 1 && layer.isSelected ? styles.selectedCell : styles.cell
            }>
            <FastImage
              source={{ uri: `data:image/png;base64,${frame.base64Png}` }}
              style={styles.image}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const DrawingLayers = useFastDataMemo('draw-layers', ({ fastData, fastAction }) => {
  const [stateLayers, setStateLayers] = React.useState([]);

  // we need to pass stateSeletedLayerId into extraData instead of fastData.selectedLayerId because
  // otherwise extraData will trigger the FlatList update before stateLayers gets updated
  const [stateSeletedLayerId, setStateSelectedLayerId] = React.useState(null);
  const [stateSelectedFrame, setStateSelectedFrame] = React.useState(1);

  useEffect(() => {
    if (fastData.layers) {
      let newLayers = JSON.parse(JSON.stringify(fastData.layers));
      if (!Array.isArray(newLayers)) {
        newLayers = Object.values(newLayers);
      }

      newLayers.sort((a, b) => b.order - a.order);

      for (let i = 0; i < newLayers.length; i++) {
        let layer = newLayers[i];
        layer.isSelected = layer.id === fastData.selectedLayerId;
        layer.fastAction = fastAction;
        layer.selectedFrame = fastData.selectedFrame;

        if (!Array.isArray(layer.frames)) {
          layer.frames = Object.values(layer.frames);
        }

        layer.frames.sort((a, b) => a.order - b.order);
      }

      setStateLayers(newLayers);
    }
  }, [fastData]);

  useEffect(() => {
    setStateSelectedLayerId(fastData.selectedLayerId);
  }, [fastData.selectedLayerId]);

  useEffect(() => {
    setStateSelectedFrame(fastData.selectedFrame);
  }, [fastData.selectedFrame]);

  const onAddLayer = useCallback(() => fastAction('onAddLayer'));
  const onAddFrame = useCallback(() => fastAction('onAddFrame'));
  const keyExtractor = useCallback((item) => item.id, []);
  const onDragEnd = useCallback(({ data }) => {
    setStateLayers(data);
    fastAction('onReorderLayers', data.map((layer) => layer.id));
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.layerRow}>
        <TouchableOpacity onPress={onAddLayer} style={styles.firstCell}>
          <Text>+ Add Layer</Text>
        </TouchableOpacity>
        {stateLayers.length > 0 &&
          stateLayers[0].frames.map((frame, idx) => {
            return (
              <TouchableOpacity
                onPress={() => fastAction('onSelectFrame', idx + 1)}
                style={styles.cell}
                key={idx}>
                <Text style={stateSelectedFrame == idx + 1 && { fontWeight: 'bold' }}>
                  {idx + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        <TouchableOpacity onPress={onAddFrame} style={styles.cell}>
          <Text>+</Text>
        </TouchableOpacity>
      </View>
      <DraggableFlatList
        data={stateLayers}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onDragEnd={onDragEnd}
        extraData={stateSeletedLayerId}
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
