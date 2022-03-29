import * as React from 'react';
import { KeyboardAvoidingView, StyleSheet, TextInput, View, Keyboard } from 'react-native';
import { Amplitude } from '@amplitude/react-native';
import { BottomSheet } from '../components/BottomSheet';
import { CommentInput } from './CommentInput';
import { CommentsList } from './CommentsList';
import { CommentsSheetHeader } from './CommentsSheetHeader';
import { formatMessage } from '../common/chat-utilities';
import { gql, useMutation } from '@apollo/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '../common/utilities';
import { useNavigation } from '../ReactNavigation';
import { useSession } from '../Session';

import * as Constants from '../Constants';

import Viewport from '../common/viewport';

const TAB_BAR_HEIGHT = 49;
const SHEET_HEADER_HEIGHT = 62;

const needsTabBarHeight = ({ isFullScreen }) => {
  return Constants.Android && !isFullScreen;
};

export const CommentsSheet = ({ isOpen, onClose, deck, isFullScreen, ...props }) => {
  const { getState } = useNavigation();
  const { isAnonymous } = useSession();
  const [newComment, setNewComment] = React.useState(null);

  const insets = useSafeAreaInsets();
  const navigationIndex = getState().index;
  const maxSheetHeight =
    Viewport.vh * 100 -
    insets.top -
    Constants.FEED_HEADER_HEIGHT -
    (needsTabBarHeight({ isFullScreen }) ? TAB_BAR_HEIGHT : 0);

  const closeSheet = React.useCallback(() => {
    Keyboard.dismiss();
    return onClose();
  }, [onClose]);
  const renderHeader = () => (
    <CommentsSheetHeader deck={deck} onClose={closeSheet} isOpen={isOpen} />
  );

  const [replyingToComment, setReplyingToComment] = React.useState();

  const [addComment] = useMutation(
    gql`
      mutation ($deckId: ID!, $message: String!, $parentCommentId: ID, $imageFileId: ID) {
        addDeckComment2(deckId: $deckId, message: $message, parentCommentId: $parentCommentId, imageFileId: $imageFileId) {
          ${Constants.COMMENT_FRAGMENT}
          childComments {
            threadId
            count
            comments { ${Constants.COMMENT_FRAGMENT} }
          }
        }
      }
    `,
    {
      update: (cache, { data }) => {
        setNewComment(data.addDeckComment2);
      },
    }
  );

  const onAddComment = React.useCallback(
    (message, parentCommentId = null, commentBodyCache = {}, imageFileId = null) => {
      const formattedMessage = formatMessage(message, commentBodyCache);
      Amplitude.getInstance().logEvent('ADD_COMMENT', {
        deckId: deck.deckId,
        hasScreenshot: !!imageFileId,
      });
      return addComment({
        variables: {
          deckId: deck.deckId,
          message: formattedMessage,
          parentCommentId,
          imageFileId,
        },
      });
    },
    [addComment, deck]
  );

  const renderContentInner = () => (
    <>
      <CommentsList
        isOpen={isOpen}
        deck={deck}
        setReplyingToComment={setReplyingToComment}
        newComment={newComment}
        {...props}
      />
      {!isAnonymous && isOpen && deck?.commentsEnabled ? (
        <CommentInput
          onAddComment={onAddComment}
          replyingToComment={replyingToComment}
          clearReplyingToComment={() => setReplyingToComment(undefined)}
        />
      ) : null}
    </>
  );

  const renderContent = Constants.Android
    ? () => <View style={{ flex: 1 }}>{renderContentInner()}</View>
    : () => (
        <View style={{ flex: 1 }}>
          <KeyboardAvoidingView
            keyboardVerticalOffset={Viewport.vh * 100 - maxSheetHeight + SHEET_HEADER_HEIGHT}
            behavior="padding"
            style={{ flex: 1 }}>
            {renderContentInner()}
          </KeyboardAvoidingView>
        </View>
      );

  return (
    <BottomSheet
      isFullScreen={isFullScreen}
      useViewInsteadOfScrollview
      snapPoints={[maxSheetHeight]}
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
      onClose={onClose}
      onOpenEnd={Keyboard.dismiss}
      onCloseEnd={Keyboard.dismiss}
      style={{
        backgroundColor: '#fff',
        borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
        borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
        ...Constants.styles.dropShadowUp,
      }}
    />
  );
};
