import { Platform } from 'react-native';

export const iOS = Platform.OS === 'ios';
export const Android = Platform.OS === 'android';

export const CARD_RATIO = 5 / 7;
export const CARD_BORDER_RADIUS = 12;
export const CARD_SMALL_BORDER_RADIUS = 6;
export const GRID_PADDING = 12;
export const FEED_HEADER_HEIGHT = 48;
export const FEED_ITEM_HEADER_HEIGHT = 48;

// on tablets, limit some form widths
export const TABLET_MAX_FORM_WIDTH = 512;

export const DISCORD_INVITE_LINK = 'https://discord.gg/rQETB4H';
export const DOCS_LINK = 'https://castle.xyz/docs';

export const colors = {
  black: '#000',
  tapHighlight: '#111',
  grayText: '#888',
  grayOnWhiteText: '#888',
  grayOnBlackText: '#777',
  grayOnWhiteBorder: '#ccc',
  grayOnBlackBorder: '#444',
  grayOnWhiteIcon: '#aaa',
  white: '#fff',
  halfWhite: '#fff7',
  skeletonBG: '#262626',
  skeletonText: '#595959',
};

export const styles = {
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
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
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonLabel: {
    color: '#000',
    fontSize: 16,
  },
  secondaryButton: {
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  secondaryButtonLabel: {
    color: '#fff',
    fontSize: 16,
  },
  buttonIconLeft: {
    marginLeft: -3,
    marginRight: 6,
  },
  buttonLarge: {
    borderRadius: 6,
    paddingTop: 12,
    paddingBottom: 12,
    width: 200,
  },
  buttonLargeLabel: {
    fontSize: 20,
  },
  paneHandle: {
    width: 50,
    alignSelf: 'center',
    paddingTop: 4,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  gridItem: {
    paddingRight: GRID_PADDING,
    paddingBottom: GRID_PADDING,
  },
  textInputWrapperOnWhite: {
    borderWidth: 1,
    borderRadius: 4,
    color: '#000',
    borderColor: '#000',
  },
  textInputOnWhite: {
    color: '#000',
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 4,
    fontSize: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(0, 0, 0, .25)',
  },
  textInputLabelOnWhite: {
    fontSize: 16,
    marginBottom: 6,
  },
  buttonOnWhite: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: iOS ? 1 : undefined,
  },
  buttonLabelOnWhite: {
    fontSize: 16,
  },
  siteHeaderButton: {
    position: 'absolute',
    right: 16,
    bottom: 12,
  },
  siteHeaderIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    padding: 16,
  },
  empty: {
    width: '100%',
    paddingHorizontal: 32,
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 20,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.grayText,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
};

export const CORE_OVERLAY_TEXT_STYLE = {
  regularBackgroundColor: [227 / 255.0, 230 / 255.0, 255 / 255.0, 1],
  regularForegroundcolor: [36 / 255.0, 34 / 255.0, 52 / 255.0, 1],
  tappableBackgroundColor: [36 / 255.0, 34 / 255.0, 52 / 255.0, 1],
  tappingBackgroundColor: [64 / 255.0, 51 / 255.0, 83 / 255.0, 1],
  tappableForegroundColor: [227 / 255.0, 230 / 255.0, 255 / 255.0, 1],
  fontSize: 20,
  horizontalPadding: 4,
  topPadding: 2.75,
  bottomPadding: 2,
  horizontalMargin: 4,
  betweenMargin: 2,
  bottomMargin: 4,
};

export const EMPTY_CARD = {
  title: '',
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
  visibility
  creator {
    userId
    username
    photo {
      url
    }
  }
  childDecksCount
  parentDeckId
  parentDeck {
    deckId
    creator { username }
  }
  initialCard {
    id
    cardId
    sceneDataUrl
    title
    backgroundColor
    backgroundImage {
      url
      smallUrl
    }
  }
  reactions {
    id
    reactionId
    count
    isCurrentUserToggled
  }
  comments {
    threadId
    count
  }
  commentsEnabled
  lastModified
`;

export const USER_PROFILE_FRAGMENT = `
  id
  userId
  name
  username
  email
  websiteUrl
  tiktokUsername
  twitterUsername
  itchUsername
  about
  photo {
    url
  }
  badges {
    label
    image { url }
  }
  connections
  followersCount
  connectionsYouKnow {
    id
    userId
    username
    photo { url }
  }
  decks {
    ${FEED_ITEM_DECK_FRAGMENT}
  }
`;

export const COMMENT_FRAGMENT = `
  commentId
  fromUser {
    userId
    username
    photo { url }
  }
  body
  isDeleted
  createdTime
  image {
    url
  }
  reactions {
    id
    reactionId
    count
    isCurrentUserToggled
  }
`;

export const COMMENTS_LIST_FRAGMENT = `
  threadId
  count
  comments {
    ${COMMENT_FRAGMENT}
    childComments {
      threadId
      count
      comments { ${COMMENT_FRAGMENT} }
    }
  }
`;

export const reactionIds = {
  fire: 'fire',
};

import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
import icoMoonConfig from '../assets/icoMoonConfig.json';
export const CastleIcon = createIconSetFromIcoMoon(icoMoonConfig, 'CastleIcon', 'CastleIcon.ttf');
