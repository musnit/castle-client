import React from 'react';
import { KeyboardAvoidingView, View } from 'react-native';
import url from 'url';
import { useGhostUI, useGhostThemeListener } from '../ghost/GhostUI';
import { ScrollView } from 'react-native-gesture-handler';

import * as Constants from '../Constants';
import * as SceneCreatorConstants from './SceneCreatorConstants';

import { ToolPane } from '../Tools';

import SceneCreatorBlueprintsPane from './SceneCreatorBlueprintsPane';
import SceneCreatorInspectorPane from './SceneCreatorInspectorPane';

let Colors = SceneCreatorConstants.Colors;

// Whether a pane should be rendered
const paneVisible = (element) =>
  element &&
  element.props &&
  element.props.visible &&
  element.children &&
  element.children.count > 0;

const KeyboardAwareWrapper = ({ backgroundColor, children }) => {
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      <KeyboardAvoidingView
        pointerEvents="box-none"
        style={{ flex: 1 }}
        behavior={Constants.iOS ? 'padding' : 'height'}
        enabled>
        {children}
      </KeyboardAvoidingView>
    </View>
  );
};

export default SceneCreatorPanes = ({ entryPoint, visible, landscape }) => {
  const { root } = useGhostUI();

  // Construct context
  const context = {
    transformAssetUri: (uri) => url.resolve(entryPoint, uri) || uri,
  };

  if (!visible) return null;

  // TODO: BEN: clean up
  const panes = {
    sceneCreatorGlobalActions: {
      visible: paneVisible,
      render: ({ key, element }) => (
        <ToolPane
          key={key}
          element={element}
          context={{ ...context, hideLabels: true, popoverPlacement: 'bottom' }}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: 8,
            position: 'absolute',
            left: 0,
            right: 0,
            top: 48,
          }}
        />
      ),
    },
    sceneCreatorBlueprints: {
      visible: (element) => !!element,
      render: ({ key, element }) => (
        <KeyboardAwareWrapper key={key}>
          <SceneCreatorBlueprintsPane element={element} context={context} />
        </KeyboardAwareWrapper>
      ),
    },
    DEFAULT: {
      visible: paneVisible,
      render: ({ key, element }) => (
        <KeyboardAwareWrapper
          landscape={landscape}
          key={key}
          backgroundColor={element.props.backgroundColor || Colors.background}>
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
      ),
    },
    toolbar: {
      visible: paneVisible,
      render: ({ key, element }) => (
        <View
          style={{
            backgroundColor: Colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
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
      ),
    },
    sceneCreatorInspector: {
      visible: (element) => !!element,
      render: ({ key, element }) => (
        <KeyboardAwareWrapper key={key}>
          <SceneCreatorInspectorPane
            element={element}
            context={context}
            actionsPane={root.panes.sceneCreatorInspectorActions}
          />
        </KeyboardAwareWrapper>
      ),
    },
  };

  return (
    <React.Fragment>
      {Object.keys(panes).map((key, ii) => {
        const { visible, render } = panes[key];
        if (root.panes && visible(root.panes[key])) {
          return render({
            key,
            element: root.panes[key],
          });
        }
        return null;
      })}
    </React.Fragment>
  );
};
