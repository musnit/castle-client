import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useGhostUI } from '../ghost/GhostUI';
import { ScrollView } from 'react-native-gesture-handler';

import * as SceneCreatorConstants from './SceneCreatorConstants';

import { registerElement, ToolPane } from '../Tools';
import { paneVisible } from './SceneCreatorUtilities';

import CardDestinationPickerSheet from '../CardDestinationPickerSheet';
import CardPickerTool from './CardPickerTool';
import SceneCreatorBlueprintsPane from './SceneCreatorBlueprintsPane';
import SceneCreatorInspectorPane from './SceneCreatorInspectorPane';
import SceneCreatorDrawingPane from './SceneCreatorDrawingPane';

let Colors = SceneCreatorConstants.Colors;

const styles = StyleSheet.create({
  toolbar: {
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const SceneCreatorDefaultPane = ({ context, element }) => (
  <View style={{ backgroundColor: element.props.backgroundColor || Colors.background }}>
    {element.props.customLayout ? (
      <ToolPane element={element} context={context} style={{ flex: 1 }} />
    ) : (
      <ScrollView style={{ flex: 1 }}>
        <ToolPane
          element={element}
          context={context}
          style={{ padding: 6, backgroundColor: Colors.background }}
        />
      </ScrollView>
    )}
  </View>
);

const SceneCreatorToolbar = ({ context, element }) => (
  <View style={styles.toolbar}>
    {element.props.customLayout ? (
      <ToolPane
        element={element}
        context={{ ...context, hideLabels: true, popoverPlacement: 'bottom' }}
        style={{ alignSelf: 'stretch' }}
      />
    ) : (
      <ScrollView horizontal={true} alwaysBounceHorizontal={false}>
        <ToolPane
          element={element}
          context={{ ...context, hideLabels: true, popoverPlacement: 'bottom' }}
          style={{
            paddingHorizontal: 6,
            paddingVertical: 4,
            maxHeight: 72,
            flexDirection: 'row',
          }}
        />
      </ScrollView>
    )}
  </View>
);

/**
 *  List of panes we expect from lua.
 *  Render <Component /> containing root.panes[key].
 */
const panes = [
  {
    key: 'sceneCreatorBlueprints',
    shouldRender: (element) => !!element,
    visible: (props) => props.addingBlueprint,
    Component: SceneCreatorBlueprintsPane,
  },
  {
    key: 'DEFAULT',
    Component: SceneCreatorDefaultPane,
  },
  {
    key: 'toolbar',
    Component: SceneCreatorToolbar,
  },
  {
    key: 'sceneCreatorTool',
    shouldRender: (element) => !!element,
    visible: (props) => props.isDrawing,
    Component: SceneCreatorDrawingPane,
  },
  {
    key: 'sceneCreatorInspector',
    shouldRender: (element) => !!element,
    visible: (props) => props.hasSelection && !props.isDrawing,
    Component: SceneCreatorInspectorPane,
  },
];

/**
 *  Tool extensions for scene creator
 */
registerElement('cardPicker', CardPickerTool);

export default SceneCreatorPanes = ({
  deck,
  entryPoint,
  visible,
  addingBlueprint,
  hasSelection,
  isDrawing,
  ...props
}) => {
  const { root, transformAssetUri } = useGhostUI();
  const destinationPickerRef = React.useRef();
  const onPickDestinationCardCallback = React.useRef();

  const dismissDestinationPicker = React.useCallback(() => {
    if (destinationPickerRef.current) {
      destinationPickerRef.current.close();
    }
    onPickDestinationCardCallback.current = null;
  }, [destinationPickerRef.current]);

  const showDestinationPicker = React.useCallback(
    (callback) => {
      if (destinationPickerRef.current) {
        destinationPickerRef.current.open();
        onPickDestinationCardCallback.current = callback;
      }
    },
    [destinationPickerRef.current]
  );

  const onPickDestinationCard = React.useCallback(
    (card) => {
      if (card && card.cardId) {
        if (onPickDestinationCardCallback.current) {
          onPickDestinationCardCallback.current({
            cardId: card.cardId,
            title: card.title,
          });
        }
      }
      dismissDestinationPicker();
    },
    [onPickDestinationCardCallback.current, dismissDestinationPicker]
  );

  if (!visible || !root.panes) return null;

  // Construct context
  const context = {
    transformAssetUri,
    showDestinationPicker,
    deck,
  };

  let visibleProps = {
    addingBlueprint,
    hasSelection,
    isDrawing,
  };

  return (
    <React.Fragment>
      {panes.map((pane, ii) => {
        const { key, shouldRender = paneVisible, visible = () => false, Component } = pane;
        if (shouldRender(root.panes[key])) {
          return (
            <Component
              key={key}
              visible={visible(visibleProps)}
              element={root.panes[key]}
              context={context}
              {...props}
            />
          );
        }
        return null;
      })}
      <CardDestinationPickerSheet
        deck={deck}
        ref={destinationPickerRef}
        onSelectCard={onPickDestinationCard}
      />
    </React.Fragment>
  );
};
