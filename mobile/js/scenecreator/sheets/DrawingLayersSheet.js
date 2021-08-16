import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useCoreState, sendAsync } from '../../core/CoreEvents';
import { useActionSheet } from '@expo/react-native-action-sheet';

import { BottomSheet } from '../../components/BottomSheet';

import FastImage from 'react-native-fast-image';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { ScrollView } from 'react-native-gesture-handler';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  header: {
    padding: 8,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerControls: {
    flexDirection: 'row',
  },
  headerControl: {
    padding: 10,
  },
  image: {
    width: 50,
    height: 50,
  },
  linkedImage: {
    width: 64,
    height: 40,
  },
  headingLabel: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    width: '100%',
    marginTop: 2,
  },
  layerRow: {
    height: 64,
    flexDirection: 'row',
  },
  firstCell: {
    flexDirection: 'row',
    width: 165,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    padding: 16,
    paddingRight: 8,
  },
  addLayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addLayerText: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 12,
  },
  layerTitle: {
    flexGrow: 1,
    marginLeft: 12,
  },
  layerTitleText: {
    fontSize: 16,
  },
  layerMenuButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cell: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellBottomBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  cellLeftBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#ccc',
  },
  cellRightBorder: {
    width: 65,
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  cellSelected: {
    borderWidth: 2,
    borderColor: '#000',
  },
  cellMenuButton: {
    position: 'absolute',
    backgroundColor: 'black',
    bottom: 0,
    right: 0,
    borderTopLeftRadius: 5,
    width: 35,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const ICON_SIZE = 22;

const CollisionRow = ({ isSelected, onSelect }) => {
  return (
    <View style={styles.layerRow}>
      <TouchableOpacity style={styles.firstCell} onPress={() => onSelect(!isSelected)}>
        <MCIcon name="eye-outline" size={ICON_SIZE} color="#000" />
        <View style={styles.layerTitle}>
          <Text style={[styles.layerTitleText, { fontWeight: isSelected ? 'bold' : 'normal' }]}>
            Collision
          </Text>
        </View>
        <View style={styles.layerMenuButton}>
          <MCIcon name={'dots-horizontal'} size={ICON_SIZE} color={'#000'} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.cell, styles.cellBottomBorder, styles.cellRightBorder]}>
        {/* TODO: preview of collision shape */}
        <View style={{ width: 50, height: 50 }} />
      </TouchableOpacity>
    </View>
  );
};

