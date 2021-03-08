import * as GhostEvents from '../ghost/GhostEvents';

let gLibraryEntryClipboard;

export const setLibraryEntryAsClipboard = (entry) => {
  gLibraryEntryClipboard = JSON.parse(JSON.stringify(entry));
  sync();
};

export const sync = () => {
  const entry = gLibraryEntryClipboard;
  if (entry?.entryId) {
    GhostEvents.sendAsync('COPY_LIBRARY_ENTRY', { entryId: entry.entryId });
  }
};

export const isLibraryEntryClipboardEmpty = () => gLibraryEntryClipboard === undefined;

export const getLibraryEntryClipboard = () => gLibraryEntryClipboard;
