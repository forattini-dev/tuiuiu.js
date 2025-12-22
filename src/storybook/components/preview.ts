/**
 * Storybook Preview Component
 *
 * Renders the current story with various view modes:
 * - Preview: Simple story render
 * - Playground: Story with live prop editing
 * - Comparatives: Side-by-side variant comparison
 * - Docs: Story documentation and API reference
 */

import { Box, Text } from '../../primitives/nodes.js';
import { Divider } from '../../primitives/divider.js';
import type { VNode } from '../../utils/types.js';
import type { Story, ControlDefinition } from '../types.js';
import type { Navigator, ViewMode } from '../core/navigator.js';
import { themeColor } from '../../core/theme.js';

export interface PreviewProps {
  navigator: Navigator;
  controlValues: Record<string, any>;
  isFocused?: boolean;
}

/**
 * Render the story content
 */
function StoryContent(props: {
  story: Story;
  controlValues: Record<string, any>;
}): VNode {
  const { story, controlValues } = props;

  try {
    return story.render(controlValues);
  } catch (error: any) {
    return Box(
      {
        flexDirection: 'column',
        padding: 1,
        borderStyle: 'single',
        borderColor: themeColor('error'),
      },
      Text({ color: themeColor('error'), bold: true }, 'Render Error'),
      Text({ color: themeColor('error') }, error.message || String(error))
    );
  }
}

/**
 * Render story metadata header
 */
function StoryHeader(props: { story: Story }): VNode {
  const { story } = props;

  return Box(
    { flexDirection: 'column', marginBottom: 1 },
    Box(
      {},
      Text({ color: themeColor('mutedForeground') }, `${story.category} / `),
      Text({ color: themeColor('primary'), bold: true }, story.name)
    ),
    story.description &&
      Text({ color: themeColor('mutedForeground'), dim: true }, story.description)
  );
}

/**
 * Render controls info panel
 */
function ControlsInfo(props: {
  controls: Record<string, ControlDefinition>;
  values: Record<string, any>;
}): VNode {
  const { controls, values } = props;
  const entries = Object.entries(controls);

  if (entries.length === 0) {
    return Text({ color: themeColor('mutedForeground'), dim: true }, 'No controls defined');
  }

  return Box(
    { flexDirection: 'column' },
    Box(
      { marginBottom: 1 },
      Text({ color: themeColor('foreground'), bold: true }, 'Controls')
    ),
    ...entries.map(([key, control]) =>
      Box(
        {},
        Text({ color: themeColor('mutedForeground') }, `${control.label}: `),
        Text({ color: themeColor('primary') }, formatValue(values[key], control.type))
      )
    )
  );
}

/**
 * Format a control value for display
 */
function formatValue(value: any, type: string): string {
  if (value === undefined || value === null) return 'undefined';

  switch (type) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'color':
      return String(value);
    case 'text':
      return `"${value}"`;
    default:
      return String(value);
  }
}

/**
 * Render the preview panel in preview mode
 */
function PreviewMode(props: PreviewProps): VNode {
  const { navigator, controlValues, isFocused } = props;
  const story = navigator.currentStory();

  if (!story) {
    return Box(
      { padding: 2, flexDirection: 'column' },
      Text({ color: themeColor('mutedForeground'), dim: true }, 'No story selected'),
      Text({ color: themeColor('mutedForeground'), dim: true }, 'Select a story from the sidebar')
    );
  }

  return Box(
    { flexDirection: 'column', padding: 1 },
    // Header
    StoryHeader({ story }),
    Divider({}),
    // Story content
    Box(
      {
        marginTop: 1,
        padding: 1,
        borderStyle: 'round',
        borderColor: isFocused ? themeColor('primary') : themeColor('border'),
      },
      StoryContent({ story, controlValues })
    ),
    // Controls info
    Box({ marginTop: 1 }, ControlsInfo({ controls: story.controls || {}, values: controlValues }))
  );
}

