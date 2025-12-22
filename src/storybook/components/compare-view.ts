/**
 * Storybook Compare View Component
 *
 * Renders multiple story variants side-by-side:
 * - Horizontal layout
 * - Vertical layout
 * - Grid layout
 * - Diff highlighting
 */

import { Box, Text } from '../../primitives/nodes.js';
import { Divider } from '../../primitives/divider.js';
import type { VNode } from '../../utils/types.js';
import type { Story } from '../types.js';
import type { Comparatives, Variant, VariantGroup, LayoutMode } from '../core/comparatives.js';
import { themeColor } from '../../core/theme.js';

export interface CompareViewProps {
  comparatives: Comparatives;
  story: Story;
  isFocused?: boolean;
}

/**
 * Render a single variant preview
 */
function VariantPreview(props: {
  story: Story;
  variant: Variant;
  baseProps: Record<string, any>;
  showLabel: boolean;
  showBorder: boolean;
}): VNode {
  const { story, variant, baseProps, showLabel, showBorder } = props;
  const mergedProps = { ...baseProps, ...variant.props };

  const content = (() => {
    try {
      return story.render(mergedProps);
    } catch (error: any) {
      return Box(
        { padding: 1 },
        Text({ color: themeColor('error') }, `Error: ${error.message}`)
      );
    }
  })();

  return Box(
    {
      flexDirection: 'column',
      borderStyle: showBorder ? 'single' : undefined,
      borderColor: themeColor('border'),
      padding: showBorder ? 1 : 0,
    },
    showLabel &&
      Box(
        { marginBottom: 1 },
        Text({ color: themeColor('primary'), bold: true }, variant.label),
        variant.description &&
          Box(
            {},
            Text({ color: themeColor('mutedForeground'), dim: true }, ` - ${variant.description}`)
          )
      ),
    content
  );
}

/**
 * Render variants in horizontal layout
 */
function HorizontalLayout(props: {
  story: Story;
  variants: Variant[];
  baseProps: Record<string, any>;
  showLabels: boolean;
  showBorders: boolean;
}): VNode {
  const { story, variants, baseProps, showLabels, showBorders } = props;

  return Box(
    { flexDirection: 'row', gap: 2 },
    ...variants.map((variant) =>
      Box(
        { flexGrow: 1 },
        VariantPreview({
          story,
          variant,
          baseProps,
          showLabel: showLabels,
          showBorder: showBorders,
        })
      )
    )
  );
}

/**
 * Render variants in vertical layout
 */
function VerticalLayout(props: {
  story: Story;
  variants: Variant[];
  baseProps: Record<string, any>;
  showLabels: boolean;
  showBorders: boolean;
}): VNode {
  const { story, variants, baseProps, showLabels, showBorders } = props;

  return Box(
    { flexDirection: 'column', gap: 1 },
    ...variants.map((variant) =>
      VariantPreview({
        story,
        variant,
        baseProps,
        showLabel: showLabels,
        showBorder: showBorders,
      })
    )
  );
}

/**
 * Render variants in grid layout
 */
function GridLayout(props: {
  story: Story;
  variants: Variant[];
  baseProps: Record<string, any>;
  columns: number;
  showLabels: boolean;
  showBorders: boolean;
}): VNode {
  const { story, variants, baseProps, columns, showLabels, showBorders } = props;

  // Split variants into rows
  const rows: Variant[][] = [];
  for (let i = 0; i < variants.length; i += columns) {
    rows.push(variants.slice(i, i + columns));
  }

  return Box(
    { flexDirection: 'column', gap: 1 },
    ...rows.map((row) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        ...row.map((variant) =>
          Box(
            { flexGrow: 1 },
            VariantPreview({
              story,
              variant,
              baseProps,
              showLabel: showLabels,
              showBorder: showBorders,
            })
          )
        )
      )
    )
  );
}

/**
 * Render group selector tabs
 */
function GroupTabs(props: {
  groups: VariantGroup[];
  selectedIndex: number;
  isFocused: boolean;
}): VNode {
  const { groups, selectedIndex, isFocused } = props;

  if (groups.length === 0) {
    return Text({ color: themeColor('mutedForeground'), dim: true }, 'No groups defined');
  }

  return Box(
    { flexDirection: 'row', gap: 2 },
    ...groups.map((group, idx) =>
      Box(
        {},
        Text(
          {
            color: idx === selectedIndex ? themeColor('primary') : themeColor('mutedForeground'),
            bold: idx === selectedIndex,
            inverse: idx === selectedIndex && isFocused,
          },
          `[${idx + 1}] ${group.name}`
        )
      )
    )
  );
}

/**
 * Render layout mode selector
 */
function LayoutSelector(props: {
  currentMode: LayoutMode;
  gridColumns: number;
}): VNode {
  const { currentMode, gridColumns } = props;

  const modes: Array<{ mode: LayoutMode; label: string; key: string }> = [
    { mode: 'horizontal', label: 'Horizontal', key: 'H' },
    { mode: 'vertical', label: 'Vertical', key: 'V' },
    { mode: 'grid', label: `Grid (${gridColumns}col)`, key: 'G' },
  ];

  return Box(
    { flexDirection: 'row', gap: 2 },
    Text({ color: themeColor('mutedForeground') }, 'Layout: '),
    ...modes.map(({ mode, label, key }) =>
      Box(
        {},
        Text(
          {
            color: currentMode === mode ? themeColor('success') : themeColor('mutedForeground'),
            bold: currentMode === mode,
          },
          `[${key}] ${label}`
        )
      )
    )
  );
}

