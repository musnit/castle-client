import * as React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { useCardCreator } from '../../CreateCardContext';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import FeatherIcon from 'react-native-vector-icons/Feather';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 16,
    flex: 1,
  },
  label: {
    fontWeight: 'bold',
    paddingBottom: 16,
    fontSize: 16,
  },
  explainer: {
    paddingTop: 10,
    flexDirection: 'row',
  },
  explainerIcon: {
    marginTop: 4,
    marginRight: 12,
  },
  explainerText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#888',
  },
  enableSharingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 14,
  },
  sharedText: {
    fontSize: 16,
  },
});

export default InspectorSharing = () => {
  const { inspectorActions, sendInspectorAction } = useCardCreator();

  //const context = useCardCreator();
  //const [value, setValueAndSendAction] = useOptimisticBehaviorValue({
  //  behavior: tags,
  //  propName: 'tagsString',
  //  sendAction,
  //});
  //
  //const onChange = React.useCallback(
  //  (tagsString) => {
  //    if (tags.isActive) {
  //      setValueAndSendAction('set:tagsString', tagsString);
  //    } else {
  //      console.warn(`Expect all actors to have Tags, but this actor did not`);
  //      setValueAndSendAction('add', tagsString, { tagsString });
  //    }
  //  },
  //  [tags.isActive, sendAction, setValueAndSendAction]
  //);

  const onEnableShared = React.useCallback(() => {
    sendInspectorAction('setShared', true);
  }, [sendInspectorAction]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sharing</Text>
      <View style={styles.enableSharingContainer}>
        {!inspectorActions.isShared ? (
          <TouchableOpacity style={SceneCreatorConstants.styles.button} onPress={onEnableShared}>
            <Text style={SceneCreatorConstants.styles.buttonLabel}>
              Enable sharing for blueprint
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.sharedText}>This blueprint is currently shared</Text>
        )}
      </View>

      <View style={styles.explainer}>
        <FeatherIcon name="book-open" size={18} color="#888" style={styles.explainerIcon} />
        <Text style={styles.explainerText}>
          A shared blueprint is available in other cards in the deck.
        </Text>
      </View>

      <View style={styles.explainer}>
        <FeatherIcon name="book-open" size={18} color="#888" style={styles.explainerIcon} />
        <Text style={styles.explainerText}>
          Editing a shared blueprint affects its actors in other cards too.
        </Text>
      </View>
    </View>
  );
};
