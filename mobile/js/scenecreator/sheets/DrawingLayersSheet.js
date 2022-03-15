import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../../components/AppText';
import { BottomSheet } from '../../components/BottomSheet';
import { launchImageLibrary } from '../../common/utilities';
import { ScrollView } from 'react-native-gesture-handler';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useCoreState, sendAsync } from '../../core/CoreEvents';

import * as Constants from '../../Constants';
import * as Utilities from '../../common/utilities';
import * as SceneCreatorConstants from '../SceneCreatorConstants';

import FastImage from 'react-native-fast-image';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';

Utilities.preloadImageRequires([
  require('../../../assets/images/arrow2.png'),
  require('../../../assets/images/arrow1.png'),
]);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
    borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#000',
  },
  header: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    marginRight: 8,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  headerControl: {
    padding: 8,
  },
  image: {
    width: 36,
    height: 36,
  },
  linkedImage: {
    width: 54,
    height: 54,
  },
  headingLabel: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  layerRow: {
    height: 54,
    flexDirection: 'row',
  },
  lastLayerRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  firstCell: {
    flexDirection: 'row',
    width: 180,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    padding: 16,
    paddingRight: 6,
  },
  newLayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingLeft: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: -1,
  },
  newLayerLabel: {
    flex: 1,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addLayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 3,
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
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellTopBorder: {
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  cellLeftBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#ccc',
  },
  cellRightBorder: {
    width: 55,
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  cellSelected: {
    height: 55,
    position: 'relative',
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

const SelectImageButton = ({ sendLayerAction }) => {
  const selectImage = React.useCallback(
    () =>
      launchImageLibrary(
        ({ uri }) => {
          sendLayerAction('importImage', { stringValue: uri });
        },
        { noUpload: true }
      ),
    [sendLayerAction]
  );

  return (
    <Pressable onPress={selectImage} style={SceneCreatorConstants.styles.button}>
      <MCIcon
        name="file-image-outline"
        size={22}
        color="#000"
        style={SceneCreatorConstants.styles.buttonIcon}
      />
      <Text style={SceneCreatorConstants.styles.buttonLabel}>Image</Text>
    </Pressable>
  );
};

const CollisionRow = ({ isSelected, onSelect, previewPng, numFrames, isVisible, setVisible }) => {
  let placeholderFrames = [];
  if (numFrames > 1) {
    for (let ii = 1; ii < numFrames; ii++) {
      const isLastFrame = ii === numFrames - 1;
      placeholderFrames.push(
        <View
          key={`placeholder-${ii}`}
          style={[
            styles.cell,
            styles.cellTopBorder,
            isLastFrame ? styles.cellRightBorder : undefined,
          ]}>
          <FastImage
            style={styles.linkedImage}
            source={
              isLastFrame
                ? require('../../../assets/images/arrow2.png')
                : require('../../../assets/images/arrow1.png')
            }
          />
        </View>
      );
    }
  }
  let cellStyle = [styles.cell];
  if (isSelected) {
    cellStyle.push(styles.cellSelected);
  } else {
    cellStyle.push(styles.cellTopBorder);
    cellStyle.push(styles.cellLeftBorder);
  }

  return (
    <Pressable style={styles.layerRow} onPress={() => onSelect(true)}>
      <View style={styles.firstCell}>
        <Pressable onPress={() => setVisible(!isVisible)}>
          <MCIcon
            name={isVisible ? 'eye-outline' : 'eye-off-outline'}
            size={ICON_SIZE}
            color="#000"
          />
        </Pressable>
        <View style={styles.layerTitle}>
          <Text style={[styles.layerTitleText, { fontWeight: isSelected ? '600' : 'normal' }]}>
            Collision
          </Text>
        </View>
        <View style={styles.layerMenuButton}>
          {/* ellipsis button is currently not used for collision */}
          <MCIcon name={'dots-horizontal'} size={ICON_SIZE} color={'#fff'} />
        </View>
      </View>
      <View style={[...cellStyle, numFrames < 2 ? styles.cellRightBorder : undefined]}>
        <FastImage source={{ uri: `data:image/png;base64,${previewPng}` }} style={styles.image} />
      </View>
      {placeholderFrames}
    </Pressable>
  );
};

const FrameCell = ({ frames, frame, idx, onPress, isSelected }) => {
  let cellStyle = [styles.cell];
  let isLastCell = idx === frames.length - 1;

  if (isSelected) {
    cellStyle.push(styles.cellSelected);
  } else {
    cellStyle.push(styles.cellTopBorder);

    if (!frame.isLinked) {
      cellStyle.push(styles.cellLeftBorder);
    }

    if (isLastCell) {
      cellStyle.push(styles.cellRightBorder);
    }
  }

  let isLastLink = isLastCell || !frames[idx + 1].isLinked;

  return (
    <Pressable onPress={onPress} style={cellStyle}>
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

      {isSelected && (
        <View style={styles.cellMenuButton}>
          <MCIcon name={'dots-horizontal'} size={ICON_SIZE} color={'#fff'} />
        </View>
      )}
    </Pressable>
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
      <Pressable style={styles.firstCell} onPress={() => onSelectLayer({ layer })}>
        <Pressable
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
        </Pressable>
        <View style={styles.layerTitle}>
          <Text
            style={[
              styles.layerTitleText,
              { fontWeight: isSelected && !isCollisionActive ? '600' : 'normal' },
            ]}>
            {layer.title}
          </Text>
        </View>
        {isSelected ? (
          <Pressable onPress={() => showLayerActionSheet({ layerId: layer.id, index })}>
            <View style={styles.layerMenuButton}>
              <MCIcon name={'dots-horizontal'} size={ICON_SIZE} color={'#000'} />
            </View>
          </Pressable>
        ) : null}
      </Pressable>
      {layer.frames.map((frame, idx) => {
        let isFrameSelected = selectedFrameIndex === idx + 1 && isSelected && !isCollisionActive;
        let onPress = isFrameSelected
          ? () =>
              showCellActionSheet({
                isLinked: frame.isLinked,
                layerId: layer.id,
                isBitmap: layer.isBitmap,
                frame: idx + 1,
              })
          : () => onSelectLayer({ layer, frame: idx + 1 });
        return (
          <FrameCell
            key={`frame-${idx}`}
            frame={frame}
            idx={idx}
            frames={layer.frames}
            onPress={onPress}
            isSelected={isFrameSelected}
          />
        );
      })}
    </View>
  );
};

const DrawingLayers = ({ sendLayerAction }) => {
  const {
    layers,
    selectedLayerId,
    selectedFrameIndex,
    canPasteCell,
    copiedCellIsBitmap,
    collisionBase64Png,
    isCollisionVisible,
  } = useCoreState('EDITOR_DRAW_LAYERS') || {
    selectedFrameIndex: 1,
  };
  const drawToolState = useCoreState('EDITOR_DRAW_TOOL') || {};

  const isCollisionActive = drawToolState.selectedSubtools?.root === 'collision';
  const onSelectCollision = React.useCallback(
    (isSelected, isLayerBitmap) => {
      sendAsync('DRAW_TOOL_SELECT_SUBTOOL', {
        category: 'root',
        name: isSelected ? 'collision' : isLayerBitmap ? 'bitmap' : 'artwork',
      });
    },
    [isCollisionActive]
  );

  const onSelectLayer = useCallback(
    ({ layer, frame }) => {
      // unselect collision if selected
      onSelectCollision(false, layer.isBitmap);

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
    ({ frame, layerId, isBitmap, isLinked }) => {
      let options = [
        {
          name: isBitmap ? 'Copy Bitmap' : 'Copy',
          action: () => sendLayerAction('copyCell', { frameIndex: frame, layerId }),
        },
      ];

      if (canPasteCell && isBitmap === copiedCellIsBitmap) {
        options.push({
          name: copiedCellIsBitmap ? 'Paste Bitmap' : 'Paste',
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
    [canPasteCell, copiedCellIsBitmap, sendLayerAction, showActionSheetWithOptions]
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
          name: 'Move Down',
          action: () => sendLayerAction('setLayerOrder', { layerId, doubleValue: index - 1 }),
        });
      }

      if (index < layers.length - 1) {
        options.push({
          name: 'Move Up',
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
    [sendLayerAction, layers?.length, showActionSheetWithOptions]
  );

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
    [sendLayerAction, showActionSheetWithOptions]
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
          <View style={{ flexDirection: 'column-reverse' }}>
            <CollisionRow
              onSelect={onSelectCollision}
              isSelected={isCollisionActive}
              previewPng={collisionBase64Png}
              numFrames={layers?.length ? layers[0].frames.length : 0}
              isVisible={isCollisionVisible}
              setVisible={(visible) =>
                sendLayerAction('setCollisionIsVisible', { doubleValue: visible ? 1 : 0 })
              }
            />
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
          </View>
          <View style={[styles.layerRow, styles.lastLayerRow]}>
            <View style={styles.firstCell}>
              <Text style={styles.newLayerLabel}>Animation Frames</Text>
            </View>
            {layers?.length > 0
              ? layers[0].frames.map((frame, idx) => {
                  let isSelected = selectedFrameIndex === idx + 1;
                  let onPress = isSelected
                    ? () => showFrameActionSheet(idx + 1)
                    : () => sendLayerAction('selectFrame', { frameIndex: idx + 1 });

                  return (
                    <Pressable
                      onPress={onPress}
                      style={[styles.cell, styles.cellLeftBorder, styles.cellTopBorder]}
                      key={idx}>
                      <Text
                        style={[
                          isSelected && { fontWeight: '600', paddingTop: 8 },
                          { fontSize: 16 },
                        ]}>
                        {idx + 1}
                      </Text>

                      {isSelected && (
                        <MCIcon name={'dots-horizontal'} size={ICON_SIZE} color={'#000'} />
                      )}
                    </Pressable>
                  );
                })
              : null}
            <Pressable
              onPress={onAddFrame}
              style={[
                styles.cell,
                styles.cellTopBorder,
                styles.cellLeftBorder,
                styles.cellRightBorder,
              ]}>
              <MCIcon name="plus" size={ICON_SIZE} color="#000" style={{ marginTop: 0 }} />
              <Text style={{ fontSize: 14, letterSpacing: 0.5, paddingTop: 1 }}>ADD</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScrollView>
  );
};

const DrawingLayersHeader = ({ sendLayerAction }) => {
  const { numFrames, isOnionSkinningEnabled, isPlayingAnimation } =
    useCoreState('EDITOR_DRAW_LAYERS') || {};
  const onAddLayer = useCallback(() => sendLayerAction('addLayer'), [sendLayerAction]);

  return (
    <>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', flexShrink: 1, padding: 8 }}>
          <Text style={styles.headingLabel}>Layers</Text>
        </View>
        {numFrames > 1 ? (
          <View style={styles.headerControls}>
            <Pressable
              style={styles.headerControl}
              onPress={() =>
                sendLayerAction('enableOnionSkinning', {
                  doubleValue: isOnionSkinningEnabled ? 0 : 1,
                })
              }>
              <MCIcon
                name={isOnionSkinningEnabled ? 'eye-outline' : 'eye-off-outline'}
                size={ICON_SIZE}
                color="#000"
              />
            </Pressable>
            <Pressable style={styles.headerControl} onPress={() => sendLayerAction('stepBackward')}>
              <FeatherIcon name="skip-back" size={ICON_SIZE} color="#000" />
            </Pressable>
            <Pressable
              style={styles.headerControl}
              onPress={() =>
                sendLayerAction('setIsPlayingAnimation', {
                  doubleValue: isPlayingAnimation ? 0 : 1,
                })
              }>
              <FeatherIcon
                name={isPlayingAnimation ? 'pause' : 'play'}
                size={ICON_SIZE - 2}
                color="#000"
              />
            </Pressable>
            <Pressable style={styles.headerControl} onPress={() => sendLayerAction('stepForward')}>
              <FeatherIcon name="skip-forward" size={ICON_SIZE} color="#000" />
            </Pressable>
          </View>
        ) : (
          <View style={{ width: 64, height: 16, flexShrink: 1 }} />
        )}
      </View>

      <View style={styles.newLayerRow}>
        <Text style={styles.newLayerLabel}>New Layer</Text>
        <Pressable
          onPress={onAddLayer}
          style={[SceneCreatorConstants.styles.button, { marginRight: 8 }]}>
          <MCIcon
            name="shape-outline"
            size={22}
            color="#000"
            style={SceneCreatorConstants.styles.buttonIcon}
          />
          <Text style={SceneCreatorConstants.styles.buttonLabel}>Drawing</Text>
        </Pressable>
        <SelectImageButton sendLayerAction={sendLayerAction} />
      </View>
    </>
  );
};

export const DrawingLayersSheet = ({ isOpen, onClose, ...props }) => {
  const sendLayerAction = useCallback(
    (action, params) => sendAsync('DRAW_TOOL_LAYER_ACTION', { action, ...params }),
    []
  );

  const renderHeader = () => <DrawingLayersHeader sendLayerAction={sendLayerAction} />;
  const renderContent = () =>
    !isOpen ? null : <DrawingLayers sendLayerAction={sendLayerAction} />;

  return (
    <BottomSheet
      isOpen={isOpen}
      initialSnap={1}
      useViewInsteadOfScrollview
      renderContent={renderContent}
      renderHeader={renderHeader}
      style={styles.container}
      {...props}
    />
  );
};
