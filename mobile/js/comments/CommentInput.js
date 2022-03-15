import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { AutocompleteTextInput } from '../components/AutocompleteTextInput';
import * as Constants from '../Constants';
import { useListen, sendAsync, useCoreEvents } from '../core/CoreEvents';
import * as Session from '../Session';

import { CastleIcon } from '../Constants';
import FastImage from 'react-native-fast-image';

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
    paddingTop: 7,
    paddingBottom: 7,
    paddingHorizontal: 10,
    backgroundColor: '#f1f1f1',
    color: Constants.colors.black,
    borderRadius: 4,
    fontSize: 15,
  },
  button: {
    marginLeft: 8,
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
  imageContainer: {
    padding: 8,
    paddingBottom: 0,
  },
  image: {
    height: 200,
    aspectRatio: Constants.CARD_RATIO,
    borderRadius: 8,
  },
});

export const CommentInput = ({ onAddComment, replyingToComment, clearReplyingToComment }) => {
  const [value, setValue] = React.useState();
  const [imageFile, setImageFile] = React.useState(null);
  const [loadingScreenshot, setLoadingScreenshot] = React.useState(false);
  // Use eventsReady to determine if we're actually in a game or just on the feed
  // If we're not in a game, the screenshot button isn't available
  const { eventsReady } = useCoreEvents();

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
    (message, imageFile) => {
      let parentCommentId = null;
      if (replyingToComment) {
        // if reply-to-reply, stay under parent's thread
        if (replyingToComment.parentCommentId) {
          parentCommentId = replyingToComment.parentCommentId;
        } else {
          parentCommentId = replyingToComment.commentId;
        }
      }
      onAddComment(
        message,
        parentCommentId,
        commentBodyCache.current,
        imageFile ? imageFile.fileId : null
      );
      setValue(undefined);
      clearReplyingToComment();
      setImageFile(null);
      setLoadingScreenshot(false);
    },
    [replyingToComment, clearReplyingToComment]
  );

  useListen({
    eventName: 'SCENE_MESSAGE',
    handler: async (params) => {
      if (params.messageType == 'SCREENSHOT_DATA') {
        const imageFile = await Session.uploadBase64(params.data);
        setImageFile(imageFile);
        setLoadingScreenshot(false);
      }
    },
  });

  const addScreenshot = React.useCallback(() => {
    setLoadingScreenshot(true);
    sendAsync('REQUEST_SCREENSHOT');
  }, [setLoadingScreenshot]);

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
          placeholderTextColor={Constants.colors.grayText}
          value={value}
          onChangeText={setValue}
          multiline
        />
        {eventsReady && !imageFile && (
          <Pressable
            style={[Constants.styles.buttonOnWhite, styles.button]}
            onPress={() => addScreenshot()}
            disabled={loadingScreenshot}>
            <Text style={Constants.styles.buttonLabelOnWhite}>
              {loadingScreenshot ? 'Capturing...' : 'Screenshot'}
            </Text>
          </Pressable>
        )}
        <Pressable
          style={[Constants.styles.buttonOnWhite, styles.button]}
          onPress={() => addComment(value, imageFile)}
          disabled={!value || value.length === 0}>
          <Text style={Constants.styles.buttonLabelOnWhite}>Post</Text>
        </Pressable>
      </View>

      {imageFile && (
        <View style={styles.imageContainer}>
          <FastImage style={styles.image} source={{ uri: imageFile.url }} />
        </View>
      )}
    </View>
  );
};
