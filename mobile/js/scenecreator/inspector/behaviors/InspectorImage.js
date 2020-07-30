import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';

import Icon from 'react-native-vector-icons/MaterialIcons';
import FastImage from 'react-native-fast-image';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';
import * as Utilities from '../../../common/utilities.js';

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  label: {
    fontWeight: 'bold',
    paddingBottom: 16,
    fontSize: 16,
  },
  sublabel: {
    fontWeight: 'normal',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  actionsText: {
    fontSize: 16,
  },
  imagePreview: {
    width: 96,
    height: 96,
    marginRight: 16,
  },
  loading: {
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const ImagePreview = ({ isActive, url, isLoading, onRemove }) => {
  if (isLoading) {
    return (
      <View style={[styles.imagePreview, styles.loading]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  } else if (isActive) {
    return (
      <View>
        <FastImage style={styles.imagePreview} source={{ uri: url }} />
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Icon name="close" color="#000" size={18} />
        </TouchableOpacity>
      </View>
    );
  }
  return null;
};

export default InspectorImage = ({ image, sendAction }) => {
  const [url, sendUrl] = useOptimisticBehaviorValue({
    behavior: image,
    propName: 'url',
    sendAction,
  });
  const [cropEnabled, sendCropEnabled] = useOptimisticBehaviorValue({
    behavior: image,
    propName: 'cropEnabled',
    sendAction,
  });

  const [loading, setLoading] = React.useState(false);

  const onChangeImage = React.useCallback(
    (result) => {
      if (result.error) {
        setLoading(false);
      } else if (result.uri) {
        // while uploading:
        // local url like file:// ...
        setLoading(true);
      } else if (result.fileId && result.url) {
        setLoading(false);
        if (image.isActive) {
          sendUrl('set:url', result.url);
          sendCropEnabled('set:cropEnabled', false);
        } else {
          sendUrl('add', result.url, { url: result.url, cropEnabled: false });
        }
      }
    },
    [image?.isActive, sendUrl, sendCropEnabled]
  );

  const onRemove = () => sendUrl('remove');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Image <Text style={styles.sublabel}>(legacy)</Text>
      </Text>
      <View style={styles.content}>
        <ImagePreview
          isActive={image?.isActive}
          url={url}
          isLoading={loading}
          onRemove={onRemove}
        />
        <View style={styles.actions}>
          <Text style={styles.actionsText}>Add from</Text>
          <TouchableOpacity
            style={[SceneCreatorConstants.styles.button, { marginLeft: 8 }]}
            onPress={() => Utilities.launchImageLibrary(onChangeImage)}>
            <Text style={SceneCreatorConstants.styles.buttonLabel}>Library</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[SceneCreatorConstants.styles.button, { marginLeft: 8 }]}
            onPress={() => Utilities.launchCamera(onChangeImage)}>
            <Text style={SceneCreatorConstants.styles.buttonLabel}>Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
