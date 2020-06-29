import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';

import Icon from 'react-native-vector-icons/MaterialIcons';
import FastImage from 'react-native-fast-image';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';
import * as Utilities from '../../../utilities.js';

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
  imagePreview: {
    width: 96,
    height: 96,
    marginRight: 16,
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

  // TODO: remove image
  const onChangeImage = React.useCallback(
    (result) => {
      // TODO: result.error
      // TODO: result.uri (file:// ...)
      // result.fileId, url
      if (result.fileId && result.url) {
        if (image.isActive) {
          console.log(`update image url`);
          sendUrl('set:url', result.url);
          sendCropEnabled('set:cropEnabled', false);
        } else {
          console.log(`add image behavior`);
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
        {image?.isActive ? (
          <View>
            <FastImage style={styles.imagePreview} source={{ uri: url }} />
            <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
              <Icon name="close" color="#000" size={18} />
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={styles.actions}>
          <Text>Add from</Text>
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
