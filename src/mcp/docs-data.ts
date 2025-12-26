/**
 * Tuiuiu Documentation Data
 *
 * Structured documentation for all components, hooks, and utilities.
 * This data is served via MCP to AI assistants.
 *
 * Documentation is split into separate files for easier maintenance.
 * See src/mcp/docs/ for individual category files.
 */

import type { ComponentDoc, HookDoc, ThemeDoc } from './types.js';

// Import from split files
import { primitives } from './docs/primitives.js';
import { atoms } from './docs/atoms.js';
import { molecules } from './docs/molecules.js';
import { dataViz } from './docs/data-viz.js';
import { organisms } from './docs/organisms.js';
import { layouts } from './docs/layouts.js';
import { media } from './docs/media.js';
import { hooks } from './docs/hooks.js';
import { signals } from './docs/signals.js';
import { themeSystem, availableThemes, customThemeGuide } from './docs/themes.js';
import {
  apiPatterns,
  quickReference as apiPatternsQuickReference,
  componentPatternMap,
  getComponentPattern,
} from './docs/api-patterns.js';

// Re-export everything for backwards compatibility
export { primitives } from './docs/primitives.js';
export { atoms } from './docs/atoms.js';
export { molecules } from './docs/molecules.js';
export { dataViz } from './docs/data-viz.js';
export { organisms } from './docs/organisms.js';
export { layouts } from './docs/layouts.js';
export { media } from './docs/media.js';
export { hooks } from './docs/hooks.js';
export { signals } from './docs/signals.js';
export { themeSystem, availableThemes, customThemeGuide } from './docs/themes.js';
export {
  apiPatterns,
  quickReference as apiPatternsQuickReference,
  componentPatternMap,
  getComponentPattern,
  type ApiPatternDoc,
} from './docs/api-patterns.js';

// =============================================================================
// All Documentation Combined
// =============================================================================

export const allComponents: ComponentDoc[] = [
  ...primitives,
  ...atoms,
  ...molecules,
  ...dataViz,
  ...organisms,
  ...layouts,
  ...media,
  themeSystem,
];

export const allHooks: HookDoc[] = [
  ...hooks,
  ...signals,
];

export const allThemes: ThemeDoc[] = availableThemes;

// Category groupings for listing
export const categories = {
  primitives: primitives.map(c => c.name),
  atoms: atoms.map(c => c.name),
  molecules: [...molecules, ...dataViz].map(c => c.name),
  organisms: organisms.map(c => c.name),
  layouts: layouts.map(c => c.name),
  media: media.map(c => c.name),
  hooks: hooks.map(h => h.name),
  signals: signals.map(s => s.name),
  themes: availableThemes.map(t => t.name),
};
