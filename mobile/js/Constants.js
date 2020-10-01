import { Platform } from 'react-native';

export const iOS = Platform.OS === 'ios';
export const Android = Platform.OS === 'android';

export const CARD_RATIO = 5 / 7;
export const CARD_BORDER_RADIUS = 12;
export const CARD_SMALL_BORDER_RADIUS = 6;
export const GRID_PADDING = 8;

export const styles = {
  dropShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: iOS ? 1 : undefined,
  },
  dropShadowUp: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 1,
    elevation: iOS ? 1 : undefined, // TODO: unbreak this for android bottom sheet
  },
  textShadow: {
    textShadowColor: '#0004',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  plainButton: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  plainButtonLabel: {
    color: '#000',
    fontSize: 16,
  },
  primaryButton: {
    borderRadius: 6,
    paddingTop: 4,
    paddingBottom: 5,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonLabel: {
    color: '#000',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: 'bold',
  },
  primaryButtonIconLeft: {
    marginLeft: -5,
    marginRight: 6,
    marginBottom: -1,
  },
  primaryButtonIconRight: {
    marginRight: -5,
    marginLeft: 6,
    marginBottom: -1,
  },
  secondaryButton: {
    borderRadius: 6,
    paddingTop: 4,
    paddingBottom: 6,
    paddingHorizontal: 12,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonLabel: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: 'bold',
  },
  secondaryButtonIconLeft: {
    marginLeft: -5,
    marginRight: 6,
    marginBottom: -1,
  },
  paneHandle: {
    width: 50,
    alignSelf: 'center',
    paddingTop: 4,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  gridContainer: {
    paddingTop: 16,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    paddingBottom: GRID_PADDING,
  },
  textInputOnWhite: {
    borderWidth: 1,
    borderTopWidth: 2,
    borderRadius: 4,
    color: '#000',
    borderColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 16,
  },
  textInputLabelOnWhite: {
    fontSize: 16,
    marginBottom: 6,
  },
  buttonOnWhite: {
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  buttonLabelOnWhite: {
    fontWeight: 'bold',
    fontSize: 16,
  },
};

export const colors = {
  black: '#000',
  grayText: '#888',
  grayOnWhiteBorder: '#ccc',
  grayOnBlackBorder: '#444',
  white: '#fff',
};

export const EMPTY_CARD = {
  title: '',
  blocks: [],
  scene: {
    sceneId: Math.floor(Math.random() * 100000),
    data: { empty: true },
  },
};

export const EMPTY_DECK = {
  title: '',
  cards: [],
  variables: [],
};

export const FEED_ITEM_DECK_FRAGMENT = `
  id
  deckId
  title
  creator {
    userId
    username
    photo {
      url
    }
  }
  initialCard {
    id
    cardId
    title
    backgroundImage {
      url
      smallUrl
      privateCardUrl
      overlayUrl
      primaryColor
    }
  }
  lastModified
  variables
`;

export const USER_PROFILE_FRAGMENT = `
  id
  userId
  name
  username
  email
  websiteUrl
  photo {
    url
  }
  connections
  decks {
    id
    deckId
    title
    creator {
      userId
      username
      photo {
        url
      }
    }
    isVisible
    initialCard {
      id
      cardId
      title
      backgroundImage {
        url
        smallUrl
        privateCardUrl
      }
    }
    variables
  }
`;