/**
 * Render the preview panel in playground mode
 */
function PlaygroundMode(props: PreviewProps): VNode {
  const { navigator, controlValues, isFocused } = props;
  const story = navigator.currentStory();

  if (!story) {
    return Box(
      { padding: 2 },
      Text({ color: themeColor('mutedForeground'), dim: true }, 'No story selected')
    );
  }

  return Box(
    { flexDirection: 'column', padding: 1 },
    // Header
    Box(
      { marginBottom: 1 },
      Text({ color: themeColor('warning'), bold: true }, 'Playground: '),
      Text({ color: themeColor('foreground') }, story.name)
    ),
    // Two columns: preview and controls
    Box(
      { flexDirection: 'row', gap: 2 },
      // Preview
      Box(
        {
          flexGrow: 1,
          borderStyle: 'single',
          borderColor: isFocused ? themeColor('primary') : themeColor('border'),
          padding: 1,
        },
        StoryContent({ story, controlValues })
      )
    ),
    // Hint
    Box(
      { marginTop: 1 },
      Text({ color: themeColor('mutedForeground'), dim: true }, 'Tab to switch to controls panel')
    )
  );
}

/**
 * Render the preview panel in comparatives mode
 */
function ComparativesMode(props: PreviewProps): VNode {
  const { navigator, controlValues, isFocused } = props;
  const story = navigator.currentStory();

  if (!story) {
    return Box(
      { padding: 2 },
      Text({ color: themeColor('mutedForeground'), dim: true }, 'No story selected')
    );
  }

  // Generate variants based on control types
  const variants: Array<{ label: string; values: Record<string, any> }> = [];

  // Default variant
  variants.push({ label: 'Default', values: controlValues });

  // Generate variants for select controls
  for (const [key, control] of Object.entries(story.controls || {})) {
    if (control.type === 'select' && control.options) {
      for (const option of control.options.slice(0, 4)) {
        variants.push({
          label: `${control.label}: ${option}`,
          values: { ...controlValues, [key]: option },
        });
      }
    }
  }

  // Limit to 4 variants
  const displayVariants = variants.slice(0, 4);

  return Box(
    { flexDirection: 'column', padding: 1 },
    // Header
    Box(
      { marginBottom: 1 },
      Text({ color: themeColor('success'), bold: true }, 'Comparatives: '),
      Text({ color: themeColor('foreground') }, story.name)
    ),
    // Grid of variants
    Box(
      { flexDirection: 'column', gap: 1 },
      ...displayVariants.map((variant, idx) =>
        Box(
          {
            flexDirection: 'column',
            borderStyle: 'single',
            borderColor: themeColor('border'),
            padding: 1,
          },
          Box(
            { marginBottom: 1 },
            Text({ color: themeColor('primary'), bold: true }, variant.label)
          ),
          StoryContent({ story, controlValues: variant.values })
        )
      )
    ),
    // Hint
    Box(
      { marginTop: 1 },
      Text({ color: themeColor('mutedForeground'), dim: true }, `Showing ${displayVariants.length} variants`)
    )
  );
}

/**
 * Render the preview panel in docs mode
 */
