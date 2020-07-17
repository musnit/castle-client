import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { RuleBlueprintsSheet } from '../../BlueprintsSheet';
import { BehaviorPropertiesSheet } from './BehaviorPropertiesSheet';
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
  behaviors,
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

  const showEditParamSheetForCell = (cell) => {
    if (cell.paramNames) {
      showEditParamSheet(cell.paramNames, cell.paramValues, cell.title);
    } else {
      showEditParamSheet([cell.paramName], { [cell.paramName]: cell.paramValue }, cell.title);
    }
  };

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
      Component: RuleBlueprintsSheet,
      title: 'Choose blueprint',
      onSelectBlueprint: (entryId) => onChangeParams({ entryId }),
    });

  const showBehaviorPropertyPicker = (cell) =>
    addChildSheet({
      key: 'behaviorPropertyPicker',
      Component: BehaviorPropertiesSheet,
      behaviors,
      isPropertyVisible: cell.isPropertyVisible,
      onSelectBehaviorProperty: (behaviorId, propertyName) =>
        onChangeParams({ behaviorId, propertyName }),
    });

  const onPressCell = {
    selectEntry: () => onShowPicker(onChangeEntry),
    selectEntryPlaceholder: () => onShowPicker(onChangeEntry),
    showEntryOptions: onShowOptions,
    selectParamSheet: showEditParamSheetForCell,
    selectParamSheetPlaceholder: showEditParamSheetForCell,
    selectCardSheet: showCardPicker,
    selectBlueprintSheet: showBlueprintPicker,
    selectBehaviorPropertySheet: showBehaviorPropertyPicker,
  };

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
          case 'selectEntry':
          case 'showEntryOptions':
          case 'selectParamSheet':
          case 'selectCardSheet':
          case 'selectBlueprintSheet':
          case 'selectBehaviorPropertySheet': {
            return (
              <TouchableOpacity
                key={key}
                style={[styles.cell, styles.select]}
                onPress={() => onPressCell[cell.type](cell)}>
                <Text style={[styles.selectText]}>{cell.label}</Text>
              </TouchableOpacity>
            );
          }
          case 'selectEntryPlaceholder':
          case 'selectParamSheetPlaceholder': {
            return (
              <TouchableOpacity
                key={key}
                style={[styles.cell, styles.select, styles.placeholder]}
                onPress={() => onPressCell[cell.type](cell)}>
                <Text style={[styles.placeholderText]}>{cell.label}</Text>
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
