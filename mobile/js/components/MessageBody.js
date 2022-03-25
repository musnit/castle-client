import React from 'react';
import { Linking, Pressable, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { AppText as Text } from './AppText';
import * as Utilities from '../common/utilities';

const defaultStyles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 19,
  },
  highlight: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 19,
  },
  link: {
    textDecorationLine: 'underline',
  },
});

const LinkableText = ({ styles, children, ...props }) => {
  const pattern = /https?:\/\/\S+/g;

  let match,
    startIdx = 0;
  let components = [];
  while ((match = pattern.exec(children)) != null) {
    const { urlToDisplay, urlToOpen } = Utilities.canonizeUserProvidedUrl(match.toString());
    components.push(
      <Text key={`${components.length}`} {...props}>
        {children.substring(startIdx, match.index)}
      </Text>
    );
    components.push(
      <Text
        key={`${components.length}}`}
        onPress={() => Linking.openURL(urlToOpen)}
        {...props}
        style={styles.link}>
        {urlToDisplay}
      </Text>
    );
    startIdx = pattern.lastIndex;
  }
  if (components.length) {
    // capture trailing text after last url
    components.push(
      <Text key={`${components.length + 1}`} {...props}>
        {children.substring(startIdx)}
      </Text>
    );
    return <>{components}</>;
  } else {
    // plain text
    return <Text {...props}>{children}</Text>;
  }
};

const BodyToken = ({ styles, token, navigateToUser, navigateToAllUsers }) => {
  if (token.text) {
    if (token.usersList) {
      return (
        <TouchableWithoutFeedback onPress={navigateToAllUsers}>
          <Text style={styles.highlight}>{token.text}</Text>
        </TouchableWithoutFeedback>
      );
    }
    return (
      <LinkableText styles={styles} style={styles.text}>
        {token.text}
      </LinkableText>
    );
  }
  if (token.userId) {
    return (
      <TouchableWithoutFeedback onPress={() => navigateToUser(token)}>
        <Text style={styles.highlight}>{token.username}</Text>
      </TouchableWithoutFeedback>
    );
  }
  return null;
};

export const MessageBody = ({
  body,
  styles = defaultStyles,
  navigateToUser,
  navigateToAllUsers,
}) => {
  if (!body?.message) {
    return null;
  }
  return (
    <Text style={{ flex: 1, flexWrap: 'wrap' }}>
      {body.message.map((token, ii) => (
        <BodyToken
          key={`token-${ii}`}
          token={token}
          navigateToUser={navigateToUser}
          navigateToAllUsers={navigateToAllUsers}
          styles={styles}
        />
      ))}
    </Text>
  );
};
