import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import BlueprintsSheet from '../../BlueprintsSheet';
import CardDestinationPickerSheet from '../../CardDestinationPickerSheet';
import RuleParamInputSheet from './RuleParamInputSheet';
import * as Constants from '../../../Constants';

const styles = StyleSheet.create({
  cell: {
    marginRight: 8,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  select: {
    marginRight: 8,
    padding: 8,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
  },
  placeholder: {
    borderColor: '#aaa',
    borderBottomWidth: 1,
  },
  text: {
    fontSize: 16,
  },
  selectText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholderText: {
    fontSize: 16,
    color: Constants.colors.grayText,
  },
});

export const ConfigureRuleEntry = ({
  entry,
  cells,
  onChangeEntry,
  onShowPicker,
  onShowOptions = () => {},
  onChangeParams,
  addChildSheet,
}) => {
  const showEditParamSheet = (paramNames, initialValues, title) =>
    addChildSheet({
      key: 'ruleParamInput',
      Component: RuleParamInputSheet,
      title,
      entry,
      paramNames,
      initialValues,
      onChangeParams,
    });

  const showCardPicker = () =>
    addChildSheet({
      key: 'destinationPicker',
      Component: CardDestinationPickerSheet,
      onSelectCard: (card) =>
        onChangeParams({
          card: {
            cardId: card.cardId,
            title: card.title,
          },
        }),
    });

  const showBlueprintPicker = () =>
    addChildSheet({
      key: 'ruleBlueprintPicker',
      Component: BlueprintsSheet,
      title: 'Choose blueprint',
      onSelectBlueprint: (entryId) => onChangeParams({ entryId }),
    });

  return (
    <React.Fragment>
      {cells.map((cell, ii) => {
        const key = `entry-cell-${ii}`;
        switch (cell.type) {
          case 'text': {
            return (
              <View key={key} style={styles.cell}>
                <Text style={styles.text}>{cell.label}</Text>
              </View>
            );
          }
          case 'selectEntry': {
            return (
              <TouchableOpacity
                key={key}
                style={[styles.cell, styles.select]}
                onPress={() => onShowPicker(onChangeEntry)}>
                <Text style={[styles.selectText]}>{cell.label}</Text>
              </TouchableOpacity>
            );
          }
          case 'selectEntryPlaceholder': {
            return (
              <TouchableOpacity
                key={key}
                style={[styles.cell, styles.select, styles.placeholder]}
                onPress={() => onShowPicker(onChangeEntry)}>
                <Text style={[styles.placeholderText]}>{cell.label}</Text>
              </TouchableOpacity>
            );
          }
          case 'showEntryOptions': {
            return (
              <TouchableOpacity
                key={key}
                style={[styles.cell, styles.select]}
                onPress={onShowOptions}>
                <Text style={styles.selectText}>{cell.label}</Text>
              </TouchableOpacity>
            );
          }
          case 'selectParamSheet': {
            return (
              <TouchableOpacity
                key={key}
                style={[styles.cell, styles.select]}
                onPress={() => {
                  if (cell.paramNames) {
                    showEditParamSheet(cell.paramNames, cell.paramValues, cell.title);
                  } else {
                    showEditParamSheet(
                      [cell.paramName],
                      { [cell.paramName]: cell.paramValue },
                      cell.title
                    );
                  }
                }}>
                <Text style={styles.selectText}>{cell.label}</Text>
              </TouchableOpacity>
            );
          }
          case 'selectCardSheet': {
            return (
              <TouchableOpacity
                key={key}
                style={[styles.cell, styles.select]}
                onPress={showCardPicker}>
                <Text style={styles.selectText}>{cell.label}</Text>
              </TouchableOpacity>
            );
          }
          case 'selectBlueprintSheet': {
            return (
              <TouchableOpacity
                key={key}
                style={[styles.cell, styles.select]}
                onPress={showBlueprintPicker}>
                <Text style={styles.selectText}>{cell.label}</Text>
              </TouchableOpacity>
            );
          }
          default: {
            return (
              <View key={key} style={styles.cell}>
                <Text style={styles.text}>{JSON.stringify(cell, null, 2)}</Text>
              </View>
            );
          }
        }
      })}
    </React.Fragment>
  );
};
