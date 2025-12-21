/**
 * Storybook - Interactive Component Catalog
 *
 * A comprehensive storybook system for exploring and documenting Tuiuiu components.
 *
 * Features:
 * - Interactive CLI navigation
 * - Multiple view modes (preview, playground, comparatives, docs)
 * - Live prop editing
 * - Side-by-side comparisons
 * - Search and filtering
 *
 * Usage:
 *   pnpm storybook
 *
 * Or programmatically:
 *   import { runStorybook, createRegistry, story } from 'tuiuiu/storybook';
 *
 *   const registry = createRegistry();
 *   registry.register(
 *     story('MyComponent')
 *       .category('Custom')
 *       .render((props) => MyComponent(props))
 *   );
 *
 *   await runStorybook({ registry });
 */

// Types
export type {
  Story,
  StoryCategory,
  ControlType,
  ControlDefinition,
} from './types.js';

// Core modules
export {
  // Navigator
  createNavigator,
  type Navigator,
  type NavigatorState,
  type NavigatorOptions,
  type ViewMode,
  type FocusArea,

  // Registry
  createRegistry,
  defaultControls,
  story,
  type Registry,
  type RegistryStats,
  type StoryConfig,

  // Playground
  createPlayground,
  getEditorType,
  validateValue,
  type Playground,
  type PlaygroundState,
  type PlaygroundOptions,

  // Comparatives
  createComparatives,
  createComparison,
  comparisonTemplates,
  type Comparatives,
  type ComparativeState,
  type ComparativesOptions,
  type Variant,
  type VariantGroup,
  type LayoutMode,
} from './core/index.js';

// Components
export {
  Sidebar,
  CompactSidebar,
  SidebarHelp,
  type SidebarProps,

  Preview,
  ModeSwitcher,
  type PreviewProps,

  CompareView,
  CompactCompareView,
  PropertyComparison,
  CompareViewHelp,
  type CompareViewProps,
} from './components/index.js';

// Main app runner
export { runStorybook } from './app.js';

// Stories (Atomic Design)
export {
  allStories,
  storiesByCategory,
  registerAllStories,
  getStoryCounts,
  allAtomStories,
  allMoleculeStories,
  allOrganismStories,
  allAppStories,
} from './stories/index.js';
