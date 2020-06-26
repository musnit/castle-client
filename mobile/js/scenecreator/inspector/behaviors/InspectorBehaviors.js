export { default as Behavior } from './InspectorGenericBehavior';
export { default as Counter } from './InspectorCounter';
export { default as Drawing } from './InspectorDrawing';
export { default as Layout } from './InspectorLayout';
export { default as Motion } from './InspectorMotion';
export { default as Rules } from './InspectorRules';
export { default as Sliding } from './InspectorSliding';
export { default as Tags } from './InspectorTags';
export { default as TextContent } from './InspectorTextContent';
export { default as TextLayout } from './InspectorTextLayout';

export const MotionBehaviors = [
  {
    label: 'Collisions',
    dependencies: ['Body'],
    behaviors: ['Solid', 'Bouncy', 'Friction'],
  },
  {
    label: 'Physics',
    dependencies: ['Body', 'Moving'],
    behaviors: ['Sliding', 'Falling', 'SpeedLimit', 'Slowdown'],
  },
  {
    label: 'Controls',
    dependencies: ['Body', 'Moving'],
    behaviors: ['Drag', 'Sling'],
  },
];
