import * as React from 'react';
import * as Actions from '~/common/actions';
import * as ChatUtilities from '~/common/chat-utilities';
import * as Constants from '~/common/constants';
import * as SVG from '~/components/primitives/svg';

import { css } from 'react-emotion';
import { Tooltip } from 'react-tippy';

import SocialSidebarNavigationItem from '~/components/social/SocialSidebarNavigationItem';

const STYLES_CONTAINER = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  background: #e5e5e5;
  height: 100%;
  width: 100%;
`;

const STYLES_TOP = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
`;

const STYLES_BOTTOM = css`
  display: flex;
  width: ${Constants.sidebar.collapsedWidth};
  height: ${Constants.sidebar.collapsedWidth};
  align-items: center;
  justify-content: center;

  svg {
    cursor: pointer;
  }
`;

const TOOLTIP_PROPS = {
  arrow: true,
  duration: 170,
  animation: 'fade',
  hideOnClick: false,
  position: 'left',
};

export default class SocialSidebarNavigator extends React.Component {
  static defaultProps = {
    theme: {},
  };

  state = {
    game: null,
  };

  componentDidUpdate(prevProps, prevState) {
    this._update(prevProps, prevState);
  }

  componentDidMount() {
    this._update(null, null);
  }

  // do not show tooltips if a game is visible and the sidebar is collapsed,
  // because the game will draw over the tooltips.
  _maybeWrapWithTooltip = (child, title, key) => {
    const { isGameVisible, isChatExpanded } = this.props;
    const showTooltip = !(isGameVisible && !isChatExpanded);
    if (showTooltip) {
      return (
        <Tooltip key={key} title={title} {...TOOLTIP_PROPS}>
          {child}
        </Tooltip>
      );
    }
    return child;
  };

  _update = async (prevProps, prevState) => {
    // TODO: put this game fetch inside navigation context and merge w meta screen
    const { chat, gameMetaChannelId } = this.props;
    if (!prevProps || prevProps.gameMetaChannelId !== gameMetaChannelId) {
      if (this.state.game) {
        await this.setState({ game: null });
      }
      if (gameMetaChannelId) {
        const channel = chat.channels[gameMetaChannelId];
        if (channel.type === 'game' && channel.gameId) {
          try {
            let game = await Actions.getGameByGameId(channel.gameId);
            this.setState({ game });
          } catch (_) {}
        }
      }
    }
  };

  _renderGameItem = () => {
    const { chat, gameMetaChannelId, isChatExpanded, selectedChannelId } = this.props;
    const { theme } = this.props;
    let gameItem = null;
    if (gameMetaChannelId) {
      let iconSrc;
      const channel = chat.channels[gameMetaChannelId];
      const { game } = this.state;
      if (game && game.coverImage) {
        iconSrc = game.coverImage.url;
      }
      const isGameSelected = isChatExpanded && selectedChannelId === channel.channelId;
      const title = channel.name ? channel.name : 'Untitled Game Chat';

      gameItem = (
        <SocialSidebarNavigationItem
          isUnread={channel.hasUnreadMessages}
          showOnlineIndicator={channel.hasUnreadMessages && !isGameSelected}
          notificationCount={channel.notificationCount}
          isSelected={isGameSelected}
          avatarUrl={iconSrc}
          theme={theme}
          onClick={() => this.props.onSelectChannel(channel)}
        />
      );
      return this._maybeWrapWithTooltip(gameItem, title, 'navigation-game');
    }
    return gameItem;
  };

  _renderLobbyItem = () => {
    const { chat, isChatExpanded, selectedChannelId } = this.props;
    const { theme } = this.props;
    let lobbyItem = null;
    try {
      let lobbyChannel,
        isLobbySelected = false;
      lobbyChannel = chat.findChannel(ChatUtilities.EVERYONE_CHANNEL_NAME);
      if (lobbyChannel) {
        isLobbySelected = isChatExpanded && selectedChannelId === lobbyChannel.channelId;
        lobbyItem = (
          <SocialSidebarNavigationItem
            isUnread={lobbyChannel.hasUnreadMessages}
            showOnlineIndicator={lobbyChannel.hasUnreadMessages && !isLobbySelected}
            notificationCount={lobbyChannel.notificationCount}
            isSelected={isLobbySelected}
            avatarUrl={'static/flag128x128.png'}
            theme={theme}
            onClick={() => this.props.onSelectChannel(lobbyChannel)}
          />
        );
        return this._maybeWrapWithTooltip(lobbyItem, 'Community Chat', 'navigation-lobby');
      }
    } catch (_) {}
    return lobbyItem;
  };

  render() {
    const { chat, viewer, isChatExpanded, selectedChannelId, gameMetaChannelId } = this.props;
    const { theme } = this.props;
    if (!viewer) {
      return null;
    }

    const channels = chat.channels;
    const { onlineUserIds, userIdToUser } = this.props.userPresence;
    let directMessages = [];
    Object.entries(channels).forEach(([channelId, channel]) => {
      if (channel.type === 'dm') {
        directMessages.push({
          ...channel,
          otherUserIsOnline: onlineUserIds[channel.otherUserId],
        });
      }
    });

    directMessages = ChatUtilities.sortChannels(directMessages);

    let toggleControl, toggleTooltip;
    let toggleProps = { width: 24, height: 24, onClick: this.props.onToggleSidebar };
    if (isChatExpanded) {
      toggleControl = <SVG.ChevronRight {...toggleProps} />;
      toggleTooltip = 'Hide chat';
    } else {
      toggleControl = <SVG.ChevronLeft {...toggleProps} />;
      toggleTooltip = 'Show chat';
    }

    return (
      <div className={STYLES_CONTAINER} style={{ background: theme.navigatorBackground }}>
        <div className={STYLES_TOP}>
          {this._renderGameItem()}
          {this._renderLobbyItem()}
          {directMessages.map((c, ii) => {
            const isSelected = isChatExpanded && c.channelId === selectedChannelId;

            const user = userIdToUser[c.otherUserId];
            if (!user) {
              return;
            }

            let onClick;
            if (c.channelId) {
              onClick = () => this.props.onSelectChannel(c);
            } else {
              onClick = () => this.props.onSendMessage(user);
            }
            const key = `sidebar-navigation-${ii}`;
            let item = (
              <SocialSidebarNavigationItem
                key={key}
                name={user.username}
                isUnread={c.hasUnreadMessages}
                notificationCount={c.unreadNotificationCount}
                isOnline={c.otherUserIsOnline}
                isSelected={isSelected}
                avatarUrl={user.photo ? user.photo.url : null}
                onClick={onClick}
                theme={theme}
              />
            );
            return this._maybeWrapWithTooltip(item, c.name, key);
          })}
        </div>
        <div className={STYLES_BOTTOM}>
          <Tooltip title={toggleTooltip} {...TOOLTIP_PROPS}>
            {toggleControl}
          </Tooltip>
        </div>
      </div>
    );
  }
}
