import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useGhostUI } from '../ghost/GhostUI';

import * as Constants from '../Constants';

import SceneCreatorKeyboardWrapper from './SceneCreatorKeyboardWrapper';
import SceneCreatorPane from './SceneCreatorPane';
import { ToolPane } from '../Tools';

export default SceneCreatorInspectorPane = ({ element, visible, context }) => {
  const { root } = useGhostUI();
  const actionsPane = root.panes.sceneCreatorInspectorActions;

  // Do this so we can show last visible elements while animating out
  const [lastVisibleElements, setLastVisibleElements] = useState({ element, actionsPane });
  useEffect(() => {
    if (visible) {
      setLastVisibleElements({ element, actionsPane });
    }
  }, [visible, element, actionsPane]);

  const renderHeader = () => (
    <React.Fragment>
      {actionsPane ? (
        <ToolPane
          pointerEvents={visible ? 'auto' : 'none'}
          element={visible ? actionsPane : lastVisibleElements.actionsPane}
          context={{ ...context, hideLabels: true, popoverPlacement: 'top' }}
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            padding: 8,
          }}
        />
      ) : null}
      <View
        style={{
          backgroundColor: '#fff',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          padding: 16,
          marginTop: 8,
        }}>
        <View style={Constants.styles.paneHandle}></View>
      </View>
    </React.Fragment>
  );

  return (
    <SceneCreatorKeyboardWrapper>
      <SceneCreatorPane
        visible={visible}
        element={
          visible
            ? element
            : {
                ...lastVisibleElements.element,
                props: { ...lastVisibleElements.element.props },
              }
        }
        context={context}
        middleSnapPoint={400}
        bottomSnapPoint={92}
        renderHeader={renderHeader}
      />
    </SceneCreatorKeyboardWrapper>
  );
};
