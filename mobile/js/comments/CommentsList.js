import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MessageBody } from '../components/MessageBody';
import { toRecentDate } from '../common/date-utilities';
import { UserAvatar } from '../components/UserAvatar';
import { useNavigation } from '../ReactNavigation';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentContainer: {
    flexDirection: 'row',
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentDate: {
    color: '#666',
    fontSize: 12,
  },
  commentBody: {
    paddingBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  authorUsername: {
    fontWeight: 'bold',
    marginRight: 8,
    lineHeight: 32,
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
  createdTime: '2021-05-05T21:19:31.415Z',
  fromUser: {
    userId: 6,
    username: 'ben',
    photo: {
      url:
        'https://castle.imgix.net/aad41bcc8b1b2cebeac14d33ab4bb141?auto=compress&fit=crop&min-w=420',
    },
  },
  body: {
    message: [{ text: 'Cool game bruu' }],
  },
  childComments: [],
};

const DUMMY_REPLY = {
  id: 0,
  commentId: 0,
  createdTime: '2021-05-06T21:19:31.415Z',
  fromUser: {
    userId: 1,
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
  let childComments = [...comment.childComments];
  if (ii === 2 || ii === 12) {
    childComments.push(DUMMY_REPLY);
  }
  return {
    ...comment,
    childComments,
    id: ii,
    commentId: ii,
  };
});

const CommentReplies = ({ replies, ...props }) => {
  return (
    <View style={styles.repliesContainer}>
      {replies.map((reply, ii) => (
        <Comment comment={reply} key={`reply-${ii}`} {...props} />
      ))}
    </View>
  );
};

const Comment = ({ comment, prevComment, navigateToUser }) => {
  // could use `prevComment` to render groups of comments by the same author.
  return (
    <View style={styles.commentContainer}>
      <Pressable onPress={() => navigateToUser(comment.fromUser)}>
        <UserAvatar url={comment.fromUser.photo?.url} style={styles.authorAvatar} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <View style={styles.commentMeta}>
          <Pressable onPress={() => navigateToUser(comment.fromUser)}>
            <Text style={styles.authorUsername}>{comment.fromUser.username}</Text>
          </Pressable>
          <Text style={styles.commentDate}>{toRecentDate(comment.createdTime)}</Text>
        </View>
        <View style={styles.commentBody}>
          <MessageBody
            body={comment.body}
            styles={commentBodyStyles}
            navigateToUser={navigateToUser}
          />
        </View>
        {comment.childComments?.length ? (
          <CommentReplies replies={comment.childComments} navigateToUser={navigateToUser} />
        ) : null}
      </View>
    </View>
  );
};

export const CommentsList = ({ deckId, isOpen }) => {
  const { push } = useNavigation();
  const [comments, setComments] = React.useState(null);

  React.useEffect(() => {
    // TODO: fetch from api
    if (isOpen) {
      setComments(DUMMY_COMMENTS);
    }
  }, [isOpen, deckId]);

  const navigateToUser = React.useCallback(
    (user) =>
      push(
        'Profile',
        { userId: user.userId },
        {
          isFullscreen: true,
        }
      ),
    [push]
  );

  const renderItem = React.useCallback(
    ({ item, index }) => {
      const comment = item;
      const prevComment = index > 0 ? comments[index - 1] : null;
      return (
        <Comment comment={comment} prevComment={prevComment} navigateToUser={navigateToUser} />
      );
    },
    [comments, navigateToUser]
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
