import React from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: '#fff',
  },
  highlight: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

const BodyToken = ({ token, navigateToUser, navigateToAllUsers }) => {
  if (token.text) {
    if (token.usersList) {
      return (
        <TouchableWithoutFeedback onPress={navigateToAllUsers}>
          <Text style={styles.highlight}>{token.text}</Text>
        </TouchableWithoutFeedback>
      );
    }
    return <Text style={styles.text}>{token.text}</Text>;
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

export const NotificationBody = ({ body, navigateToUser, navigateToAllUsers }) => {
  if (!body?.message) {
    return null;
  }
  return (
    <React.Fragment>
      {body.message.map((token, ii) => (
        <BodyToken
          key={`token-${ii}`}
          token={token}
          navigateToUser={navigateToUser}
          navigateToAllUsers={navigateToAllUsers}
        />
      ))}
    </React.Fragment>
  );
};
