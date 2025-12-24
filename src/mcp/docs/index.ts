/**
 * MCP Documentation Index
 *
 * Central export for all component, hook, and theme documentation.
 * Split into separate files for easier maintenance.
 */

// Component documentation by category
export { primitives } from './primitives.js';
export { atoms } from './atoms.js';
export { molecules } from './molecules.js';
export { dataViz } from './data-viz.js';
export { organisms } from './organisms.js';
export { layouts } from './layouts.js';
export { media } from './media.js';

// Hook documentation
export { hooks } from './hooks.js';
export { signals } from './signals.js';

// Theme documentation
export { themeSystem, availableThemes, customThemeGuide } from './themes.js';

// Re-export types for convenience
export type { ComponentDoc, HookDoc, ThemeDoc, PropDefinition } from '../types.js';