const LayerRow = ({
  layer,
  index,
  isCollisionActive,
  isSelected,
  selectedFrameIndex,
  onSelectLayer,
  showLayerActionSheet,
  showCellActionSheet,
  sendLayerAction,
}) => {
  return (
    <View style={styles.layerRow}>
      <TouchableOpacity style={styles.firstCell} onPress={() => onSelectLayer({ layer })}>
        <TouchableOpacity
          onPress={() =>
            sendLayerAction('setLayerIsVisible', {
              layerId: layer.id,
              doubleValue: layer.isVisible ? 0 : 1,
            })
          }>
          <MCIcon
            name={layer.isVisible ? 'eye-outline' : 'eye-off-outline'}
            size={ICON_SIZE}
            color={'#000'}
          />
        </TouchableOpacity>
        <View style={styles.layerTitle}>
          <Text
            style={[
              styles.layerTitleText,
              { fontWeight: isSelected && !isCollisionActive ? 'bold' : 'normal' },
            ]}>
            {layer.title}
          </Text>
        </View>
        <TouchableOpacity onPress={() => showLayerActionSheet({ layerId: layer.id, index })}>
          <View style={styles.layerMenuButton}>
            <MCIcon name={'dots-horizontal'} size={ICON_SIZE} color={'#000'} />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
      {layer.frames.map((frame, idx) => {
        let isFrameSelected = selectedFrameIndex == idx + 1 && isSelected;
        let isMenuAvailable = isFrameSelected;
        let onPress = isMenuAvailable
          ? () =>
              showCellActionSheet({
                isLinked: frame.isLinked,
                layerId: layer.id,
                frame: idx + 1,
              })
          : () => onSelectLayer({ layer, frame: idx + 1 });

        let cellStyle = [styles.cell];
        let isLastCell = idx === layer.frames.length - 1;

        if (isFrameSelected) {
          cellStyle.push(styles.cellSelected);
        } else {
          cellStyle.push(styles.cellBottomBorder);

          if (!frame.isLinked) {
            cellStyle.push(styles.cellLeftBorder);
          }

          if (isLastCell) {
            cellStyle.push(styles.cellRightBorder);
          }
        }

        let isLastLink = isLastCell || !layer.frames[idx + 1].isLinked;

        return (
          <TouchableOpacity onPress={onPress} key={idx} style={cellStyle}>
            {frame.isLinked ? (
              <FastImage
                style={styles.linkedImage}
                source={
                  isLastLink
                    ? require('../../../assets/images/arrow2.png')
                    : require('../../../assets/images/arrow1.png')
                }
              />
            ) : (
              <FastImage
                source={{ uri: `data:image/png;base64,${frame.base64Png}` }}
                style={styles.image}
              />
            )}

            {isMenuAvailable && (
              <View style={styles.cellMenuButton}>
                <MCIcon name={'dots-horizontal'} size={ICON_SIZE} color={'#fff'} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const DrawingLayers = () => {
  const { layers, selectedLayerId, selectedFrameIndex, canPasteCell } = useCoreState(
    'EDITOR_DRAW_LAYERS'
  ) || {
    selectedFrameIndex: 1,
  };
  const drawToolState = useCoreState('EDITOR_DRAW_TOOL') || {};
  const fastAction = () => {}; // TODO: actions

  const isCollisionActive = drawToolState.selectedSubtools?.root === 'collision';
  const onSelectCollision = React.useCallback(
    (isSelected) => {
      if (isSelected != isCollisionActive) {
        sendAsync('DRAW_TOOL_SELECT_SUBTOOL', {
          category: 'root',
          name: isSelected ? 'collision' : 'artwork',
        });
      }
    },
    [sendAsync, isCollisionActive]
  );

  const sendLayerAction = useCallback(
    (action, params) => {
      sendAsync('DRAW_TOOL_LAYER_ACTION', { action, ...params });
    },
    [sendAsync]
  );

  const onSelectLayer = useCallback(
    ({ layer, frame }) => {
      // unselect collision if selected
      onSelectCollision(false);

      // select layer
      if (!frame) {
        return sendLayerAction('selectLayer', { layerId: layer.id });
      } else {
        return sendLayerAction('selectLayerAndFrame', { layerId: layer.id, frameIndex: frame });
      }
    },
    [sendLayerAction, onSelectCollision]
  );

  const { showActionSheetWithOptions } = useActionSheet();

  const showCellActionSheet = useCallback(
    ({ frame, layerId, isLinked }) => {
      let options = [
        {
          name: 'Copy',
          action: () => sendLayerAction('copyCell', { frameIndex: frame, layerId }),
        },
      ];

      if (canPasteCell) {
        options.push({
          name: 'Paste',
          action: () => sendLayerAction('pasteCell', { frameIndex: frame, layerId }),
        });
      }

      if (frame > 1) {
        options = [
          {
            name: isLinked ? 'Unlink' : 'Link',
            action: () =>
              sendLayerAction('setCellLinked', {
                frameIndex: frame,
                layerId,
                doubleValue: isLinked ? 0 : 1,
              }),
          },
          ...options,
        ];
      }

      showActionSheetWithOptions(
        {
          title: 'Cell Options',
          options: options.map((option) => option.name).concat(['Cancel']),
          cancelButtonIndex: options.length,
        },
        (buttonIndex) => {
          if (buttonIndex < options.length) {
            return options[buttonIndex].action();
          }
        }
      );
    },
    [canPasteCell, sendLayerAction]
  );

  const showLayerActionSheet = useCallback(
    ({ layerId, index }) => {
      let options = [
        {
          name: 'Delete',
          action: () => sendLayerAction('deleteLayer', { layerId }),
        },
      ];

      if (index > 0) {
        options.push({
          name: 'Move Up',
          action: () => sendLayerAction('setLayerOrder', { layerId, doubleValue: index - 1 }),
        });
      }

      if (index < layers.length - 1) {
        options.push({
          name: 'Move Down',
          action: () => sendLayerAction('setLayerOrder', { layerId, doubleValue: index + 1 }),
        });
      }

      showActionSheetWithOptions(
        {
          title: 'Layer Options',
          options: options.map((option) => option.name).concat(['Cancel']),
          cancelButtonIndex: options.length,
          destructiveButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex < options.length) {
            return options[buttonIndex].action();
          }
        }
      );
    },
    [sendLayerAction, layers?.length]
  );

  const onAddLayer = useCallback(() => sendLayerAction('addLayer'), [sendLayerAction]);
  const onAddFrame = useCallback(() => sendLayerAction('addFrame'), [sendLayerAction]);
  const showFrameActionSheet = useCallback(
    (frame) => {
      let options = [
        {
          name: 'Add Frame After',
          action: () => sendLayerAction('addFrame', { frameIndex: frame + 1 }),
        },
      ];

      if (frame > 1) {
        options = [
          {
            name: 'Delete Frame',
            action: () => sendLayerAction('deleteFrame', { frameIndex: frame }),
          },
          ...options,
        ];
      }

      showActionSheetWithOptions(
        {
          title: 'Frame Options',
          options: options.map((option) => option.name).concat(['Cancel']),
          cancelButtonIndex: options.length,
        },
        (buttonIndex) => {
          if (buttonIndex < options.length) {
            return options[buttonIndex].action();
          }
        }
      );
    },
    [sendLayerAction]
  );

  return (
    <ScrollView
      nestedScrollEnabled
      horizontal
      bounces={false}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}>
      <ScrollView
        nestedScrollEnabled
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}>
        <View style={{ flex: 1 }}>
          <View style={styles.layerRow}>
            <TouchableOpacity onPress={onAddLayer} style={styles.firstCell}>
              <View style={styles.addLayerButton}>
                <MCIcon name={'plus'} size={ICON_SIZE} color={'#000'} />
                <Text style={styles.addLayerText}>Add Layer</Text>
              </View>
            </TouchableOpacity>
            {layers?.length > 0
              ? layers[0].frames.map((frame, idx) => {
                  let isSelected = selectedFrameIndex == idx + 1;
                  let onPress = isSelected
                    ? () => showFrameActionSheet(idx + 1)
                    : () => fastAction('onSelectFrame', idx + 1);

                  return (
                    <TouchableOpacity
                      onPress={onPress}
                      style={[styles.cell, styles.cellLeftBorder, styles.cellBottomBorder]}
                      key={idx}>
                      <Text
                        style={[
                          isSelected && { fontWeight: 'bold', paddingTop: 12, paddingBottom: 2 },
                          { fontSize: 16 },
                        ]}>
                        {idx + 1}
                      </Text>

                      {isSelected && (
                        <MCIcon name={'dots-horizontal'} size={ICON_SIZE} color={'#000'} />
                      )}
                    </TouchableOpacity>
                  );
                })
              : null}
            <TouchableOpacity
              onPress={onAddFrame}
              style={[
                styles.cell,
                styles.cellLeftBorder,
                styles.cellBottomBorder,
                styles.cellRightBorder,
              ]}>
              <MCIcon name={'plus'} size={ICON_SIZE} color={'#000'} style={{ marginTop: 5 }} />
              <Text style={{ letterSpacing: 0.5, paddingTop: 1 }}>FRAME</Text>
            </TouchableOpacity>
          </View>
          {layers?.length
            ? layers.map((layer, idx) => {
                return (
                  <LayerRow
                    key={`layer-${idx}`}
                    index={idx}
                    layer={layer}
                    isSelected={layer.id === selectedLayerId}
                    selectedFrameIndex={selectedFrameIndex}
                    showLayerActionSheet={showLayerActionSheet}
                    showCellActionSheet={showCellActionSheet}
                    onSelectLayer={onSelectLayer}
                    isCollisionActive={isCollisionActive}
                    sendLayerAction={sendLayerAction}
                  />
                );
              })
            : null}
          <CollisionRow onSelect={onSelectCollision} isSelected={isCollisionActive} />
        </View>
      </ScrollView>
    </ScrollView>
  );
};

const DrawingLayersHeader = () => {
  const { numFrames } = useCoreState('EDITOR_DRAW_LAYERS') || {};
  const fastAction = () => {}; // TODO: actions
  const fastData = {}; // TODO: further draw tool state

  return (
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', flexShrink: 1, padding: 8 }}>
        <FeatherIcon name="layers" size={22} color="#000" style={{ marginRight: 12 }} />
        <Text style={styles.headingLabel}>Layers</Text>
      </View>
      {numFrames > 1 && (
        <View style={styles.headerControls}>
          <TouchableOpacity
            style={styles.headerControl}
            onPress={() =>
              fastAction('onSetIsOnionSkinningEnabled', !fastData.isOnionSkinningEnabled)
            }>
            <MCIcon
              name={fastData.isOnionSkinningEnabled ? 'eye-outline' : 'eye-off-outline'}
              size={ICON_SIZE}
              color={'#000'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerControl}
            onPress={() => fastAction('onStepBackward')}>
            <FeatherIcon name={'skip-back'} size={ICON_SIZE} color={'#000'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerControl}
            onPress={() => fastAction('onSetIsPlayingAnimation', !fastData.isPlayingAnimation)}>
            <FeatherIcon
              name={fastData.isPlayingAnimation ? 'pause' : 'play'}
              size={ICON_SIZE}
              color={'#000'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerControl}
            onPress={() => fastAction('onStepForward')}>
            <FeatherIcon name={'skip-forward'} size={ICON_SIZE} color={'#000'} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export const DrawingLayersSheet = ({ isOpen, onClose, ...props }) => {
  const renderHeader = () => <DrawingLayersHeader style={{ flex: 1 }} />;
  const renderContent = () => (!isOpen ? null : <DrawingLayers style={{ flex: 1 }} />);

  return (
    <BottomSheet
      isOpen={isOpen}
      useViewInsteadOfScrollview
      renderContent={renderContent}
      renderHeader={renderHeader}
      style={styles.container}
      {...props}
    />
  );
};
