import * as Constants from '../Constants';

export const OVERLAY_BORDER_RADIUS = 8;

export const USE_CLOCK = true;
export const USE_LOCAL_VARIABLES = true;

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
  boxShadow: {
    ...Constants.styles.dropShadow,
  },
  button: {
    ...Constants.styles.dropShadow,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginLeft: -2,
    marginRight: 4,
  },
  buttonLabel: {
    color: '#000',
    fontSize: 16,
  },
  behaviorContainer: {
    backgroundColor: '#fff',
    ...Constants.styles.dropShadow,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
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
    fontWeight: '600',
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
  inspectorSection: {
    padding: 16,
    borderColor: '#ccc',
  },
  inspectorSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inspectorSectionHeaderLabel: {
    fontWeight: '600',
    fontSize: 16,
  },
  inspectorSectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inspectorSectionHeaderButton: {
    ...Constants.styles.dropShadow,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
};

export const EMPTY_VARIABLE = {
  variableId: 0,
  name: '',
  initialValue: 0,
  lifetime: 'deck',
};