/**
 * Main Compare View component
 */
export function CompareView(props: CompareViewProps): VNode {
  const { comparatives, story, isFocused = false } = props;
  const state = comparatives.state();
  const variants = comparatives.getCurrentVariants();
  const currentGroup = state.groups[state.selectedGroupIndex];

  // No variants to display
  if (variants.length === 0) {
    return Box(
      { flexDirection: 'column', padding: 2 },
      Text({ color: themeColor('mutedForeground'), dim: true }, 'No variants to compare'),
      Box(
        { marginTop: 1 },
        Text({ color: themeColor('mutedForeground') }, 'Press [A] to auto-generate variants from controls')
      )
    );
  }

  // Select layout renderer
  const layoutProps = {
    story,
    variants,
    baseProps: state.baseProps,
    showLabels: state.showLabels,
    showBorders: state.showBorders,
  };

  const layoutContent = (() => {
    switch (state.layoutMode) {
      case 'horizontal':
        return HorizontalLayout(layoutProps);
      case 'vertical':
        return VerticalLayout(layoutProps);
      case 'grid':
        return GridLayout({ ...layoutProps, columns: state.gridColumns });
      default:
        return HorizontalLayout(layoutProps);
    }
  })();

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'single',
      borderColor: isFocused ? themeColor('primary') : themeColor('border'),
    },
    // Header
    Box(
      {
        borderStyle: 'single',
        borderColor: isFocused ? themeColor('primary') : themeColor('border'),
        paddingX: 1,
      },
      Text({ color: themeColor('success'), bold: true }, 'Comparatives'),
      Text({ color: themeColor('mutedForeground') }, ` - ${story.name}`)
    ),
    // Group tabs
    Box(
      { paddingX: 1, paddingY: 1 },
      GroupTabs({
        groups: state.groups,
        selectedIndex: state.selectedGroupIndex,
        isFocused,
      })
    ),
    // Current group info
    currentGroup &&
      Box(
        { paddingX: 1 },
        Text({ color: themeColor('mutedForeground') }, 'Varying: '),
        Text({ color: themeColor('warning') }, currentGroup.varyingProp || 'multiple props'),
        Text({ color: themeColor('mutedForeground'), dim: true }, ` (${variants.length} variants)`)
      ),
    Divider({}),
    // Layout selector
    Box(
      { paddingX: 1, paddingY: 1 },
      LayoutSelector({
        currentMode: state.layoutMode,
        gridColumns: state.gridColumns,
      })
    ),
    // Variants display
    Box({ padding: 1, flexGrow: 1 }, layoutContent),
    // Footer with controls
    Box(
      {
        borderStyle: 'single',
        borderColor: themeColor('border'),
        paddingX: 1,
      },
      Text({ color: themeColor('mutedForeground'), dim: true }, '[1-9] Select group  [H/V/G] Layout  [L] Labels  [B] Borders  [+/-] Columns')
    )
  );
}

/**
 * Compact compare view (just variants, no controls)
 */
export function CompactCompareView(props: {
  story: Story;
  variants: Variant[];
  baseProps?: Record<string, any>;
  layout?: LayoutMode;
  columns?: number;
}): VNode {
  const { story, variants, baseProps = {}, layout = 'horizontal', columns = 2 } = props;

  const layoutProps = {
    story,
    variants,
    baseProps,
    showLabels: true,
    showBorders: true,
  };

  switch (layout) {
    case 'horizontal':
      return HorizontalLayout(layoutProps);
    case 'vertical':
      return VerticalLayout(layoutProps);
    case 'grid':
      return GridLayout({ ...layoutProps, columns });
    default:
      return HorizontalLayout(layoutProps);
  }
}

/**
 * Quick comparison for a single property
 */
export function PropertyComparison(props: {
  story: Story;
  propName: string;
  values: any[];
  baseProps?: Record<string, any>;
  layout?: LayoutMode;
}): VNode {
  const { story, propName, values, baseProps = {}, layout = 'horizontal' } = props;

  const variants: Variant[] = values.map((value) => ({
    label: String(value),
    props: { [propName]: value },
  }));

  return Box(
    { flexDirection: 'column' },
    Box(
      { marginBottom: 1 },
      Text({ color: themeColor('foreground'), bold: true }, `Comparing: `),
      Text({ color: themeColor('primary') }, propName)
    ),
    CompactCompareView({
      story,
      variants,
      baseProps,
      layout,
    })
  );
}

/**
 * Help overlay for compare view
 */
export function CompareViewHelp(): VNode {
  const shortcuts = [
    { key: '1-9', desc: 'Select variant group' },
    { key: 'H', desc: 'Horizontal layout' },
    { key: 'V', desc: 'Vertical layout' },
    { key: 'G', desc: 'Grid layout' },
    { key: '+/-', desc: 'Adjust grid columns' },
    { key: 'L', desc: 'Toggle labels' },
    { key: 'B', desc: 'Toggle borders' },
    { key: 'A', desc: 'Auto-generate variants' },
    { key: 'Esc', desc: 'Exit compare mode' },
  ];

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'single',
      borderColor: themeColor('success'),
      padding: 1,
    },
    Box(
      { marginBottom: 1 },
      Text({ color: themeColor('success'), bold: true }, 'Compare View Shortcuts')
    ),
    ...shortcuts.map(({ key, desc }) =>
      Box(
        {},
        Text({ color: themeColor('primary') }, `[${key}]`.padEnd(8)),
        Text({ color: themeColor('mutedForeground') }, desc)
      )
    )
  );
}
