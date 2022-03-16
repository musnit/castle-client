import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../../../components/AppText';

import { RuleBlueprintsSheet } from '../../sheets/RuleBlueprintsSheet';
import { SelectBehaviorPropertySheet } from '../components/SelectBehaviorPropertySheet';
import { SelectBehaviorSheet } from '../components/SelectBehaviorSheet';
import { CardDestinationPickerSheet } from '../../sheets/CardDestinationPickerSheet';
import { RuleParamInputSheet } from './RuleParamInputSheet';
import * as Constants from '../../../Constants';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';

const styles = StyleSheet.create({
  cell: {
    marginRight: 8,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  select: {
    ...Constants.styles.dropShadow,
    backgroundColor: '#fff',
    marginRight: 8,
    padding: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  placeholder: {
    shadowOpacity: 0,
    borderColor: '#aaa',
    borderBottomWidth: 1,
  },
  text: {
    fontSize: 16,
    color: Constants.colors.black,
  },
  selectText: {
    fontSize: 16,
    color: Constants.colors.black,
  },
  placeholderText: {
    fontSize: 16,
    color: Constants.colors.grayText,
  },
  noteText: {
    fontFamily: 'Menlo',
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    fontStyle: 'italic',
  },
});

export const ConfigureRuleEntry = ({
  entry,
  cells,
  behaviors,
  useAllBehaviors, // true if we should not filter rule options by the actor's behaviors
  triggerFilter,
  onChangeEntry,
  onShowPicker,
  onShowOptions = () => {},
  onChangeParams,
  addChildSheet,
}) => {
  const showEditParamSheet = ({ paramNames, paramValues, ...cell }) =>
    addChildSheet({
      key: 'ruleParamInput',
      Component: RuleParamInputSheet,
      entry,
      triggerFilter,
      paramNames,
      initialValues: paramValues,
      onChangeParams,
      useAllBehaviors,
      ...cell,
    });

  const showEditParamSheetForCell = (cell) => {
    if (cell.paramNames) {
      showEditParamSheet(cell);
    } else {
      showEditParamSheet({
        paramNames: [cell.paramName],
        paramValues: { [cell.paramName]: cell.paramValue },
        ...cell,
      });
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

  const showBehaviorPicker = (cell) =>
    addChildSheet({
      key: 'behaviorPicker',
      Component: SelectBehaviorSheet,
      behaviors,
      useAllBehaviors,
      isBehaviorVisible: cell.isBehaviorVisible,
      onSelectBehavior: (behavior) => onChangeParams({ behaviorId: behavior.behaviorId }),
    });

  const showBehaviorPropertyPicker = (cell) =>
    addChildSheet({
      key: 'behaviorPropertyPicker',
      Component: SelectBehaviorPropertySheet,
      behaviors,
      useAllBehaviors,
      isPropertyVisible: cell.isPropertyVisible,
      onSelectBehaviorProperty: (behaviorId, propertyName) =>
        onChangeParams({ behaviorId, propertyName, value: 0, relative: false }),
    });

  const onPressCell = {
    selectEntry: () => onShowPicker(onChangeEntry),
    selectEntryPlaceholder: () => onShowPicker(onChangeEntry),
    showEntryOptions: onShowOptions,
    selectParamSheet: showEditParamSheetForCell,
    selectParamSheetPlaceholder: showEditParamSheetForCell,
    selectCardSheet: showCardPicker,
    selectBlueprintSheet: showBlueprintPicker,
    selectBlueprintSheetPlaceholder: showBlueprintPicker,
    selectBehaviorPropertySheet: showBehaviorPropertyPicker,
    selectBehaviorPropertySheetPlaceholder: showBehaviorPropertyPicker,
    selectBehaviorSheet: showBehaviorPicker,
    selectNoteSheet: showEditParamSheetForCell,
  };

  return (
    <React.Fragment>
      {cells.map((cell, ii) => {
        const key = `entry-cell-${ii}`;
        if (cell.isPreview) {
          return null;
        }
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
          case 'selectBehaviorPropertySheet':
          case 'selectBehaviorSheet': {
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
          case 'selectParamSheetPlaceholder':
          case 'selectBlueprintSheetPlaceholder':
          case 'selectBehaviorPropertySheetPlaceholder': {
            return (
              <TouchableOpacity
                key={key}
                style={[styles.cell, styles.select, styles.placeholder]}
                onPress={() => onPressCell[cell.type](cell)}>
                <Text style={[styles.placeholderText]}>{cell.label}</Text>
              </TouchableOpacity>
            );
          }
          case 'selectNoteSheet': {
            return (
              <TouchableOpacity
                key={key}
                style={[styles.cell, styles.select]}
                onPress={() => onPressCell[cell.type](cell)}>
                <Text style={[styles.selectText, styles.noteText]}>
                  <FontAwesomeIcon
                    name="sticky-note-o"
                    size={16}
                    color="#000"
                    style={{ letterSpacing: 4 }}
                  />
                  {cell.label}
                </Text>
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
