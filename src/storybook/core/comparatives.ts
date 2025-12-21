/**
 * Storybook Comparatives Engine
 *
 * Handles side-by-side comparison of component variants:
 * - Generate variants from control options
 * - Custom variant definitions
 * - Layout modes (horizontal, vertical, grid)
 * - Diff highlighting
 */

import { createSignal } from '../../core/signal.js';
import type { Story, ControlDefinition } from '../types.js';
import type { VNode } from '../../utils/types.js';

export type LayoutMode = 'horizontal' | 'vertical' | 'grid';

export interface Variant {
  /** Variant label */
  label: string;
  /** Prop overrides for this variant */
  props: Record<string, any>;
  /** Optional description */
  description?: string;
}

export interface VariantGroup {
  /** Group name */
  name: string;
  /** Group description */
  description?: string;
  /** Variants in this group */
  variants: Variant[];
  /** What prop does this group vary */
  varyingProp?: string;
}

export interface ComparativeState {
  /** Base props (default values) */
  baseProps: Record<string, any>;
  /** Active variant groups */
  groups: VariantGroup[];
  /** Currently selected group index */
  selectedGroupIndex: number;
  /** Layout mode */
  layoutMode: LayoutMode;
  /** Number of columns for grid layout */
  gridColumns: number;
  /** Show labels */
  showLabels: boolean;
  /** Show borders */
  showBorders: boolean;
}

export interface Comparatives {
  // State
  state: () => ComparativeState;

  // Variant management
  addVariant: (groupIndex: number, variant: Variant) => void;
  removeVariant: (groupIndex: number, variantIndex: number) => void;
  updateVariant: (groupIndex: number, variantIndex: number, variant: Partial<Variant>) => void;

  // Group management
  addGroup: (group: VariantGroup) => void;
  removeGroup: (index: number) => void;
  selectGroup: (index: number) => void;

  // Auto-generation
  generateFromControl: (key: string, control: ControlDefinition) => VariantGroup;
  generateAllGroups: (controls: Record<string, ControlDefinition>) => void;

  // Layout
  setLayoutMode: (mode: LayoutMode) => void;
  setGridColumns: (columns: number) => void;
  toggleLabels: () => void;
  toggleBorders: () => void;

  // Get render data
  getCurrentVariants: () => Variant[];
  getVariantProps: (variant: Variant) => Record<string, any>;

  // Load story
  loadStory: (story: Story) => void;
}

export interface ComparativesOptions {
  /** Initial story */
  story?: Story;
  /** Initial layout mode */
  layoutMode?: LayoutMode;
  /** Grid columns */
  gridColumns?: number;
}

/**
 * Create a comparatives manager
 */
