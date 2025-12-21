/**
 * Design System Primitives - Basic building block components
 */

// Helpers (internal)
export { normalizeChildren } from './helpers.js';

// Core components
export { Box } from './box.js';
export { Text } from './text.js';
export { Spacer, Newline, Fragment } from './spacer.js';
export { Divider, type DividerProps } from './divider.js';
export { Slot, type SlotProps } from './slot.js';

// Utility components
export {
  When,
  Each,
  Transform,
  Static,
  type TransformProps,
  type StaticProps,
} from './utilities.js';
