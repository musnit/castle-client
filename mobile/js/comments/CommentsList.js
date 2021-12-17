import * as React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MessageBody } from '../components/MessageBody';
import { toRecentDate } from '../common/date-utilities';
import { UserAvatar } from '../components/UserAvatar';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useLazyQuery, useMutation, gql } from '@apollo/client';
import { useNavigation } from '../ReactNavigation';
import { useSession } from '../Session';

import * as Constants from '../Constants';
import FastImage from 'react-native-fast-image';
import { CastleIcon } from '../Constants';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  commentContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  authorAvatar: {
    width: 34,
    height: 34,
    marginTop: 2,
    marginRight: 12,
  },
  commentAuthor: {
    flexDirection: 'row',
  },
  commentAuthorText: {
    fontWeight: '600',
    fontSize: 13,
    marginRight: 6,
  },
  commentDate: {
    color: '#888',
    fontSize: 13,
  },
  commentBody: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  commentActions: {
    flexDirection: 'row',
  },
  commentAction: {
    color: '#888',
    fontSize: 13,
    marginLeft: 12,
  },
  commentMenu: {
    marginLeft: 12,
  },
  repliesContainer: {
    flexDirection: 'column-reverse',
  },
  commentUnavailableLabel: {
    fontStyle: 'italic',
    color: '#888',
  },
  emptyMessage: {
    color: '#888',
  },
  image: {
    height: 200,
    aspectRatio: Constants.CARD_RATIO,
    borderRadius: 8,
    marginVertical: 8,
  },
  reactionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  reactionText: {
    color: '#888',
    fontSize: 13,
    marginLeft: 3,
    fontWeight: '600',
  },
});

const commentBodyStyles = StyleSheet.create({
  text: {
    fontSize: 15,
    lineHeight: 20,
    color: '#000',
  },
  highlight: {
    fontSize: 15,
    color: '#888',
  },
  link: {
    fontSize: 15,
    color: '#888',
    textDecorationLine: 'underline',
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

const Comment = ({
  comment,
  isReply = false,
  parentCommentId,
  navigateToUser,
  showCommentActions,
  setReplyingToComment,
  onToggleCommentReaction,
}) => {
  const [optimisticReaction, setOptimisticReaction] = React.useState(null);
  const onReply = React.useCallback(
    ({ isReply }) => {
      if (!isReply) {
        setReplyingToComment(comment);
      } else {
        // reply-to-reply needs parent comment id because we only go one-deep on threads
        setReplyingToComment({ ...comment, parentCommentId });
      }
    },
    [setReplyingToComment]
  );

  React.useEffect(() => {
    setOptimisticReaction(null);
  }, [comment, setOptimisticReaction]);

  let fireReactionCount = 0;
  let fireIsCurrentUserToggled = false;

  if (comment.reactions && comment.reactions[0] && comment.reactions[0].reactionId === 'fire') {
    fireReactionCount = comment.reactions[0].count;
    fireIsCurrentUserToggled = comment.reactions[0].isCurrentUserToggled;
  }

  if (optimisticReaction !== null) {
    fireIsCurrentUserToggled = optimisticReaction;
  }

  return (
    <View style={[styles.commentContainer]}>
      <Pressable onPress={() => navigateToUser(comment.fromUser)}>
        <UserAvatar url={comment.fromUser.photo?.url} style={styles.authorAvatar} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <View style={styles.commentAuthor}>
          <Pressable onPress={() => navigateToUser(comment.fromUser)}>
            <Text style={styles.commentAuthorText}>{comment.fromUser.username}</Text>
          </Pressable>
          <Text style={styles.commentDate}>{toRecentDate(comment.createdTime)}</Text>
        </View>
        <View style={styles.commentBody}>
          {comment.isDeleted ? (
            <Text style={styles.commentUnavailableLabel}>This comment was deleted</Text>
          ) : (
            <View>
              <MessageBody
                body={comment.body}
                styles={commentBodyStyles}
                navigateToUser={navigateToUser}
              />
              {comment.image && (
                <FastImage style={styles.image} source={{ uri: comment.image.url }} />
              )}
            </View>
          )}
        </View>
        <View style={styles.commentActions}>
          <Pressable
            onPress={() => {
              onToggleCommentReaction(
                Constants.reactionIds.fire,
                comment.commentId,
                !fireIsCurrentUserToggled
              );
              setOptimisticReaction(!fireIsCurrentUserToggled);
            }}
            style={styles.reactionContainer}>
            <CastleIcon name={fireIsCurrentUserToggled ? 'fire-on' : 'fire-off'} size={14} color={fireIsCurrentUserToggled ? '#000' : '#888'} />
            {fireReactionCount > 0 && <Text style={[styles.reactionText, {color: fireIsCurrentUserToggled ? '#000' : '#888'}]}>{fireReactionCount}</Text>}
          </Pressable>
          <Pressable onPress={() => onReply({ isReply, setReplyingToComment })}>
            <Text style={styles.commentAction}>Reply</Text>
          </Pressable>
          <Pressable onPress={() => showCommentActions({ comment, isReply, parentCommentId })}>
            <Constants.CastleIcon
              name="overflow"
              size={18}
              color="#888"
              style={styles.commentMenu}
            />
          </Pressable>
        </View>
        {comment.childComments?.comments?.length ? (
          <CommentReplies
            parentCommentId={comment.commentId}
            replies={comment.childComments.comments}
            navigateToUser={navigateToUser}
            showCommentActions={showCommentActions}
            setReplyingToComment={setReplyingToComment}
            onToggleCommentReaction={onToggleCommentReaction}
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
    `,
    {
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-and-network',
    }
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

  const [toggleCommentReaction] = useMutation(
    gql`
      mutation ($reactionId: ID!, $commentId: ID!, $enabled: Boolean!) {
        toggleCommentReaction(reactionId: $reactionId, commentId: $commentId, enabled: $enabled) {
          id
          reactionId
          count
          isCurrentUserToggled
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

  const onToggleCommentReaction = React.useCallback(
    async (reactionId, commentId, enabled) => {
      await toggleCommentReaction({
        variables: { commentId, reactionId, enabled },
      });
      fetchComments({ variables: { deckId: deck?.deckId } });
    },
    [toggleCommentReaction, fetchComments, deck]
  );

  React.useEffect(() => {
    if (!isOpen) {
      setComments(null);
    }
  }, [isOpen, setComments]);

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
  }, [query, query.called, query.loading, query.error, query.data]);

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
    ({ comment }) => {
      if (isAnonymous || comment.isDeleted) {
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
      return (
        <Comment
          comment={comment}
          navigateToUser={navigateToUser}
          showCommentActions={showCommentActions}
          setReplyingToComment={setReplyingToComment}
          onToggleCommentReaction={onToggleCommentReaction}
        />
      );
    },
    [comments, navigateToUser]
  );

  if (deck && deck.commentsEnabled === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyMessage}>The creator has disabled comments for this deck.</Text>
      </View>
    );
  }

  if (comments === null) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.container}>
          <ActivityIndicator size="small" color="#000" />
        </View>
      </View>
    );
  }

  if (isAnonymous && !comments?.length) {
    // empty comments list + no text input is weird for anon users,
    // show a message instead
    return (
      <View style={styles.container}>
        <Text style={styles.emptyMessage}>
          This deck has no comments yet. Log in to Castle to write the first comment.
        </Text>
      </View>
    );
  }

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
