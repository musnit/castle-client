import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorTextInput } from '../components/InspectorTextInput';
import { useCardCreator } from '../../CreateCardContext';
import { useCoreState, sendBehaviorAction } from '../../../core/CoreEvents';

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});

export const TextContentSheet = ({ isOpen }) => {
  const renderHeader = () => <BottomSheetHeader title="Content" closeable={false} />;
  const renderContent = () => {
    const { hasSelection } = useCardCreator();
    const textComponent = useCoreState('EDITOR_SELECTED_COMPONENT:Text');
    const textSendAction = React.useCallback(
      (...args) => sendBehaviorAction('Text', ...args),
      [sendBehaviorAction]
    );

    const [textContentValue, setContentValueAndSendAction] = useOptimisticBehaviorValue({
      component: textComponent,
      propName: 'content',
      propType: 'string',
      sendAction: textSendAction,
    });
    const onChangeTextContentValue = React.useCallback(
      (content) => {
        setContentValueAndSendAction('set', content);
      },
      [setContentValueAndSendAction]
    );

    if (!hasSelection || !textComponent) return null;
    return (
      <View style={styles.container}>
        <React.Fragment>
          <InspectorTextInput
            value={textContentValue}
            onChangeText={onChangeTextContentValue}
            placeholder="Once upon a time..."
            multiline
          />
        </React.Fragment>
      </View>
    );
  };

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
      initialSnap={0}
    />
  );
};
