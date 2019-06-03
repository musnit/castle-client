import * as React from 'react';
import * as Actions from '~/common/actions';
import * as ChatActions from '~/common/actions-chat';
import * as Strings from '~/common/strings';
import * as Constants from '~/common/constants';

import { CastleChat, ConnectionStatus } from 'castle-chat-lib';

const CHAT_SERVICE_URL = 'https://chat.castle.games:5285/http-bind/';

const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const ChatSessionContext = React.createContext({
  messages: [],
  channel: null,
  handleConnect: (channel) => {},
  handleSendChannelMessage: (text) => {},
});

class ChatSessionContextProvider extends React.Component {
  _chat;

  constructor(props) {
    super(props);
    this.state = {
      messages: {},
      channel: null,
      handleConnect: this._handleConnect,
      handleSendChannelMessage: this._handleSendChannelMessage,
    };
  }

  componentDidMount() {
    this.start();
  }

  _handleConnect = async (channel) => {
    this.setState({ channel });
    const response = await ChatActions.joinChatChannel({ channelId: channel.channelId });

    // TODO(jim): Not seeing loadRecentMessagesAsync.
    await this._chat.loadRecentMessagesAsync();
  };

  start = async () => {
    let token = await Actions.getAccessTokenAsync();
    if (!token) {
      console.error('Cannot start chat without an access token.');
      return;
    }

    this._chat = new CastleChat();
    this._chat.init(CHAT_SERVICE_URL, Constants.API_HOST, token);
    this._chat.setOnMessagesHandler(this._handleMessagesAsync);
    this._chat.setOnPresenceHandler(this._handlePresenceAsync);
    this._chat.setConnectionStatusHandler(this._handleConnectStatus);
    this._chat.connect();
  };

  _handleSendChannelMessage = async (message) => {
    if (Strings.isEmpty(message)) {
      return;
    }

    ChatActions.sendChannelChatMessage({ message, channelId: this.state.channel.channelId });
  };

  _handleConnectStatus = async (status) => {
    this.setState({ users: event.roster.map((user) => user.name) });

    let onlineUsersMap = {};
    event.roster.forEach((user) => {
      onlineUsersMap[user.name] = true;
    });

    this.props.social.setOnlineUserIds(onlineUsersMap);
  };

  _handleMessagesAsync = async (allMessages) => {
    const messages = this.state.messages;
    let userIds = {};

    allMessages.forEach((m) => {
      if (!messages[m.channelId]) {
        messages[m.channelId] = [];
      }

      userIds[m.fromUserId] = true;
      messages[m.channelId].unshift(m);
    });

    try {
      let users = await Actions.getUsers({ userIds: Object.keys(userIds) });
      await this.props.social.addUsers(users);
    } catch (e) {}

    this.setState({ messages });
  };

  _handlePresenceAsync = async (event) => {
    console.log('event', event);
  };

  render() {
    return (
      <ChatSessionContext.Provider value={this.state}>
        {this.props.children}
      </ChatSessionContext.Provider>
    );
  }
}

export { ChatSessionContext, ChatSessionContextProvider };
