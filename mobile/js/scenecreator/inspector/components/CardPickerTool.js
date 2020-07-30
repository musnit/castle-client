import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Labelled, ToolsContext, useValue } from '../../../Tools';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';
import * as Utilities from '../../../common/utilities';

let Colors = SceneCreatorConstants.Colors;

const styles = StyleSheet.create({
  textInput: {
    flex: 1,
    color: Colors.textInput.text,
    backgroundColor: Colors.textInput.background,
    borderColor: Colors.textInput.border,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});

const CardPickerTool = ({ element }) => {
  const [card, setCard] = useValue({ element, propName: 'card' });
  const { deck, showDestinationPicker } = React.useContext(ToolsContext);

  return (
    <Labelled element={element}>
      <TouchableOpacity
        style={styles.textInput}
        onPress={() => {
          showDestinationPicker((card) => setCard(card));
        }}>
        <Text style={{ color: Colors.textInput.text }}>
          {card ? Utilities.makeCardPreviewTitle(card, deck) : 'Choose card...'}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.text} />
      </TouchableOpacity>
    </Labelled>
  );
};

export default CardPickerTool;
