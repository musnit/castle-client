import React from 'react';
import { InspectorDropdown } from '../../inspector/components/InspectorDropdown';

const noteItems = [
  {
    id: 0,
    name: 'C',
  },
  {
    id: 1,
    name: 'C#',
  },
  {
    id: 2,
    name: 'D',
  },
  {
    id: 3,
    name: 'D#',
  },
  {
    id: 4,
    name: 'E',
  },
  {
    id: 5,
    name: 'F',
  },
  {
    id: 6,
    name: 'F#',
  },
  {
    id: 7,
    name: 'G',
  },
  {
    id: 8,
    name: 'G#',
  },
  {
    id: 9,
    name: 'A',
  },
  {
    id: 10,
    name: 'A#',
  },
  {
    id: 11,
    name: 'B',
  },
];

// TODO: other scales besides chromatic
export const ScaleNoteDropdown = (props) => (
  <InspectorDropdown labeledItems={noteItems} {...props} />
);
