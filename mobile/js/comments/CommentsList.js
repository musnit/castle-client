import * as React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  commentContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  commentBody: {
    backgroundColor: '#ddd',
    padding: 8,
    borderRadius: 6,
  },
  authorUsername: {
    fontWeight: 'bold',
    marginRight: 8,
    paddingTop: 8,
  },
  commentText: {},
});

const DUMMY_COMMENT = {
  id: 0,
  commentId: 0,
  author: {
    username: 'ben',
    // TODO
  },
  // TODO: switch to body format
  message: 'Cool game bruu',
};
const DUMMY_COMMENTS = new Array(20)
  .fill(DUMMY_COMMENT)
  .map((comment, ii) => ({ ...comment, id: ii, commentId: ii }));

const Comment = ({ comment }) => {
  return (
    <View style={styles.commentContainer}>
      <Text style={styles.authorUsername}>{comment.author.username}</Text>
      <View style={styles.commentBody}>
        <Text style={styles.commentText}>{comment.message}</Text>
      </View>
    </View>
  );
};

export const CommentsList = ({ deckId, isOpen }) => {
  const [comments, setComments] = React.useState(null);
  React.useEffect(() => {
    // TODO: fetch from api
    if (isOpen) {
      setComments(DUMMY_COMMENTS);
    }
  }, [isOpen, deckId]);

  const renderItem = React.useCallback(({ item, index }) => {
    const comment = item;
    return <Comment comment={comment} />;
  }, []);

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={comments}
      renderItem={renderItem}
      keyExtractor={(item, index) => item.commentId.toString()}
      inverted
    />
  );
};
