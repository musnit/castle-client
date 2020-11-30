import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Triggers } from './Triggers';
import { Responses } from './Responses';
import { useCardCreator } from '../../CreateCardContext';

const styles = StyleSheet.create({
  rowText: {
    fontSize: 16,
    paddingBottom: 8,
  },
  keyCell: { fontWeight: 'bold' },
});

const makeResponseRows = (rows, indent, { response, context }) => {
  // flatten a deep response into a list of indented rows
  rows.push({
    indent,
    cells: Responses.makeCells({ response, context }),
  });
  if (response.params?.then) {
    makeResponseRows(rows, indent + 1, { response: response.params.then, context });
    if (response.params['else']) {
      rows.push({
        indent,
        cells: [{ label: 'Else' }],
      });
      makeResponseRows(rows, indent + 1, { response: response.params['else'], context });
    }
  }
  if (response.params?.body) {
    makeResponseRows(rows, indent + 1, { response: response.params.body, context });
  }
  let nextResponse = response.params?.nextResponse;
  while (nextResponse) {
    makeResponseRows(rows, indent, { response: nextResponse, context });
    nextResponse = response.params?.nextResponse;
  }
};

export const RulePreview = ({ rule }) => {
  const context = useCardCreator();
  let triggerCells = Triggers.makeCells({ trigger: rule.trigger, context });

  let responseRows = [];
  makeResponseRows(responseRows, 1, { response: rule.response, context });

  return (
    <View>
      <Text style={styles.rowText}>
        {triggerCells.map((cell, ii) => {
          if (cell.type === 'text') {
            return `${cell.label} `;
          } else {
            return (
              <Text style={styles.keyCell} key={`trigger-cell-${ii}`}>
                {cell.label}{' '}
              </Text>
            );
          }
        })}
      </Text>
      {responseRows.map((row, ii) => (
        <Text style={[styles.rowText, { marginLeft: row.indent * 12 }]} key={`response-row-${ii}`}>
          {row.cells.map((cell, jj) => {
            if (cell.type === 'text') {
              return `${cell.label} `;
            } else {
              return (
                <Text style={styles.keyCell} key={`response-cell-${ii}-${jj}`}>
                  {cell.label}{' '}
                </Text>
              );
            }
          })}
        </Text>
      ))}
    </View>
  );
};
