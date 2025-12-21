/**
 * Storybook App - Interactive component catalog
 *
 * Refactored version using modular story imports.
 */

import { Box, Text, Divider } from '../components/components.js';
import { render } from '../app/render-loop.js';
import { useState, useInput, useApp, useEffect } from '../hooks/index.js';
import { createRef } from '../core/index.js';
import type { VNode } from '../utils/types.js';
import type { Story } from './types.js';
import { allStories } from './stories/index.js';
import { COLORS } from './data/ascii-art.js';

// =============================================================================
// Metrics Tracking
// =============================================================================

interface Metrics {
  clicks: number;
  keystrokes: number;
  fps: number;
  lastFrameTime: number;
  frameCount: number;
}

// View modes
type ViewMode = 'preview' | 'playground' | 'comparatives' | 'docs';

// Focus areas
type FocusArea = 'sidebar' | 'preview' | 'controls';

/**
 * Get unique categories from stories
 */
function getCategories(): string[] {
  const categories = new Set<string>();
  for (const story of allStories) {
    categories.add(story.category);
  }
  return Array.from(categories).sort();
}

/**
 * Get stories for a category
 */
function getStoriesByCategory(category: string): Story[] {
  return allStories.filter((s) => s.category === category);
}

/**
 * Render story content safely
 */
function StoryContent(props: { story: Story; values: Record<string, any>; frame?: number }): VNode {
  const { story, values, frame = 0 } = props;
  try {
    return story.render(values, frame);
  } catch (error: any) {
    return Box(
      { flexDirection: 'column', padding: 1, borderStyle: 'single', borderColor: 'red' },
      Text({ color: 'red', bold: true }, 'Render Error'),
      Text({ color: 'red' }, error.message || String(error))
    );
  }
}

/**
 * Sidebar component - category and story list with virtual scroll
 */
function Sidebar(props: {
  categories: string[];
  currentCategory: string;
  stories: Story[];
  selectedIndex: number;
  focusArea: FocusArea;
  onCategoryChange: (category: string) => void;
  onStorySelect: (index: number) => void;
}): VNode {
  const { categories, currentCategory, stories, selectedIndex, focusArea } = props;
  const isFocused = focusArea === 'sidebar';

  // Virtual scroll: show window around selected item
  const maxVisible = 20;
  const totalStories = stories.length;

  // Calculate visible window
  let startIdx = 0;
  let endIdx = Math.min(maxVisible, totalStories);

  if (totalStories > maxVisible) {
    // Keep selected item in the middle when possible
    const halfWindow = Math.floor(maxVisible / 2);
    startIdx = Math.max(0, selectedIndex - halfWindow);
    endIdx = Math.min(totalStories, startIdx + maxVisible);

    // Adjust if we hit the end
    if (endIdx === totalStories) {
      startIdx = Math.max(0, totalStories - maxVisible);
    }
  }

  const visibleStories = stories.slice(startIdx, endIdx);
  const hasMoreAbove = startIdx > 0;
  const hasMoreBelow = endIdx < totalStories;

  // Fixed structure to avoid height changes causing render glitches
  // Always show scroll indicators (empty if not needed) for consistent height
  const scrollUpText = hasMoreAbove ? `  ▲ ${startIdx} more` : '';
  const scrollDownText = hasMoreBelow ? `  ▼ ${totalStories - endIdx} more` : '';

  return Box(
    {
      flexDirection: 'column',
      width: 50,
      borderStyle: 'single',
      borderColor: isFocused ? 'cyan' : 'gray',
    },
    // Header
    Box(
      { borderStyle: 'single', borderColor: isFocused ? 'cyan' : 'gray', paddingX: 1 },
      Text({ color: 'cyan', bold: true }, 'Stories')
    ),
    // Categories (horizontal tabs)
    Box(
      { flexDirection: 'row', paddingX: 1, marginY: 1 },
      Text({ color: 'gray' }, '◀ ▶ '),
      ...categories.map((cat) => {
        const isActive = cat === currentCategory;
        const count = getStoriesByCategory(cat).length;
        const shortName = cat.slice(0, 4);
        return Text(
          {
            color: isActive ? 'cyan' : 'gray',
            bold: isActive,
            inverse: isActive,
          },
          isActive ? `[${shortName}:${count}]` : ` ${shortName}:${count} `
        );
      })
    ),
    Divider({ color: 'gray' }),
    // Scroll up indicator (always present, may be empty)
    Box(
      { paddingX: 1, height: 1 },
      Text({ color: 'cyan', dim: true }, scrollUpText)
    ),
    // Stories list (fixed height container)
    Box(
      { flexDirection: 'column', paddingX: 1, flexGrow: 1 },
      ...visibleStories.map((story, idx) => {
        const actualIdx = startIdx + idx;
        const isSelected = actualIdx === selectedIndex;
        return Text(
          {
            color: isSelected ? 'white' : 'gray',
            bold: isSelected,
            inverse: isSelected && isFocused,
          },
          isSelected ? ` ${story.name} ` : `  ${story.name}`
        );
      })
    ),
    // Scroll down indicator (always present, may be empty)
    Box(
      { paddingX: 1, height: 1 },
      Text({ color: 'cyan', dim: true }, scrollDownText)
    ),
    // Footer
    Box(
      { borderStyle: 'single', borderColor: 'gray', paddingX: 1 },
      Text({ color: 'gray', dim: true }, `${selectedIndex + 1}/${stories.length}`)
    )
  );
}

