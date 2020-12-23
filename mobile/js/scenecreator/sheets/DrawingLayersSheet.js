import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { sendDataPaneAction } from '../../ghost/GhostUI';

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

const DrawingLayers = ({ element }) => {
  if (!element) return null;

  let data, sendAction;
  if (element.children.count) {
    Object.entries(element.children).forEach(([key, child]) => {
      if (child.type === 'data') {
        data = child.props.data;
        sendAction = (action, value) => sendDataPaneAction(element, action, value);
      }
    });
  }

  let layers = data.layers;
  if (!Array.isArray(layers)) {
    layers = Object.values(data.layers);
  }

  layers.sort((a, b) => a.order > b.order);

  const renderItem = ({ item, index, drag, isActive }) => {
    let layer = item;

    return (
      <TouchableOpacity style={{ flexDirection: 'row', marginTop: 20 }} onLongPress={drag}>
        <TouchableOpacity onPress={() => sendAction('onSelectLayer', layer.id)}>
          <Text style={layer.id === data.selectedLayerId && { fontWeight: 'bold' }}>
            {layer.title}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ paddingLeft: 20 }}
          onPress={() =>
            sendAction('onSetLayerIsVisible', {
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
          onPress={() => sendAction('onDeleteLayer', layer.id)}>
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

  return (
    <View style={{ flex: 1 }}>
      <View>
        <TouchableOpacity onPress={() => sendAction('onAddLayer')}>
          <Text>Add Layer</Text>
        </TouchableOpacity>
      </View>
      <DraggableFlatList
        data={layers}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id}
        onDragEnd={({ data }) => sendAction('onReorderLayers', data.map((layer) => layer.id))}
      />
    </View>
  );
};

export const DrawingLayersSheet = ({ onClose, element, ...props }) => {
  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headingLabel}>Layers</Text>
      </View>
    </View>
  );
  const renderContent = () => <DrawingLayers element={element} style={{ flex: 1 }} />;

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
