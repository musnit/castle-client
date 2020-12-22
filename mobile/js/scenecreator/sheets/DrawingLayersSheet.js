import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { sendDataPaneAction } from '../../ghost/GhostUI';

import { BottomSheet } from '../../components/BottomSheet';

import FastImage from 'react-native-fast-image';

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

  layers.sort((a, b) => a.id > b.id);

  return (
    <View>
      <View>
        <TouchableOpacity onPress={() => sendAction('onAddLayer')}>
          <Text>Add Layer</Text>
        </TouchableOpacity>
      </View>
      {layers.map((layer) => {
        return (
          <View key={layer.title} style={{ flexDirection: 'row', marginTop: 20 }}>
            <TouchableOpacity onPress={() => sendAction('onSelectLayer', layer.id)}>
              <Text style={layer.id === data.selectedLayer && { fontWeight: 'bold' }}>
                {layer.title}
              </Text>
            </TouchableOpacity>
            <FastImage
              source={{ uri: `data:image/png;base64,${layer.frames[0].base64Png}` }}
              style={styles.image}
            />
          </View>
        );
      })}
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
  const renderContent = () => <DrawingLayers element={element} />;

  return (
    <BottomSheet
      renderContent={renderContent}
      renderHeader={renderHeader}
      style={styles.container}
      {...props}
    />
  );
};