/**
 * Control Panel component - edit story props
 */
function ControlPanel(props: {
  story: Story;
  values: Record<string, any>;
  focusedControlIndex: number;
  focusArea: FocusArea;
  onValueChange: (key: string, value: any) => void;
}): VNode {
  const { story, values, focusedControlIndex, focusArea } = props;
  const isFocused = focusArea === 'controls';
  const controls = Object.entries(story.controls || {});

  if (controls.length === 0) {
    return Box(
      { padding: 1, borderStyle: 'single', borderColor: 'gray' },
      Text({ color: 'gray', dim: true }, 'No controls defined')
    );
  }

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'single',
      borderColor: isFocused ? 'cyan' : 'gray',
      width: 30,
    },
    Box(
      { borderStyle: 'single', borderColor: isFocused ? 'cyan' : 'gray', paddingX: 1 },
      Text({ color: 'yellow', bold: true }, 'Controls')
    ),
    Box(
      { flexDirection: 'column', padding: 1 },
      ...controls.map(([key, control], idx) => {
        const value = values[key] ?? control.defaultValue;
        const isActive = idx === focusedControlIndex && isFocused;

        return Box(
          { flexDirection: 'column', marginBottom: 1 },
          Box(
            {},
            Text({ color: isActive ? 'cyan' : 'gray' }, `${control.label}: `),
            renderControlValue(value, control.type, isActive)
          )
        );
      })
    )
  );
}

/**
 * Render control value display
 */
function renderControlValue(value: any, type: string, isActive: boolean): VNode {
  const color = isActive ? 'white' : 'gray';

  switch (type) {
    case 'boolean':
      return Text({ color: value ? 'green' : 'red' }, value ? 'true' : 'false');
    case 'number':
    case 'range':
      return Text({ color }, String(value));
    case 'color':
      return Text({ color: value as any, bold: isActive }, value);
    case 'select':
      return Text({ color }, String(value));
    case 'text':
      return Text({ color }, `"${value}"`);
    default:
      return Text({ color }, String(value));
  }
}

/**
 * Docs view - show story documentation
 */
