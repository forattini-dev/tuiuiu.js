/**
 * Storybook Stories Index
 *
 * Stories organized following Atomic Design methodology + Patterns:
 * - Primitives: Core render nodes (Box, Text, Spacer, Divider)
 * - Atoms: Basic building blocks (Badge, Spinner, Button, Switch)
 * - Molecules: Simple combinations (Forms, Alerts, Tabs, Sparklines)
 * - Organisms: Complex UI patterns (Layouts, Charts, Dashboards)
 * - Templates: Complete application templates (Shells, Navbars, Status Bars)
 * - Guides: Hooks, signals, performance, reactive state, error handling
 */

import type { Story } from '../types.js';
import type { Registry } from '../core/registry.js';

// Import atomic design categories
import { allPrimitiveStories } from './primitives/index.js';
import { allAtomStories } from './atoms/index.js';
import { allMoleculeStories } from './molecules/index.js';
import { allOrganismStories } from './organisms/index.js';
import { allTemplateStories } from './templates/index.js';
import { allGuideStories } from './patterns/index.js';

/**
 * All stories from all categories
 */
export const allStories: Story[] = [
  ...allPrimitiveStories,
  ...allAtomStories,
  ...allMoleculeStories,
  ...allOrganismStories,
  ...allTemplateStories,
  ...allGuideStories,
];

/**
 * Stories grouped by category
 */
export const storiesByCategory = {
  primitives: allPrimitiveStories,
  atoms: allAtomStories,
  molecules: allMoleculeStories,
  organisms: allOrganismStories,
  templates: allTemplateStories,
  guides: allGuideStories,
};

/**
 * Register all stories with a registry
 */
export function registerAllStories(registry: Registry): void {
  registry.registerMany(allStories);
}

/**
 * Get story count by category
 */
export function getStoryCounts(): Record<string, number> {
  return {
    Primitives: allPrimitiveStories.length,
    Atoms: allAtomStories.length,
    Molecules: allMoleculeStories.length,
    Organisms: allOrganismStories.length,
    Templates: allTemplateStories.length,
    Guides: allGuideStories.length,
    Total: allStories.length,
  };
}

// Re-export individual category stories
export { allPrimitiveStories } from './primitives/index.js';
export { allAtomStories } from './atoms/index.js';
export { allMoleculeStories } from './molecules/index.js';
export { allOrganismStories } from './organisms/index.js';
export { allTemplateStories } from './templates/index.js';
export { allGuideStories } from './patterns/index.js';
