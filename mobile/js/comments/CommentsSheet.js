import * as React from 'react';
import { StyleSheet, TextInput, View, Keyboard } from 'react-native';

import { BottomSheetHeader } from '../components/BottomSheetHeader';
import { BottomSheet } from '../components/BottomSheet';
import { CommentInput } from './CommentInput';
import { CommentsList } from './CommentsList';
import { gql, useMutation } from '@apollo/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '../common/utilities';
import { useNavigation } from '../ReactNavigation';

import * as Constants from '../Constants';

import Viewport from '../common/viewport';

const TAB_BAR_HEIGHT = 49;

const needsTabBarPadding = ({ navigationIndex, keyboardState }) => {
  return Constants.iOS && navigationIndex === 0 && !keyboardState.visible;
};

export const CommentsSheet = ({ isOpen, onClose, deckId, ...props }) => {
  const { dangerouslyGetState } = useNavigation();

  const insets = useSafeAreaInsets();
  const maxSheetHeight = Viewport.vh * 100 - insets.top - Constants.FEED_HEADER_HEIGHT;

  const renderHeader = () => <BottomSheetHeader title="Comments" onClose={onClose} />;

  const [addComment] = useMutation(
    gql`
      mutation ($deckId: ID!, $message: String!, $parentCommentId: ID) {
        addDeckComment(deckId: $deckId, message: $message, parentCommentId: $parentCommentId) {
          ${Constants.COMMENTS_LIST_FRAGMENT}
        }
      }
    `
  );

  const onAddComment = React.useCallback(
    (message, parentCommentId = null) =>
      addComment({
        variables: {
          deckId,
          message,
          parentCommentId,
        },
      }),
    [addComment]
  );

  const [keyboardState] = useKeyboard();

  let paddingBottom = keyboardState.visible ? keyboardState.height - insets.bottom : 0;
  if (needsTabBarPadding({ navigationIndex: dangerouslyGetState().index, keyboardState })) {
    paddingBottom += TAB_BAR_HEIGHT;
  }
  const renderContent = () => (
    <View
      style={{
        flex: 1,
        paddingBottom,
      }}>
      <CommentsList isOpen={isOpen} deckId={deckId} {...props} />
      <CommentInput onAddComment={onAddComment} />
    </View>
  );

  return (
    <BottomSheet
      useViewInsteadOfScrollview
      snapPoints={[maxSheetHeight]}
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
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