function DocsView(props: { story: Story }): VNode {
  const { story } = props;
  const controls = Object.entries(story.controls || {});

  const children: VNode[] = [
    // Title
    Box({ marginBottom: 1 }, Text({ color: 'cyan', bold: true }, `📖 ${story.name}`)),
  ];

  // Description (optional)
  if (story.description) {
    children.push(Box({ marginBottom: 1 }, Text({ color: 'white' }, story.description)));
  }

  // Controls documentation (if any)
  if (controls.length > 0) {
    children.push(
      Box(
        { flexDirection: 'column', marginTop: 1 },
        Text({ color: 'yellow', bold: true }, 'Props:'),
        ...controls.map(([key, control]) =>
          Box(
            { marginLeft: 1 },
            Text({ color: 'cyan' }, `• ${key}`),
            Text({ color: 'gray' }, ` (${control.type})`),
            Text({ color: 'gray', dim: true }, ` - ${control.label}`)
          )
        )
      )
    );
  }

  // Category
  children.push(
    Box({ marginTop: 1 }, Text({ color: 'gray' }, 'Category: '), Text({ color: 'magenta' }, story.category))
  );

  return Box({ flexDirection: 'column', padding: 1 }, ...children);
}

/**
 * Compare view - show story variants side by side
 */
function CompareView(props: { story: Story; values: Record<string, any> }): VNode {
  const { story, values } = props;
  const controls = Object.entries(story.controls || {});

  // Find a control to compare (prefer select or boolean)
  const compareControl = controls.find(([, c]) => c.type === 'select' || c.type === 'boolean');

  if (!compareControl) {
    return Box(
      { padding: 1 },
      Text({ color: 'gray' }, 'No comparable props found for this story')
    );
  }

  const [key, control] = compareControl;
  const variants: any[] =
    control.type === 'select' ? (control.options || []) :
    control.type === 'boolean' ? [true, false] : [];

  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({ color: 'green', bold: true }, `🔀 Comparing: ${control.label}`),
    Divider({ color: 'gray' }),
    Box(
      { flexDirection: 'row', flexWrap: 'wrap', gap: 1 },
      ...variants.slice(0, 4).map((variant) =>
        Box(
          {
            flexDirection: 'column',
            borderStyle: 'single',
            borderColor: values[key] === variant ? 'cyan' : 'gray',
            padding: 1,
            minWidth: 20,
          },
          Text({ color: 'cyan', dim: true }, String(variant)),
          Box(
            { marginTop: 1 },
            StoryContent({ story, values: { ...values, [key]: variant }, frame: 0 })
          )
        )
      )
    )
  );
}

/**
 * Preview Panel component - render story with mode-specific content
 */
function PreviewPanel(props: {
  story: Story;
  values: Record<string, any>;
  viewMode: ViewMode;
  focusArea: FocusArea;
  frame: number;
  isPaused: boolean;
}): VNode {
  const { story, values, viewMode, focusArea, frame, isPaused } = props;
  const isFocused = focusArea === 'preview';
  const isAnimated = story.animation?.enabled;

  // Render mode-specific content
  const renderContent = () => {
    switch (viewMode) {
      case 'docs':
        return DocsView({ story });
      case 'comparatives':
        return CompareView({ story, values });
      case 'preview':
      case 'playground':
      default:
        return Box(
          { padding: 1, flexGrow: 1 },
          StoryContent({ story, values, frame })
        );
    }
  };

  // Build children array without false values
  const previewChildren: VNode[] = [];

  // Header with optional animation indicator
  const headerChildren: VNode[] = [
    Text({ color: 'gray' }, `${story.category} / `),
    Text({ color: 'cyan', bold: true }, story.name),
  ];
  if (isAnimated) {
    headerChildren.push(Text({ color: isPaused ? 'yellow' : 'green' }, isPaused ? ' ⏸' : ' ▶'));
  }
  previewChildren.push(
    Box(
      { borderStyle: 'single', borderColor: isFocused ? 'cyan' : 'gray', paddingX: 1 },
      ...headerChildren
    )
  );

  // View mode tabs (single Text element for stability)
  const modeText = isAnimated
    ? `[P][G][C][D] ${viewMode.toUpperCase()} Frame:${frame}`
    : `[P][G][C][D] ${viewMode.toUpperCase()}`;
  previewChildren.push(
    Box(
      { paddingX: 1 },
      Text({ color: getModeColor(viewMode) }, modeText)
    )
  );

  // Description (only in preview/playground mode)
  if ((viewMode === 'preview' || viewMode === 'playground') && story.description) {
    previewChildren.push(
      Box({ paddingX: 1 }, Text({ color: 'gray', dim: true }, story.description))
    );
  }

  previewChildren.push(Divider({ color: 'gray' }));
  previewChildren.push(renderContent());

  return Box(
    {
      flexDirection: 'column',
      flexGrow: 1,
      borderStyle: 'single',
      borderColor: isFocused ? 'cyan' : 'gray',
    },
    ...previewChildren
  );
}

