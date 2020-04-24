import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useGhostUI } from '../ghost/GhostUI';
import { ScrollView } from 'react-native-gesture-handler';

import * as SceneCreatorConstants from './SceneCreatorConstants';

import { ToolPane } from '../Tools';
import { paneVisible } from './SceneCreatorUtilities';

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

const SceneCreatorDefaultPane = ({ context, element }) => (
  <KeyboardAwareWrapper backgroundColor={element.props.backgroundColor || Colors.background}>
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
  </KeyboardAwareWrapper>
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
    visible: (element) => !!element,
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
    visible: (element) => !!element,
    Component: SceneCreatorInspectorPane,
  },
];

export default SceneCreatorPanes = ({ entryPoint, visible, landscape }) => {
  const { root, transformAssetUri } = useGhostUI();

  // Construct context
  const context = {
    transformAssetUri,
  };

  if (!visible) return null;

  return (
    <React.Fragment>
      {panes.map((pane, ii) => {
        const { key, visible = paneVisible, Component } = pane;
        if (root.panes && visible(root.panes[key])) {
          return <Component key={key} element={root.panes[key]} context={context} />;
        }
        return null;
      })}
    </React.Fragment>
  );
};
