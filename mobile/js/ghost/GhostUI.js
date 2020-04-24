import React from 'react';
import { useListen } from './GhostEvents';

/**
 *  GhostUI manages the state of the castle tool ui "DOM".
 *  We listen for diffs to the tree via a channel from lua
 *  and apply them to the root node.
 *
 *  const { root, setRoot } = useGhostUI();
 */

const GhostUIContext = React.createContext({
  root: {},
  setRoot: (root) => {},
});

// We get state diffs from Lua. This function applies those diffs to
// a previous state to produce the new state.
const applyDiff = (t, diff) => {
  if (diff == null) {
    return t;
  }

  // If it's an exact diff just return it
  if (diff.__exact) {
    delete diff.__exact;
    return diff;
  }

  // Copy untouched keys, then apply diffs to touched keys
  t = typeof t === 'object' ? t : {};
  const u = {};
  for (let k in t) {
    if (!(k in diff)) {
      u[k] = t[k];
    }
  }
  for (let k in diff) {
    const v = diff[k];
    if (typeof v === 'object') {
      u[k] = applyDiff(t[k], v);
    } else if (v !== '__NIL') {
      u[k] = v;
    }
  }
  return u;
};

export const Provider = (props) => {
  // Maintain tools state
  const [root, setRoot] = React.useState({});

  // Listen for updates
  useListen({
    eventName: 'CASTLE_TOOLS_UPDATE',
    handler: (diffJson) => {
      const diff = JSON.parse(diffJson);
      setRoot((oldRoot) => applyDiff(oldRoot, diff));
    },
  });

  const forceRender = React.useCallback(() => setRoot(JSON.parse(JSON.stringify(root))), [root]);

  const value = {
    root,
    setRoot,
    forceRender,
  };

  return <GhostUIContext.Provider value={value}>{props.children}</GhostUIContext.Provider>;
};

export const useGhostUI = () => React.useContext(GhostUIContext);

export const useGhostThemeListener = ({ setLightColors, setDarkColors }) => {
  const { forceRender } = useGhostUI();
  React.useEffect(() => {
    setLightColors();
    forceRender();
  }, []);
  useListen({
    eventName: 'CASTLE_TOOLS_COLORS',
    handler: ({ isDark = false } = {}) => {
      if (isDark) {
        setDarkColors();
      } else {
        setLightColors();
      }
      forceRender();
    },
  });
};
