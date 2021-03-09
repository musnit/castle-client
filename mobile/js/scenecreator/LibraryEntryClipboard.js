import * as GhostEvents from '../ghost/GhostEvents';

let gLibraryEntryClipboard;

GhostEvents.listen('COPY_LIBRARY_ENTRY_DATA', (params) => {
  try {
    const entry = JSON.parse(params.data);
    gLibraryEntryClipboard = entry;
  } catch (e) {
    console.warn(`Could not parse clipboard data from lua: ${e}`);
  }
});

export const setLibraryEntryAsClipboard = (entry) => {
  GhostEvents.sendAsync('COPY_LIBRARY_ENTRY', { entryId: entry.entryId });
  // expect to assign clipboard in COPY_LIBRARY_ENTRY_DATA handler
};

export const sync = () => {
  // tell lua which entry id already exists in the clipboard, if any
  const entry = gLibraryEntryClipboard;
  if (entry?.entryId) {
    GhostEvents.sendAsync('SYNC_COPIED_LIBRARY_ENTRY', { entryId: entry.entryId });
  }
};

export const isLibraryEntryClipboardEmpty = () => gLibraryEntryClipboard === undefined;

export const getLibraryEntryClipboard = () => gLibraryEntryClipboard;
