import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Responses } from './Responses';
import { Triggers } from './Triggers';
import { VectorIcon } from '../../../components/VectorIcon';
import { getRuleRenderContext } from './RuleRenderContext';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  rowText: {
    fontSize: 16,
    lineHeight: 20,
    paddingBottom: 8,
    paddingRight: 16,
  },
  keyCell: {
    fontWeight: '600',
  },
  noteCell: {
    fontFamily: 'Menlo',
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  newLineIcon: {
    marginHorizontal: 2,
    color: '#aaa',
  },
});

const makeResponseRows = (rows, order, indent, { response, context }) => {
  // flatten a deep response into a list of indented rows
  rows.push({
    indent,
    order,
    isNote: response?.name === 'note' ? true : undefined,
    cells: Responses.makeCells({ response, context, isPreview: true }),
  });
  if (!response) return;

  if (response.params?.condition) {
    // append condition to existing row
    let responseCells = rows[rows.length - 1].cells;
    rows[rows.length - 1].cells = responseCells.concat(
      Responses.makeCells({ response: response.params.condition, context, isPreview: true })
    );
  }

  if (response.params?.then || (response.params && response.params['else'])) {
    // add the 'if' cells to this row
    if (response.params.then) {
      makeResponseRows(rows, 0, indent + 1, { response: response.params.then, context });
    }
    if (response.params['else']) {
      rows.push({
        indent,
        order: order + 1,
        cells: [{ label: 'Else' }],
      });
      makeResponseRows(rows, 0, indent + 1, { response: response.params['else'], context });
    }
  }
  if (response.params?.body) {
    if (!(response.name === 'create text' && response.params.action !== 'perform response')) {
      makeResponseRows(rows, 0, indent + 1, { response: response.params.body, context });
    }
  }
  let nextResponse = response.params?.nextResponse;
  if (nextResponse) {
    makeResponseRows(rows, order + 1, indent, { response: nextResponse, context });
  }
};

export const RulePreview = ({ rule }) => {
  const context = getRuleRenderContext();
  let triggerCells = Triggers.makeCells({ trigger: rule.trigger, context, isPreview: true });

  let responseRows = [];
  makeResponseRows(responseRows, 0, 1, { response: rule.response, context });

  return (
    <View>
      <Text style={styles.rowText}>
        {triggerCells.map((cell, ii) => {
          if (cell.type === 'text' || cell.type === 'showEntryOptions') {
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
        <View
          key={`response-row-${ii}`}
          style={[
            styles.row,
            { marginLeft: (row.order === 0 ? row.indent - 1 : row.indent) * 20 },
          ]}>
          {row.order === 0 ? (
            <VectorIcon
              family="MaterialIcons"
              name="subdirectory-arrow-right"
              size={16}
              style={styles.newLineIcon}
            />
          ) : null}
          <Text style={styles.rowText}>
            {row.cells.map((cell, jj) => {
              const key = `response-cell-${ii}-${jj}`;
              if (cell.type === 'text') {
                return `${cell.label} `;
              } else if (cell.type === 'icon') {
                return (
                  <Text key={key} style={{ letterSpacing: 1 }}>
                    <VectorIcon family={cell.family} name={cell.icon} size={16} color="#666" />{' '}
                  </Text>
                );
              } else if (row.isNote) {
                return (
                  <Text style={styles.noteCell} key={key}>
                    {cell.label}{' '}
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
        </View>
      ))}
    </View>
  );
};
