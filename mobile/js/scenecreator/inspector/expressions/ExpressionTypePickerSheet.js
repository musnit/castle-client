import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { useCardCreator } from '../../CreateCardContext';

import * as Constants from '../../../Constants';

const styles = StyleSheet.create({
  container: {},
  category: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  categoryLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  addButton: {
    paddingVertical: 8,
  },
  addButtonLabel: {
    fontSize: 16,
    paddingBottom: 8,
  },
});

const CATEGORY_ORDER = [
  'values',
  'choices',
  'randomness',
  'spatial relationships',
  'arithmetic',
  'functions',
];

const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export const ExpressionTypePickerSheet = ({
  onSelectExpressionType,
  isOpen,
  onClose,
  addChildSheet,
  filterExpression = ([name, spec]) => true,
}) => {
  const { expressions } = useCardCreator();
  const [expressionCategories, setExpressionCategories] = React.useState(null);
  React.useEffect(() => {
    const filteredExpressions = Object.entries(expressions)
      .filter(filterExpression)
      .sort(([k1, a], [k2, b]) => {
        if (!b.order) return -1;
        if (!a.order) return 1;
        return a.order < b.order ? -1 : 1;
      });
    setExpressionCategories(
      filteredExpressions.reduce((categories, [expression, value]) => {
        if (!categories[value.category]) {
          categories[value.category] = [];
        }
        categories[value.category].push({ ...value, name: expression });
        return categories;
      }, {})
    );
  }, [expressions]);

  const renderContent = () => (
    <View style={styles.container}>
      {expressionCategories
        ? CATEGORY_ORDER.map((category) => {
            const entries = expressionCategories[category];
            return entries ? (
              <View key={`expression-category-${category}`} style={styles.category}>
                <Text style={styles.categoryLabel}>{capitalizeFirst(category)}</Text>
                {entries.map((expression) => (
                  <TouchableOpacity
                    key={`expression-type-${expression.name}`}
                    style={styles.addButton}
                    onPress={() => {
                      onSelectExpressionType(expression.name);
                      onClose();
                    }}>
                    <Text style={styles.addButtonLabel}>
                      {capitalizeFirst(expression.description)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null;
          })
        : null}
    </View>
  );

  const renderHeader = () => <BottomSheetHeader title="Choose expression type" onClose={onClose} />;

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
    />
  );
};
