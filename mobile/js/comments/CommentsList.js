import * as React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { MessageBody } from '../components/MessageBody';
import { UserAvatar } from '../components/UserAvatar';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentContainer: {
    flexDirection: 'row',
  },
  commentBody: {
    paddingVertical: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  authorUsername: {
    fontWeight: 'bold',
    marginRight: 8,
    paddingTop: 8,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    marginRight: 12,
    marginTop: 4,
  },
  repliesContainer: {
    paddingLeft: 8,
  },
});

const commentBodyStyles = StyleSheet.create({
  text: {
    color: '#000',
  },
  highlight: {
    color: '#000',
    fontWeight: 'bold',
  },
});

const DUMMY_COMMENT = {
  id: 0,
  commentId: 0,
  author: {
    username: 'ben',
    photo: {
      url:
        'https://castle.imgix.net/aad41bcc8b1b2cebeac14d33ab4bb141?auto=compress&fit=crop&min-w=420',
    },
  },
  body: {
    message: [{ text: 'Cool game bruu' }],
  },
  replies: [],
};

const DUMMY_REPLY = {
  id: 0,
  commentId: 0,
  author: {
    username: 'jesse',
    photo: {
      url:
        'https://castle.imgix.net/e9826782deed21a5b952a37b4861aeed?auto=compress&fit=crop&min-w=420',
    },
  },
  body: {
    message: [{ text: 'here is a reply' }],
  },
};

const DUMMY_COMMENTS = new Array(20).fill(DUMMY_COMMENT).map((comment, ii) => {
  let replies = [...comment.replies];
  if (ii === 2 || ii === 12) {
    replies.push(DUMMY_REPLY);
  }
  return {
    ...comment,
    replies,
    id: ii,
    commentId: ii,
  };
});

const CommentReplies = ({ replies }) => {
  return (
    <View style={styles.repliesContainer}>
      {replies.map((reply, ii) => (
        <Comment comment={reply} key={`reply-${ii}`} />
      ))}
    </View>
  );
};

const Comment = ({ comment, prevComment }) => {
  // could use `prevComment` to render groups of comments by the same author.
  return (
    <View style={styles.commentContainer}>
      <UserAvatar url={comment.author.photo?.url} style={styles.authorAvatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.authorUsername}>{comment.author.username}</Text>
        <View style={styles.commentBody}>
          <MessageBody body={comment.body} styles={commentBodyStyles} />
        </View>
        {comment.replies?.length ? <CommentReplies replies={comment.replies} /> : null}
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

  const renderItem = React.useCallback(
    ({ item, index }) => {
      const comment = item;
      const prevComment = index > 0 ? comments[index - 1] : null;
      return <Comment comment={comment} prevComment={prevComment} />;
    },
    [comments]
  );

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
