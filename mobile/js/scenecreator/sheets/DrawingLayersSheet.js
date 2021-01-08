import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useFastDataMemo } from '../../ghost/GhostUI';
import { useActionSheet } from '@expo/react-native-action-sheet';
import _ from 'lodash';

import { BottomSheet } from '../../components/BottomSheet';

import FastImage from 'react-native-fast-image';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScrollView } from 'react-native-gesture-handler';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  header: {
    padding: 16,
    height: 64,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerControls: {
    width: 150,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingRight: 12,
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
  layerMenuContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 50,
    height: 64,
  },
  layerMenuButton: {
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

const LayerRow = ({ layer, index, showLayerActionSheet }) => {
  return (
    <View style={styles.layerRow}>
      <TouchableOpacity
        style={styles.firstCell}
        onPress={() => layer.fastAction('onSelectLayer', layer.id)}>
        <TouchableOpacity
          onPress={() =>
            layer.fastAction('onSetLayerIsVisible', {
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
        <View style={styles.layerTitle}>
          <Text style={[styles.layerTitleText, layer.isSelected && { fontWeight: 'bold' }]}>
            {layer.title}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => showLayerActionSheet({ layerId: layer.id, index })}
          style={styles.layerMenuContainer}>
          <View style={styles.layerMenuButton}>
            <MCIcon name={'dots-horizontal'} size={ICON_SIZE} color={'#fff'} />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
      {layer.frames.map((frame, idx) => {
        let isSelected = layer.selectedFrame == idx + 1 && layer.isSelected;
        let isMenuAvailable = isSelected && idx > 0;
        let onPress = isMenuAvailable
          ? () =>
              layer.showCellActionSheet({
                isLinked: frame.isLinked,
                layerId: layer.id,
                frame: idx + 1,
              })
          : () =>
              layer.fastAction('onSelectLayerAndFrame', {
                frame,
                layerId: layer.id,
                frame: idx + 1,
              });

        let cellStyle = [styles.cell];
        let isLastCell = idx === layer.frames.length - 1;

        if (isSelected) {
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

const DrawingLayers = useFastDataMemo('draw-layers', ({ fastData, fastAction }) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const [stateLayers, setStateLayers] = React.useState([]);
  const [stateSelectedFrame, setStateSelectedFrame] = React.useState(1);

  const showCellActionSheet = useCallback((args) => {
    let options = [
      {
        name: args.isLinked ? 'Unlink' : 'Link',
        action: () => {
          fastAction('onSetCellLinked', {
            frame: args.frame,
            layerId: args.layerId,
            isLinked: !args.isLinked,
          });
        },
      },
    ];

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
  }, []);

  const showLayerActionSheet = useCallback(
    (args) => {
      let options = [
        {
          name: 'Delete',
          action: () => {
            fastAction('onDeleteLayer', args.layerId);
          },
        },
      ];

      if (args.index > 0) {
        options.push({
          name: 'Move Up',
          action: () => {
            let ids = stateLayers.map((layer) => layer.id);
            ids.splice(args.index, 1);
            ids.splice(args.index - 1, 0, args.layerId);

            fastAction('onReorderLayers', ids);
          },
        });
      }

      if (args.index < stateLayers.length - 1) {
        options.push({
          name: 'Move Down',
          action: () => {
            let ids = stateLayers.map((layer) => layer.id);
            ids.splice(args.index, 1);
            ids.splice(args.index + 1, 0, args.layerId);

            fastAction('onReorderLayers', ids);
          },
        });
      }

      showActionSheetWithOptions(
        {
          title: 'Layer Options',
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
    [stateLayers]
  );

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
        layer.showCellActionSheet = showCellActionSheet;
        layer.showLayerActionSheet = showLayerActionSheet;
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
    setStateSelectedFrame(fastData.selectedFrame);
  }, [fastData.selectedFrame]);

  const onAddLayer = useCallback(() => fastAction('onAddLayer'), []);
  const onAddFrame = useCallback(() => fastAction('onAddFrame'), []);
  const showFrameActionSheet = useCallback((frame) => {
    let options = [
      {
        name: 'Add Frame After',
        action: () => {
          fastAction('onAddFrameAtPosition', frame);
        },
      },
    ];

    if (frame > 1) {
      options = [
        {
          name: 'Delete Frame',
          action: () => {
            fastAction('onDeleteFrame', frame);
          },
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
  }, []);

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
                <MCIcon name={'plus-box-outline'} size={ICON_SIZE} color={'#000'} />
                <Text style={styles.addLayerText}>Add Layer</Text>
              </View>
            </TouchableOpacity>
            {stateLayers.length > 0 &&
              stateLayers[0].frames.map((frame, idx) => {
                let isSelected = stateSelectedFrame == idx + 1;
                let onPress = isSelected
                  ? () => showFrameActionSheet(idx + 1)
                  : () => fastAction('onSelectFrame', idx + 1);

                return (
                  <TouchableOpacity
                    onPress={onPress}
                    style={[styles.cell, styles.cellLeftBorder, styles.cellBottomBorder]}
                    key={idx}>
                    <Text style={[isSelected && { fontWeight: 'bold' }, { fontSize: 16 }]}>
                      {idx + 1}
                    </Text>

                    {isSelected && (
                      <View style={styles.cellMenuButton}>
                        <MCIcon name={'dots-horizontal'} size={ICON_SIZE} color={'#fff'} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            <TouchableOpacity
              onPress={onAddFrame}
              style={[
                styles.cell,
                styles.cellLeftBorder,
                styles.cellBottomBorder,
                styles.cellRightBorder,
              ]}>
              <Text>+</Text>
            </TouchableOpacity>
          </View>
          {stateLayers.map((layer, idx) => {
            return (
              <LayerRow
                key={idx}
                index={idx}
                layer={layer}
                showLayerActionSheet={showLayerActionSheet}
              />
            );
          })}
        </View>
      </ScrollView>
    </ScrollView>
  );
});

const DrawingLayersHeader = useFastDataMemo('draw-layers', ({ fastData, fastAction }) => {
  const [numFrames, setNumFrames] = React.useState(1);

  useEffect(() => {
    if (fastData.layers) {
      let newLayers = JSON.parse(JSON.stringify(fastData.layers));
      if (!Array.isArray(newLayers)) {
        newLayers = Object.values(newLayers);
      }

      setNumFrames(Object.values(newLayers[0].frames).length);
    }
  }, [fastData]);

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headingLabel}>Layers</Text>
      </View>
      <View style={styles.headerControls}>
        <TouchableOpacity
          onPress={() =>
            fastAction('onSetIsOnionSkinningEnabled', !fastData.isOnionSkinningEnabled)
          }>
          <MCIcon
            name={fastData.isOnionSkinningEnabled ? 'check-circle' : 'check-circle-outline'}
            size={ICON_SIZE}
            color={'#000'}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => fastAction('onStepBackward')}>
          <MCIcon name={'step-backward'} size={ICON_SIZE} color={'#000'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => fastAction('onSetIsPlayingAnimation', !fastData.isPlayingAnimation)}>
          <MCIcon
            name={fastData.isPlayingAnimation ? 'pause' : 'play'}
            size={ICON_SIZE}
            color={'#000'}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => fastAction('onStepForward')}>
          <MCIcon name={'step-forward'} size={ICON_SIZE} color={'#000'} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export const DrawingLayersSheet = ({ onClose, ...props }) => {
  const renderHeader = () => <DrawingLayersHeader style={{ flex: 1 }} />;
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
