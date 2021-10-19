import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AutocompleteTextInput } from '../components/AutocompleteTextInput';

import { CastleIcon } from '../Constants';

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingBottom: 4,
  },
  textInput: {
    width: '100%',
    flexShrink: 1,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f1f1f1',
    borderRadius: 4,
    fontSize: 15,
  },
  submitButton: {
    padding: 8,
    marginLeft: 8,
  },
  submitButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 15,
  },
  replyingToRow: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  replyingToLabel: {
    color: '#888',
    fontSize: 15,
  },
  clearReplyButton: {
    marginRight: 12,
  },
});

export const CommentInput = ({ onAddComment, replyingToComment, clearReplyingToComment }) => {
  const [value, setValue] = React.useState();

  // maintain cache of entities (e.g. user mentions) to help assemble this comment's body
  // when we send it to the server
  const commentBodyCache = React.useRef({});
  const updateCache = React.useCallback((action) => {
    if (action.type === 'addUser') {
      const { user } = action;
      commentBodyCache.current[user.username] = user;
    }
  }, []);

  // when we begin a reply-to-reply, mention the user we're replying to
  React.useEffect(() => {
    if (replyingToComment?.parentCommentId) {
      setValue(`@${replyingToComment.fromUser.username} `);
      updateCache({
        type: 'addUser',
        user: replyingToComment.fromUser,
      });
    }
  }, [replyingToComment, setValue, updateCache]);

  const addComment = React.useCallback(
    (message) => {
      let parentCommentId = null;
      if (replyingToComment) {
        // if reply-to-reply, stay under parent's thread
        if (replyingToComment.parentCommentId) {
          parentCommentId = replyingToComment.parentCommentId;
        } else {
          parentCommentId = replyingToComment.commentId;
        }
      }
      onAddComment(message, parentCommentId, commentBodyCache.current);
      setValue(undefined);
      clearReplyingToComment();
    },
    [replyingToComment, clearReplyingToComment]
  );

  return (
    <View style={styles.container}>
      {replyingToComment ? (
        <View style={styles.replyingToRow}>
          <Pressable
            style={styles.clearReplyButton}
            onPress={clearReplyingToComment}
            hitSlop={{ top: 4, left: 4, right: 4, bottom: 4 }}>
            <CastleIcon name="close" color="#888" size={18} />
          </Pressable>
          <Text style={styles.replyingToLabel}>
            Replying to @{replyingToComment.fromUser.username}
          </Text>
        </View>
      ) : null}
      <View style={styles.inputRow}>
        <AutocompleteTextInput
          updateCache={updateCache}
          style={styles.textInput}
          placeholder="Add a comment..."
          value={value}
          onChangeText={setValue}
          multiline
        />
        <Pressable
          style={styles.submitButton}
          onPress={() => addComment(value)}
          disabled={!value || value.length === 0}>
          <Text style={styles.submitButtonText}>Post</Text>
        </Pressable>
      </View>
    </View>
  );
};
