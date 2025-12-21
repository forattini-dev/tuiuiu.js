/**
 * Storybook Stories Index
 *
 * Stories organized following Atomic Design methodology:
 * - Atoms: Basic building blocks (Box, Text, Spacer, Divider, Badge, Spinner)
 * - Molecules: Simple combinations (Forms, Alerts, Tabs, Sparklines)
 * - Organisms: Complex UI patterns (Layouts, Charts, Dashboards)
 * - Apps: Complete application templates (Shells, Navbars, Status Bars)
 */

import type { Story } from '../types.js';
import type { Registry } from '../core/registry.js';

// Import atomic design categories
import { allAtomStories } from './atoms/index.js';
import { allMoleculeStories } from './molecules/index.js';
import { allOrganismStories } from './organisms/index.js';
import { allAppStories } from './apps/index.js';

/**
 * All stories from all categories (Atomic Design)
 */
export const allStories: Story[] = [
  ...allAtomStories,
  ...allMoleculeStories,
  ...allOrganismStories,
  ...allAppStories,
];

/**
 * Stories grouped by Atomic Design category
 */
export const storiesByCategory = {
  atoms: allAtomStories,
  molecules: allMoleculeStories,
  organisms: allOrganismStories,
  apps: allAppStories,
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
    Atoms: allAtomStories.length,
    Molecules: allMoleculeStories.length,
    Organisms: allOrganismStories.length,
    Apps: allAppStories.length,
    Total: allStories.length,
  };
}

// Re-export individual category stories
export { allAtomStories } from './atoms/index.js';
export { allMoleculeStories } from './molecules/index.js';
export { allOrganismStories } from './organisms/index.js';
export { allAppStories } from './apps/index.js';
