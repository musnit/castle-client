import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useGhostUI } from '../ghost/GhostUI';
import { useListen } from '../ghost/GhostEvents';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

import * as SceneCreatorConstants from './SceneCreatorConstants';

import { registerElement, getPaneData, ToolPane } from '../Tools';
import { paneVisible } from './SceneCreatorUtilities';

import CardDestinationPickerSheet from '../CardDestinationPickerSheet';
import CardPickerTool from './CardPickerTool';
import SceneCreatorBlueprintsPane from './SceneCreatorBlueprintsPane';
import SceneCreatorInspectorPane from './SceneCreatorInspectorPane';
import SceneCreatorKeyboardWrapper from './SceneCreatorKeyboardWrapper';

let Colors = SceneCreatorConstants.Colors;

const styles = StyleSheet.create({
  toolbar: {
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const GLOBAL_ACTIONS_PANE_KEY = 'sceneCreatorGlobalActions';

const SceneCreatorDefaultPane = ({ context, element }) => (
  <SceneCreatorKeyboardWrapper backgroundColor={element.props.backgroundColor || Colors.background}>
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
  </SceneCreatorKeyboardWrapper>
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

// TODO: only used for testing text actors data, can remove
const SceneCreatorTextActorsTest = ({ context, element }) => {
  return (
    <View style={{ position: 'absolute', width: '100%', top: 48, height: 128 }}>
      <ScrollView style={{ flex: 1 }}>
        <ToolPane
          element={element}
          context={context}
          style={{ padding: 6, backgroundColor: '#f00' }}
        />
      </ScrollView>
    </View>
  );
};

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
    key: 'sceneCreatorInspector',
    shouldRender: (element) => !!element,
    visible: (props) => props.hasSelection,
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
  onSelectElement,
}) => {
  const { root, transformAssetUri } = useGhostUI();
  const destinationPickerRef = React.useRef();
  const onPickDestinationCardCallback = React.useRef();

  // TODO: move navigation up into the main card/deck creator
  const navigation = useNavigation();
  useListen({
    eventName: 'NAVIGATE_TO_CARD',
    handler: ({ card }) => {
      console.log(`navigate to card: ${card.cardId}`);
      /* navigation.navigate('CreateDeck', {
        deckIdToEdit: this.state.deck.deckId,
        cardIdToEdit: updatedBlock.destinationCardId,
      }); */
    },
  });

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

  // Construct context
  const context = {
    transformAssetUri,
    showDestinationPicker,
  };

  const globalActionsData = root.panes ? getPaneData(root.panes[GLOBAL_ACTIONS_PANE_KEY]) : null;
  const hasSelection = globalActionsData?.hasSelection;
  let visibleProps = {
    addingBlueprint,
    hasSelection,
  };

  React.useEffect(() => {
    if (hasSelection) {
      onSelectElement();
    }
  }, [hasSelection]);

  if (!visible || !root.panes) return null;

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
