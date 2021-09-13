import * as Constants from '../Constants';

import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
import icoMoonConfig from '../../assets/icoMoonConfig.json';
export const CastleIcon = createIconSetFromIcoMoon(icoMoonConfig, 'CastleIcon', 'CastleIcon.ttf');

export const OVERLAY_BORDER_RADIUS = 8;

export const Colors = {
  background: '#fff',
  text: '#222',

  button: {
    text: '#222',
    default: '#eee',
    selected: '#cde1ff',
  },

  textInput: {
    text: '#222',
    background: '#fff',
    border: '#ccc',
  },

  popover: {
    background: '#fff',
    shadow: '#0002',
  },
};

export const styles = {
  button: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: Constants.iOS ? 1 : undefined,
    borderColor: '#000',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  buttonLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  behaviorContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderRadius: 6,
    borderColor: Constants.colors.black,
  },
  behaviorHeader: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  behaviorHeaderName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  behaviorHeaderRemoveButton: {
    marginLeft: 8,
  },
  behaviorProperties: {
    padding: 12,
    paddingBottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  insetContainer: {
    marginTop: 16,
    paddingTop: 7,
    paddingLeft: 16,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopLeftRadius: 6,
    borderColor: '#ccc',
  },
};

export const EMPTY_VARIABLE = {
  variableId: 0,
  name: '',
  initialValue: 0,
};
