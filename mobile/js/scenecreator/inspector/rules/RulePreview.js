import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Responses } from './Responses';
import { Triggers } from './Triggers';
import { useCardCreator } from '../../CreateCardContext';
import { VectorIcon } from '../../../components/VectorIcon';

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
    cells: Responses.makeCells({ response, context, isPreview: true }),
  });
  if (!response) return;

  if (response.params?.then) {
    // add the 'if' cells to this row
    let responseCells = rows[rows.length - 1].cells;
    rows[rows.length - 1].cells = responseCells.concat(
      Responses.makeCells({ response: response.params.condition, context, isPreview: true })
    );

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
  if (nextResponse) {
    makeResponseRows(rows, indent, { response: nextResponse, context });
  }
};

export const RulePreview = ({ rule }) => {
  const context = useCardCreator();
  let triggerCells = Triggers.makeCells({ trigger: rule.trigger, context, isPreview: true });

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
            const key = `response-cell-${ii}-${jj}`;
            if (cell.type === 'text') {
              return `${cell.label} `;
            } else if (cell.type === 'icon') {
              return (
                <Text key={key}>
                  <VectorIcon family={cell.family} name={cell.icon} size={16} color="#000" />{' '}
                </Text>
              );
            } else {
              return (
                <Text style={styles.keyCell} key={key}>
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
