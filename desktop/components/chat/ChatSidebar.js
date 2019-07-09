import * as React from 'react';
import * as SVG from '~/common/svg';
import * as Strings from '~/common/strings';
import * as Constants from '~/common/constants';
import * as NativeUtil from '~/native/nativeutil';
import * as ChatActions from '~/common/actions-chat';

import { css } from 'react-emotion';

import { ConnectionStatus } from 'castle-chat-lib';
import { CurrentUserContext } from '~/contexts/CurrentUserContext';
import { NavigatorContext, NavigationContext } from '~/contexts/NavigationContext';
import { ChatContext } from '~/contexts/ChatContext';
import { UserPresenceContext } from '~/contexts/UserPresenceContext';

import ChatMessages from '~/components/chat/ChatMessages';
import ChatInput from '~/components/chat/ChatInput';
import ChatSidebarHeader from '~/components/chat/ChatSidebarHeader';

const STYLES_CONTAINER_BASE = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-direction: column;
  width: 100%;
  min-width: 10%;
  height: 100%;
`;

class ChatSidebar extends React.Component {
  state = {
    value: '',
    mode: 'MESSAGES',
    isDarkMode: false,
    isGameChatVisible: false,
  };

  componentDidMount() {
    this._update();
  }

  componentDidUpdate(prevProps, prevState) {
    this._update(prevProps, prevState);
  }

  _update = (prevProps = {}, prevState = {}) => {
    const { chat, gameChannel, lobbyChannel } = this.props;
    let prevChannelId = prevProps.gameChannel ? prevProps.gameChannel.channelId : null;
    let channelId = gameChannel ? gameChannel.channelId : null;
    if (prevChannelId !== channelId) {
      this.setState({ isGameChatVisible: channelId !== null });
    }

    if (chat && lobbyChannel) {
      let channelIdVisible = this.state.isGameChatVisible ? channelId : lobbyChannel.channelId;
      let prevChannelIdVisible = prevState.isGameChatVisible
        ? prevChannelId
        : lobbyChannel.channelId;
      if (channelIdVisible !== prevChannelIdVisible) {
        chat.markChannelRead(channelIdVisible);
      }
    }
  };

  _getChannelIdVisible = () => {
    return this.state.isGameChatVisible && this.props.gameChannel
      ? this.props.gameChannel.channelId
      : this.props.lobbyChannel.channelId;
  };

  _handleSelectLobby = () => {
    this.setState({ isGameChatVisible: false });
  };

  _handleSelectGameChannel = () => {
    if (this.props.gameChannel) {
      this.setState({ isGameChatVisible: true });
    }
  };

  _handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  _handleKeyDown = (e) => {
    if (e.which === 13 && !e.shiftKey) {
      event.preventDefault();
      if (Strings.isEmpty(this.state.value.trim())) {
        return;
      }

      this.props.chat.sendMessage(this._getChannelIdVisible(), this.state.value);
      this.setState({ value: '' });
    }
  };

  render() {
    const { mode } = this.state;
    const channelId = this._getChannelIdVisible();

    // TODO(jim): When theming is available, you can just modify this object.
    let theme = {
      textColor: Constants.colors.white,
      background: `#000000`,
      anchorColor: Constants.colors.white,
      inputBackground: `#565656`,
      embedBorder: `none`,
      embedBackground: `#333`,
      embedBoxShadow: `none`,
      embedPadding: `8px 8px 8px 8px`,
      hideEvents: true, // TODO: hack
    };

    if (!this.props.navigation.game) {
      return null;
    }

    if (this.props.navigation.isFullScreen) {
      return null;
    }

    if (!channelId) {
      return null;
    }
    const messages = this.props.chat.channels[channelId].messages;
    const name = this.props.chat.channels[channelId].name;

    return (
      <div
        className={STYLES_CONTAINER_BASE}
        style={{
          background: theme.background,
        }}>
        <ChatSidebarHeader
          gameChannel={this.props.gameChannel}
          isLobbySelected={!this.state.isGameChatVisible}
          onSelectLobby={this._handleSelectLobby}
          onSelectGameChannel={this._handleSelectGameChannel}
        />
        <ChatMessages
          messages={messages}
          navigator={this.props.navigator}
          userIdToUser={this.props.userPresence.userIdToUser}
          theme={theme}
          size="24px"
        />
        <ChatInput
          value={this.state.value}
          name="value"
          placeholder={`Message #${name}`}
          onChange={this._handleChange}
          onKeyDown={this._handleKeyDown}
          theme={theme}
          isSidebarGameInput
        />
      </div>
    );
  }
}

export default class ChatSidebarWithContext extends React.Component {
  render() {
    return (
      <CurrentUserContext.Consumer>
        {(currentUser) => (
          <UserPresenceContext.Consumer>
            {(userPresence) => (
              <ChatContext.Consumer>
                {(chat) => (
                  <NavigationContext.Consumer>
                    {(navigation) => {
                      const gameChannel = chat.findChannelForGame(navigation.game);
                      const lobbyChannel = chat.findChannel('lobby');
                      return (
                        <NavigatorContext.Consumer>
                          {(navigator) => (
                            <ChatSidebar
                              viewer={currentUser.user}
                              currentUser={currentUser}
                              navigator={navigator}
                              navigation={navigation}
                              userPresence={userPresence}
                              chat={chat}
                              gameChannel={gameChannel}
                              lobbyChannel={lobbyChannel}
                            />
                          )}
                        </NavigatorContext.Consumer>
                      );
                    }}
                  </NavigationContext.Consumer>
                )}
              </ChatContext.Consumer>
            )}
          </UserPresenceContext.Consumer>
        )}
      </CurrentUserContext.Consumer>
    );
  }
}
