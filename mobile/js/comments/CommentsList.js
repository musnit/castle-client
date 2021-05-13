import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MessageBody } from '../components/MessageBody';
import { toRecentDate } from '../common/date-utilities';
import { UserAvatar } from '../components/UserAvatar';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useLazyQuery, useMutation, gql } from '@apollo/client';
import { useNavigation } from '../ReactNavigation';
import { useSession } from '../Session';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentContainer: {
    flexDirection: 'row',
  },
  authorAvatar: {
    width: 24,
    height: 24,
    marginRight: 8,
    marginTop: 8,
  },
  commentBubble: {
    backgroundColor: '#f1f1f1',
    borderRadius: 15,
    paddingVertical: 2,
    paddingHorizontal: 12,
    marginBottom: 8,
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
    marginRight: 4,
    lineHeight: 32,
  },
  repliesContainer: {
    flexDirection: 'column-reverse',
  },
  commentUnavailableLabel: {
    fontStyle: 'italic',
    color: '#888',
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

const CommentReplies = ({ replies, ...props }) => {
  return (
    <View style={styles.repliesContainer}>
      {replies.map((reply, ii) => (
        <Comment comment={reply} key={`reply-${ii}`} isReply {...props} />
      ))}
    </View>
  );
};

const Comment = ({ comment, isReply = false, prevComment, navigateToUser, showCommentActions }) => {
  // could use `prevComment` to render groups of comments by the same author.
  return (
    <View style={[styles.commentContainer]}>
      <Pressable onPress={() => navigateToUser(comment.fromUser)}>
        <UserAvatar url={comment.fromUser.photo?.url} style={styles.authorAvatar} />
      </Pressable>
      <View>
        <Pressable
          style={styles.commentBubble}
          onPress={() => showCommentActions({ comment, isReply })}>
          <View style={styles.commentMeta}>
            <Pressable onPress={() => navigateToUser(comment.fromUser)}>
              <Text style={styles.authorUsername}>{comment.fromUser.username}</Text>
            </Pressable>
            <Text style={styles.commentDate}>{toRecentDate(comment.createdTime)}</Text>
          </View>
          <View style={styles.commentBody}>
            {comment.isDeleted ? (
              <Text style={styles.commentUnavailableLabel}>This comment was deleted</Text>
            ) : (
              <MessageBody
                body={comment.body}
                styles={commentBodyStyles}
                navigateToUser={navigateToUser}
              />
            )}
          </View>
        </Pressable>
        {comment.childComments?.comments?.length ? (
          <CommentReplies
            replies={comment.childComments.comments}
            navigateToUser={navigateToUser}
            showCommentActions={showCommentActions}
          />
        ) : null}
      </View>
    </View>
  );
};

export const CommentsList = ({ deck, isOpen, setReplyingToComment }) => {
  const { push } = useNavigation();
  const { userId: signedInUserId, isAnonymous } = useSession();
  const [comments, setComments] = React.useState(null);
  const { showActionSheetWithOptions } = useActionSheet();

  const [fetchComments, query] = useLazyQuery(
    gql`
      query($deckId: ID!) {
        deck(deckId: $deckId) {
          id
          deckId
          comments {
            ${Constants.COMMENTS_LIST_FRAGMENT}
          }
        }
      }
    `
  );

  const [reportComment] = useMutation(
    gql`
      mutation ($commentId: ID!) {
        reportComment(commentId: $commentId) {
          ${Constants.COMMENTS_LIST_FRAGMENT}
        }
      }
    `
  );

  const onReportComment = React.useCallback(
    (comment) =>
      reportComment({
        variables: { commentId: comment.commentId },
      }),
    [reportComment]
  );

  const [deleteComment] = useMutation(
    gql`
      mutation ($commentId: ID!) {
        deleteComment(commentId: $commentId) {
          ${Constants.COMMENTS_LIST_FRAGMENT}
        }
      }
    `
  );

  const onDeleteComment = React.useCallback(
    (comment) =>
      deleteComment({
        variables: { commentId: comment.commentId },
      }),
    [deleteComment]
  );

  React.useEffect(() => {
    if (isOpen) {
      fetchComments({ variables: { deckId: deck?.deckId } });
    }
  }, [isOpen, deck]);

  React.useEffect(() => {
    if (query.called && !query.loading) {
      if (query.data) {
        const comments = query.data.deck.comments.comments;
        if (comments) {
          setComments(comments);
        }
      }
    }
  }, [query.called, query.loading, query.error, query.data]);

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

  const showCommentActions = React.useCallback(
    ({ comment, isReply }) => {
      if (isAnonymous) {
        return;
      }

      let options = [];
      const isOwnComment = signedInUserId === comment.fromUser.userId;
      const isDeckOwner = signedInUserId === deck.creator.userId;

      if (isOwnComment || isDeckOwner) {
        options.unshift({
          name: 'Delete',
          action: () =>
            showActionSheetWithOptions(
              {
                title: 'Delete this comment?',
                options: ['Delete', 'Cancel'],
                destructiveButtonIndex: 0,
                cancelButtonIndex: 1,
              },
              (buttonIndex) => {
                if (buttonIndex === 0) {
                  onDeleteComment(comment);
                }
              }
            ),
        });
      }
      if (!isOwnComment) {
        options.unshift({
          name: 'Report',
          action: () =>
            showActionSheetWithOptions(
              {
                title: `Report @${comment.fromUser.username}'s comment?`,
                options: ['Report', 'Cancel'],
                destructiveButtonIndex: 0,
                cancelButtonIndex: 1,
              },
              (buttonIndex) => {
                if (buttonIndex === 0) {
                  onReportComment(comment);
                }
              }
            ),
        });
      }
      if (!isReply) {
        options.unshift({
          name: 'Reply',
          action: () => setReplyingToComment(comment),
        });
      }
      return showActionSheetWithOptions(
        {
          title: `@${comment.fromUser.username}'s comment`,
          options: options.map((o) => o.name).concat(['Cancel']),
          destructiveButtonIndex: options.length - 1,
          cancelButtonIndex: options.length,
        },
        (buttonIndex) => {
          if (buttonIndex < options.length) {
            options[buttonIndex].action();
          }
        }
      );
    },
    [
      showActionSheetWithOptions,
      setReplyingToComment,
      onReportComment,
      onDeleteComment,
      signedInUserId,
      isAnonymous,
      deck,
    ]
  );

  const renderItem = React.useCallback(
    ({ item, index }) => {
      const comment = item;
      const prevComment = index > 0 ? comments[index - 1] : null;
      return (
        <Comment
          comment={comment}
          prevComment={prevComment}
          navigateToUser={navigateToUser}
          showCommentActions={showCommentActions}
        />
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