/**
 * Get color for view mode
 */
function getModeColor(mode: ViewMode): string {
  switch (mode) {
    case 'preview': return 'cyan';
    case 'playground': return 'yellow';
    case 'comparatives': return 'green';
    case 'docs': return 'magenta';
    default: return 'white';
  }
}

/**
 * Status bar component
 */
function StatusBar(props: { viewMode: ViewMode; focusArea: FocusArea }): VNode {
  return Box(
    { borderStyle: 'single', borderColor: 'gray', paddingX: 1 },
    Text({ color: 'gray' }, '[Esc] Back/Quit  '),
    Text({ color: 'gray' }, '[Enter] Select  '),
    Text({ color: 'gray' }, '[Tab] Cycle Focus  '),
    Text({ color: 'gray' }, '[G] Playground')
  );
}

/**
 * Format elapsed time as MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Navbar component with metrics
 */
function Navbar(props: {
  componentCount: number;
  clicks: number;
  keystrokes: number;
  fps: number;
  elapsedSeconds: number;
}): VNode {
  const { componentCount, clicks, keystrokes, fps, elapsedSeconds } = props;

  // FPS color based on performance
  const fpsColor = fps >= 30 ? 'green' : fps >= 15 ? 'yellow' : 'red';

  return Box(
    {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderStyle: 'single',
      borderColor: 'magenta',
    },
    // Left side - Logo
    Text({ color: 'magenta', bold: true }, ' Tuiuiu.js '),
    // Right side - Metrics (compact)
    Box(
      { flexDirection: 'row' },
      Text({ color: 'white', bold: true }, formatTime(elapsedSeconds)),
      Text({ color: 'gray', dim: true }, ' '),
      Text({ color: 'cyan' }, String(componentCount)),
      Text({ color: 'gray', dim: true }, 's '),
      Text({ color: 'yellow' }, String(clicks)),
      Text({ color: 'gray', dim: true }, 'c '),
      Text({ color: 'green' }, String(keystrokes)),
      Text({ color: 'gray', dim: true }, 'k '),
      Text({ color: fpsColor, bold: true }, `${fps}fps `)
    )
  );
}

/**
 * Main Storybook App
 */
