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

const BodyToken = ({ token, navigateToUser }) => {
  if (token.text) {
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

export const NotificationBody = ({ body, navigateToUser }) => {
  if (!body?.message) {
    return null;
  }
  return (
    <React.Fragment>
      {body.message.map((token, ii) => (
        <BodyToken key={`token-${ii}`} token={token} navigateToUser={navigateToUser} />
      ))}
    </React.Fragment>
  );
};
