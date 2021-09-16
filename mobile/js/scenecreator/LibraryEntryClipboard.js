import { sendAsync } from '../core/CoreEvents';

export const copySelectedBlueprint = () => {
  sendAsync('COPY_SELECTED_BLUEPRINT', {});
};

export const pasteBlueprint = () => {
  sendAsync('PASTE_BLUEPRINT', {});
};

// TODO: clean up this file