function StorybookApp(): VNode {
  const app = useApp();

  // State
  const categories = getCategories();
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [focusArea, setFocusArea] = useState<FocusArea>('sidebar');
  const [focusedControlIndex, setFocusedControlIndex] = useState(0);
  const [controlValues, setControlValues] = useState<Record<string, Record<string, any>>>({});

  // Animation state
  const [animationFrame, setAnimationFrame] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Metrics state
  const [clickCount, setClickCount] = useState(0);
  const [keystrokeCount, setKeystrokeCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Refs for perf tracking
  const frameCountRef = createRef(0);
  const lastFpsTimeRef = createRef(Date.now());

  // Timer effect - increment seconds and calc FPS
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);

      // Calculate FPS based on frames counted since last check
      const now = Date.now();
      const elapsed = now - lastFpsTimeRef.current;
      if (elapsed >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / elapsed));
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }
    }, 1000);

    return () => clearInterval(timer);
  });

  // Track renders
  frameCountRef.current++;

  // Derived state
  const currentCategory = categories[currentCategoryIndex()] || 'Primitives';
  const stories = getStoriesByCategory(currentCategory);
  const currentStory = stories[selectedStoryIndex()] || stories[0];
  const storyValues = currentStory ? (controlValues()[currentStory.name] || {}) : {};

  // Initialize control values from defaults
  const getStoryValues = () => {
    if (!currentStory) return {};
    const stored = controlValues()[currentStory.name];
    if (stored) return stored;

    // Initialize from defaults
    const defaults: Record<string, any> = {};
    for (const [key, control] of Object.entries(currentStory.controls || {})) {
      defaults[key] = control.defaultValue;
    }
    return defaults;
  };

  const values = getStoryValues();

  // Animation timer effect
  useEffect(() => {
    // Re-derive story inside effect to ensure reactivity to selection changes
    const cat = categories[currentCategoryIndex()] || 'Primitives';
    const catStories = getStoriesByCategory(cat);
    const activeStory = catStories[selectedStoryIndex()] || catStories[0];
    const paused = isPaused();

    if (!activeStory?.animation?.enabled || paused) {
      return;
    }

    const interval = activeStory.animation.interval ?? 100;
    const timer = setInterval(() => {
      setAnimationFrame((f) => f + 1);
    }, interval);

    return () => clearInterval(timer);
  });

  // Update control value
  const setControlValue = (key: string, value: any) => {
    if (!currentStory) return;
    setControlValues((cv) => ({
      ...cv,
      [currentStory.name]: {
        ...(cv[currentStory.name] || {}),
        [key]: value,
      },
    }));
  };

  // Control keys for navigation
  const controlKeys = currentStory ? Object.keys(currentStory.controls || {}) : [];

  // Input handling
  useInput((input, key) => {
    // Track keystroke
    setKeystrokeCount((c) => c + 1);

    // Global shortcuts
    // ESC Logic: Go back to sidebar or exit
    if (key.escape) {
      if (focusArea() !== 'sidebar') {
        setFocusArea('sidebar');
      } else {
        app.exit();
      }
      return;
    }

    if (input === 'q') {
      app.exit();
      return;
    }

    // View mode shortcuts
    if (input === 'p') { setViewMode('preview'); setClickCount((c) => c + 1); return; }
    if (input === 'g') { setViewMode('playground'); setFocusArea('controls'); setClickCount((c) => c + 1); return; }
    if (input === 'c') { setViewMode('comparatives'); setClickCount((c) => c + 1); return; }
    if (input === 'd') { setViewMode('docs'); setClickCount((c) => c + 1); return; }

    // Enter counts as a click/action
    if (key.return) {
      setClickCount((c) => c + 1);
      
      // Enter on Sidebar -> Enter Playground/Preview
      if (focusArea() === 'sidebar') {
        const hasControls = Object.keys(currentStory?.controls || {}).length > 0;
        if (hasControls) {
          setViewMode('playground');
          setFocusArea('controls');
        } else {
          setViewMode('preview');
          setFocusArea('preview');
        }
        return;
      }
    }

    // Tab cycles focus
    if (key.tab) {
      setFocusArea((f) => {
        if (f === 'sidebar') return 'preview';
        if (f === 'preview') return viewMode() === 'playground' ? 'controls' : 'sidebar';
        return 'sidebar';
      });
      return;
    }

    // Navigation based on focus area
    if (focusArea() === 'sidebar') {
      if (key.upArrow) {
        setSelectedStoryIndex((i) => Math.max(0, i - 1));
      }
      if (key.downArrow) {
        setSelectedStoryIndex((i) => Math.min(stories.length - 1, i + 1));
      }
      if (key.leftArrow) {
        setCurrentCategoryIndex((i) => Math.max(0, i - 1));
        setSelectedStoryIndex(0);
      }
      if (key.rightArrow) {
        setCurrentCategoryIndex((i) => Math.min(categories.length - 1, i + 1));
        setSelectedStoryIndex(0);
      }
    }

    if (focusArea() === 'controls' && viewMode() === 'playground') {
      if (key.upArrow) {
        setFocusedControlIndex((i) => Math.max(0, i - 1));
      }
      if (key.downArrow) {
        setFocusedControlIndex((i) => Math.min(controlKeys.length - 1, i + 1));
      }

      // Edit current control
      const currentKey = controlKeys[focusedControlIndex()];
      const currentControl = currentKey ? currentStory?.controls?.[currentKey] : null;

      if (currentControl && currentKey) {
        const currentValue = values[currentKey] ?? currentControl.defaultValue;

        if (key.leftArrow || key.rightArrow) {
          const delta = key.rightArrow ? 1 : -1;

          switch (currentControl.type) {
            case 'boolean':
              setControlValue(currentKey, !currentValue);
              break;
            case 'number':
            case 'range':
              const step = currentControl.step || 1;
              const min = currentControl.min ?? -Infinity;
              const max = currentControl.max ?? Infinity;
              setControlValue(currentKey, Math.max(min, Math.min(max, currentValue + delta * step)));
              break;
            case 'select':
              if (currentControl.options) {
                const idx = currentControl.options.indexOf(currentValue);
                const newIdx = (idx + delta + currentControl.options.length) % currentControl.options.length;
                setControlValue(currentKey, currentControl.options[newIdx]);
              }
              break;
            case 'color':
              const colorIdx = COLORS.indexOf(currentValue);
              const newColorIdx = (colorIdx + delta + COLORS.length) % COLORS.length;
              setControlValue(currentKey, COLORS[newColorIdx]);
              break;
          }
        }

        // Space toggles boolean
        if (input === ' ' && currentControl.type === 'boolean') {
          setControlValue(currentKey, !currentValue);
        }
      }
    }

    // Space pauses/resumes animation (when not editing controls)
    if (input === ' ' && focusArea() !== 'controls') {
      if (currentStory?.animation?.enabled && currentStory?.animation?.pausable) {
        setIsPaused((p) => !p);
      }
    }
  });

  // No stories case
  if (!currentStory) {
    return Box(
      { flexDirection: 'column', padding: 2 },
      Text({ color: 'yellow' }, 'No stories found'),
      Text({ color: 'gray' }, 'Add stories to src/storybook/stories/')
    );
  }

  return Box(
    { flexDirection: 'column', height: '100%' },
    // Navbar with metrics
    Navbar({
      componentCount: allStories.length,
      clicks: clickCount(),
      keystrokes: keystrokeCount(),
      fps: fps(),
      elapsedSeconds: elapsedSeconds(),
    }),
    // Main content
    Box(
      { flexDirection: 'row', flexGrow: 1 },
      // Sidebar
      Sidebar({
        categories,
        currentCategory,
        stories,
        selectedIndex: selectedStoryIndex(),
        focusArea: focusArea(),
        onCategoryChange: () => {},
        onStorySelect: setSelectedStoryIndex,
      }),
      // Preview
      PreviewPanel({
        story: currentStory,
        values,
        viewMode: viewMode(),
        focusArea: focusArea(),
        frame: animationFrame(),
        isPaused: isPaused(),
      }),
      // Controls (in playground mode)
      viewMode() === 'playground' &&
        ControlPanel({
          story: currentStory,
          values,
          focusedControlIndex: focusedControlIndex(),
          focusArea: focusArea(),
          onValueChange: setControlValue,
        })
    ),
    // Status bar
    StatusBar({ viewMode: viewMode(), focusArea: focusArea() })
  );
}

/**
 * Run the storybook
 */
export async function runStorybook(): Promise<void> {
  const { waitUntilExit } = render(() => StorybookApp());
  await waitUntilExit();
}

export { StorybookApp };
