import AsyncStorage from '@react-native-community/async-storage';

const HISTORY_MAX_LENGTH = 30;
const HISTORY_STORAGE_KEY = `PLAY_DECK_HISTORY`;
const EMPTY_HISTORY = {
  loaded: false,
  items: [],
};

let gHistory = EMPTY_HISTORY;

const _initHistory = async () => {
  let result;
  try {
    result = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    result = JSON.parse(result);
  } catch (e) {
    console.warn(`Unable to fetch history: ${e}`);
  }
  gHistory = result ?? { ...EMPTY_HISTORY, loaded: true };
};

export const addItem = async (deckId) => {
  if (!gHistory.loaded) {
    await _initHistory();
  }
  const existing = gHistory.items.find((item) => item.deckId === deckId);
  if (existing) {
    gHistory.items = gHistory.items.filter((item) => item.deckId !== deckId);
  }
  gHistory.items.unshift({
    deckId,
    time: Date.now(),
  });
  if (gHistory.items.length > HISTORY_MAX_LENGTH) {
    gHistory.items.splice(HISTORY_MAX_LENGTH);
  }
  try {
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(gHistory));
  } catch (e) {
    console.warn(`Unable to save history: ${e}`);
  }
};

export const getItems = async () => {
  if (!gHistory.loaded) {
    await _initHistory();
  }
  return gHistory.items;
};