export function createComparatives(options: ComparativesOptions = {}): Comparatives {
  const { story, layoutMode = 'horizontal', gridColumns = 2 } = options;

  const initialBaseProps = story
    ? Object.fromEntries(
        Object.entries(story.controls || {}).map(([key, control]) => [
          key,
          control.defaultValue,
        ])
      )
    : {};

  const [state, setState] = createSignal<ComparativeState>({
    baseProps: { ...initialBaseProps },
    groups: [],
    selectedGroupIndex: 0,
    layoutMode,
    gridColumns,
    showLabels: true,
    showBorders: true,
  });

  // Variant management
  const addVariant = (groupIndex: number, variant: Variant): void => {
    setState((s) => {
      const newGroups = [...s.groups];
      if (groupIndex < 0 || groupIndex >= newGroups.length) return s;
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        variants: [...newGroups[groupIndex].variants, variant],
      };
      return { ...s, groups: newGroups };
    });
  };

  const removeVariant = (groupIndex: number, variantIndex: number): void => {
    setState((s) => {
      const newGroups = [...s.groups];
      if (groupIndex < 0 || groupIndex >= newGroups.length) return s;
      const group = newGroups[groupIndex];
      if (variantIndex < 0 || variantIndex >= group.variants.length) return s;
      newGroups[groupIndex] = {
        ...group,
        variants: group.variants.filter((_, i) => i !== variantIndex),
      };
      return { ...s, groups: newGroups };
    });
  };

  const updateVariant = (
    groupIndex: number,
    variantIndex: number,
    updates: Partial<Variant>
  ): void => {
    setState((s) => {
      const newGroups = [...s.groups];
      if (groupIndex < 0 || groupIndex >= newGroups.length) return s;
      const group = newGroups[groupIndex];
      if (variantIndex < 0 || variantIndex >= group.variants.length) return s;
      newGroups[groupIndex] = {
        ...group,
        variants: group.variants.map((v, i) =>
          i === variantIndex ? { ...v, ...updates } : v
        ),
      };
      return { ...s, groups: newGroups };
    });
  };

  // Group management
  const addGroup = (group: VariantGroup): void => {
    setState((s) => ({
      ...s,
      groups: [...s.groups, group],
    }));
  };

  const removeGroup = (index: number): void => {
    setState((s) => {
      if (index < 0 || index >= s.groups.length) return s;
      const newGroups = s.groups.filter((_, i) => i !== index);
      const newSelectedIndex = Math.min(s.selectedGroupIndex, newGroups.length - 1);
      return {
        ...s,
        groups: newGroups,
        selectedGroupIndex: Math.max(0, newSelectedIndex),
      };
    });
  };

  const selectGroup = (index: number): void => {
    setState((s) => {
      if (index < 0 || index >= s.groups.length) return s;
      return { ...s, selectedGroupIndex: index };
    });
  };

  // Auto-generation
  const generateFromControl = (
    key: string,
    control: ControlDefinition
  ): VariantGroup => {
    const variants: Variant[] = [];

    switch (control.type) {
      case 'select':
        if (control.options) {
          for (const option of control.options) {
            variants.push({
              label: String(option),
              props: { [key]: option },
            });
          }
        }
        break;

      case 'boolean':
        variants.push(
          { label: 'true', props: { [key]: true } },
          { label: 'false', props: { [key]: false } }
        );
        break;

      case 'color':
        const colors = ['white', 'gray', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan'];
        for (const color of colors) {
          variants.push({
            label: color,
            props: { [key]: color },
          });
        }
        break;

      case 'range':
      case 'number':
        const min = control.min ?? 0;
        const max = control.max ?? 100;
        const step = control.step ?? Math.ceil((max - min) / 5);
        for (let v = min; v <= max; v += step) {
          variants.push({
            label: String(v),
            props: { [key]: v },
          });
        }
        break;

      default:
        // For text, just show the default value
        variants.push({
          label: 'Default',
          props: { [key]: control.defaultValue },
        });
    }

    return {
      name: control.label,
      description: `Variants for ${key}`,
      variants,
      varyingProp: key,
    };
  };

  const generateAllGroups = (controls: Record<string, ControlDefinition>): void => {
    setState((s) => {
      const newGroups: VariantGroup[] = [];

      for (const [key, control] of Object.entries(controls)) {
        // Skip text controls as they generate too many variants
        if (control.type === 'text') continue;

        const group = generateFromControl(key, control);
        // Limit variants to keep display manageable
        group.variants = group.variants.slice(0, 8);
        newGroups.push(group);
      }

      return {
        ...s,
        groups: newGroups,
        selectedGroupIndex: 0,
      };
    });
  };

  // Layout
  const setLayoutMode = (mode: LayoutMode): void => {
    setState((s) => ({ ...s, layoutMode: mode }));
  };

  const setGridColumns = (columns: number): void => {
    setState((s) => ({ ...s, gridColumns: Math.max(1, columns) }));
  };

  const toggleLabels = (): void => {
    setState((s) => ({ ...s, showLabels: !s.showLabels }));
  };

  const toggleBorders = (): void => {
    setState((s) => ({ ...s, showBorders: !s.showBorders }));
  };

  // Get render data
  const getCurrentVariants = (): Variant[] => {
    const s = state();
    if (s.groups.length === 0) return [];
    if (s.selectedGroupIndex < 0 || s.selectedGroupIndex >= s.groups.length) return [];
    return s.groups[s.selectedGroupIndex].variants;
  };

  const getVariantProps = (variant: Variant): Record<string, any> => {
    const s = state();
    return { ...s.baseProps, ...variant.props };
  };

  // Load story
  const loadStory = (story: Story): void => {
    const baseProps = Object.fromEntries(
      Object.entries(story.controls || {}).map(([key, control]) => [
        key,
        control.defaultValue,
      ])
    );

    setState({
      baseProps,
      groups: [],
      selectedGroupIndex: 0,
      layoutMode: state().layoutMode,
      gridColumns: state().gridColumns,
      showLabels: true,
      showBorders: true,
    });

    // Auto-generate groups
    generateAllGroups(story.controls || {});
  };

  return {
    state,
    addVariant,
    removeVariant,
    updateVariant,
    addGroup,
    removeGroup,
    selectGroup,
    generateFromControl,
    generateAllGroups,
    setLayoutMode,
    setGridColumns,
    toggleLabels,
    toggleBorders,
    getCurrentVariants,
    getVariantProps,
    loadStory,
  };
}

/**
 * Create a comparison definition for a specific component
 */
export function createComparison(config: {
  title: string;
  description?: string;
  variants: Variant[];
  layout?: LayoutMode;
}): VariantGroup {
  return {
    name: config.title,
    description: config.description,
    variants: config.variants,
  };
}

/**
 * Built-in comparison templates
 */
export const comparisonTemplates = {
  // Border styles comparison
  borderStyles: (): VariantGroup => ({
    name: 'Border Styles',
    description: 'Compare different border styles',
    variants: [
      { label: 'Single', props: { borderStyle: 'single' } },
      { label: 'Double', props: { borderStyle: 'double' } },
      { label: 'Round', props: { borderStyle: 'round' } },
      { label: 'Bold', props: { borderStyle: 'bold' } },
      { label: 'Classic', props: { borderStyle: 'classic' } },
    ],
    varyingProp: 'borderStyle',
  }),

  // Colors comparison
  colors: (): VariantGroup => ({
    name: 'Colors',
    description: 'Compare color options',
    variants: [
      { label: 'White', props: { color: 'white' } },
      { label: 'Cyan', props: { color: 'cyan' } },
      { label: 'Green', props: { color: 'green' } },
      { label: 'Yellow', props: { color: 'yellow' } },
      { label: 'Red', props: { color: 'red' } },
      { label: 'Magenta', props: { color: 'magenta' } },
      { label: 'Blue', props: { color: 'blue' } },
    ],
    varyingProp: 'color',
  }),

  // Sizes comparison
  sizes: (): VariantGroup => ({
    name: 'Sizes',
    description: 'Compare different sizes',
    variants: [
      { label: 'XS', props: { size: 'xs', padding: 0 } },
      { label: 'SM', props: { size: 'sm', padding: 1 } },
      { label: 'MD', props: { size: 'md', padding: 2 } },
      { label: 'LG', props: { size: 'lg', padding: 3 } },
    ],
    varyingProp: 'size',
  }),

  // States comparison
  states: (): VariantGroup => ({
    name: 'States',
    description: 'Compare component states',
    variants: [
      { label: 'Default', props: {} },
      { label: 'Focused', props: { isFocused: true } },
      { label: 'Disabled', props: { disabled: true } },
      { label: 'Loading', props: { isLoading: true } },
    ],
  }),
};
