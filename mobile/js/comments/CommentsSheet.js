import * as React from 'react';
import { StyleSheet, TextInput, View, Keyboard } from 'react-native';

import { BottomSheetHeader } from '../components/BottomSheetHeader';
import { BottomSheet } from '../components/BottomSheet';
import { CommentInput } from './CommentInput';
import { CommentsList } from './CommentsList';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '../common/utilities';

import * as Constants from '../Constants';

import Viewport from '../common/viewport';

const TAB_BAR_HEIGHT = 49;

export const CommentsSheet = ({ isOpen, onClose, ...props }) => {
  const insets = useSafeAreaInsets();
  const maxSheetHeight = Viewport.vh * 100 - insets.top - Constants.FEED_HEADER_HEIGHT;

  const renderHeader = () => <BottomSheetHeader title="Comments" onClose={onClose} />;

  const [keyboardState] = useKeyboard();

  // TODO: maybe account for tab bar (see DeckSettingsSheet)
  const renderContent = () => (
    <View
      style={{
        flex: 1,
        paddingBottom: keyboardState.visible ? keyboardState.height - insets.bottom : 0,
      }}>
      <CommentsList isOpen={isOpen} {...props} />
      <CommentInput />
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