function DocsMode(props: PreviewProps): VNode {
  const { navigator, controlValues, isFocused } = props;
  const story = navigator.currentStory();

  if (!story) {
    return Box(
      { padding: 2 },
      Text({ color: themeColor('mutedForeground'), dim: true }, 'No story selected')
    );
  }

  const controls = Object.entries(story.controls || {});

  return Box(
    { flexDirection: 'column', padding: 1 },
    // Header
    Box(
      { marginBottom: 1 },
      Text({ color: themeColor('accent'), bold: true }, 'Documentation: '),
      Text({ color: themeColor('foreground') }, story.name)
    ),
    Divider({}),
    // Description
    Box(
      { marginTop: 1, marginBottom: 1 },
      Text({ color: themeColor('foreground') }, story.description || 'No description provided.')
    ),
    // Category
    Box(
      {},
      Text({ color: themeColor('mutedForeground') }, 'Category: '),
      Text({ color: themeColor('primary') }, story.category)
    ),
    // Controls API
    controls.length > 0 &&
      Box(
        { flexDirection: 'column', marginTop: 1 },
        Box(
          { marginBottom: 1 },
          Text({ color: themeColor('foreground'), bold: true }, 'Props/Controls')
        ),
        ...controls.map(([key, control]) =>
          Box(
            { flexDirection: 'column', marginBottom: 1 },
            Box(
              {},
              Text({ color: themeColor('primary') }, key),
              Text({ color: themeColor('mutedForeground') }, `: ${control.type}`)
            ),
            Text({ color: themeColor('mutedForeground'), dim: true }, `  ${control.label}`),
            Text({ color: themeColor('mutedForeground'), dim: true }, `  Default: ${formatValue(control.defaultValue, control.type)}`)
          )
        )
      ),
    // Example preview
    Box(
      { marginTop: 1, flexDirection: 'column' },
      Box(
        { marginBottom: 1 },
        Text({ color: themeColor('foreground'), bold: true }, 'Preview')
      ),
      Box(
        {
          borderStyle: 'round',
          borderColor: themeColor('border'),
          padding: 1,
        },
        StoryContent({ story, controlValues })
      )
    )
  );
}

/**
 * Main Preview component
 */
export function Preview(props: PreviewProps): VNode {
  const { navigator, controlValues, isFocused = false } = props;
  const state = navigator.state();

  return Box(
    {
      flexDirection: 'column',
      flexGrow: 1,
      borderStyle: 'single',
      borderColor: isFocused ? themeColor('primary') : themeColor('border'),
    },
    // Mode indicator
    Box(
      {
        borderStyle: 'single',
        borderColor: isFocused ? themeColor('primary') : themeColor('border'),
        paddingX: 1,
      },
      Text({ color: themeColor('mutedForeground') }, 'Mode: '),
      Text({ color: getModeColor(state.viewMode), bold: true }, state.viewMode.toUpperCase())
    ),
    // Content based on mode
    Box(
      { flexGrow: 1 },
      renderMode(state.viewMode, props)
    )
  );
}

/**
 * Get color for view mode
 */
function getModeColor(mode: ViewMode): string {
  switch (mode) {
    case 'preview':
      return themeColor('primary');
    case 'playground':
      return themeColor('warning');
    case 'comparatives':
      return themeColor('success');
    case 'docs':
      return themeColor('accent');
    default:
      return themeColor('foreground');
  }
}

/**
 * Render content based on view mode
 */
function renderMode(mode: ViewMode, props: PreviewProps): VNode {
  switch (mode) {
    case 'preview':
      return PreviewMode(props);
    case 'playground':
      return PlaygroundMode(props);
    case 'comparatives':
      return ComparativesMode(props);
    case 'docs':
      return DocsMode(props);
    default:
      return PreviewMode(props);
  }
}

/**
 * Render mode switcher
 */
export function ModeSwitcher(props: {
  currentMode: ViewMode;
  isFocused?: boolean;
}): VNode {
  const { currentMode, isFocused } = props;
  const modes: Array<{ mode: ViewMode; key: string; label: string }> = [
    { mode: 'preview', key: 'p', label: 'Preview' },
    { mode: 'playground', key: 'g', label: 'Playground' },
    { mode: 'comparatives', key: 'c', label: 'Compare' },
    { mode: 'docs', key: 'd', label: 'Docs' },
  ];

  return Box(
    { gap: 2 },
    ...modes.map(({ mode, key, label }) =>
      Box(
        {},
        Text(
          {
            color: currentMode === mode ? getModeColor(mode) : themeColor('mutedForeground'),
            bold: currentMode === mode,
          },
          `[${key.toUpperCase()}] ${label}`
        )
      )
    )
  );
}
