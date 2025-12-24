/**
 * Storybook App - Interactive component catalog
 *
 * Refactored version using modular story imports and reactive global store.
 */

import { Box, Text } from '../primitives/nodes.js';
import { Divider } from '../primitives/divider.js';
import { render } from '../app/render-loop.js';
import { useState, useInput, useApp, useEffect, useMouse, useFps } from '../hooks/index.js';
import { startTick, stopTick, getTick, isTickRunning, setTickRate } from '../core/tick.js';
import { setTheme, useTheme, getNextTheme, getTheme } from '../core/theme.js';
import type { VNode } from '../utils/types.js';
import type { Story } from './types.js';
import { allStories } from './stories/index.js';
import { COLORS, TUIUIU_BIRD_COLORED } from './data/ascii-art.js';
import { ImpactSplashScreen, createSplashScreen } from '../design-system/visual/splash-screen.js';
import { createTextInput, renderTextInput } from '../atoms/text-input.js';

// Version
import { getVersion, getVersionSync } from '../version.js';

// Storybook Global State & Logger
import { storybookStore, interceptConsole } from './store.js';

// Storybook UI Components
import {
  Navbar,
  MetricsStatusBar,
  SearchBar,
  searchStories,
  ConsoleAccordion,
  HotkeysPanel,
  PressedKeysIndicator,
  recordKeyPress,
  clearOldKeyPresses,
} from './components/index.js';

// =============================================================================
// Initialization
// =============================================================================

// Patch console immediately to capture logs
interceptConsole();

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
  const theme = getTheme();
  const { story, values, frame = 0 } = props;
  try {
    return story.render(values, frame);
  } catch (error: any) {
    console.error('Render error:', error); // Captured by our interceptor!
    return Box(
      { flexDirection: 'column', padding: 1, borderStyle: 'single', borderColor: theme.accents.critical },
      Text({ color: theme.accents.critical, bold: true }, 'Render Error'),
      Text({ color: theme.accents.critical }, error.message || String(error))
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
  onCategoryClick?: (index: number) => void;
  onFocus?: () => void;
}): VNode {
  const theme = getTheme();
  const { categories, currentCategory, stories, selectedIndex, focusArea, onCategoryClick, onFocus } = props;
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

  const scrollUpText = hasMoreAbove ? `  ▲ ${startIdx} more` : '';
  const scrollDownText = hasMoreBelow ? `  ▼ ${totalStories - endIdx} more` : '';

  return Box(
    {
      flexDirection: 'column',
      width: 50,
      borderStyle: 'single',
      borderColor: isFocused ? theme.palette.primary[500] : theme.borders.default,
    },
    // Header
    Box(
      { borderStyle: 'single', borderColor: isFocused ? theme.palette.primary[500] : theme.borders.default, paddingX: 1 },
      Text({ color: theme.palette.primary[500], bold: true }, 'Stories')
    ),
    // Categories (horizontal tabs) - clickable
    Box(
      { flexDirection: 'row', paddingX: 1, marginY: 1 },
      Text({ color: theme.foreground.muted }, '◀ ▶ '),
      ...categories.map((cat, catIdx) => {
        const isActive = cat === currentCategory;
        const count = getStoriesByCategory(cat).length;
        const shortName = cat.slice(0, 4);
        return Box(
          {
            onClick: () => {
              onFocus?.();
              onCategoryClick?.(catIdx);
            },
          },
          Text(
            {
              color: isActive ? theme.palette.primary[500] : theme.foreground.muted,
              bold: isActive,
              inverse: isActive,
            },
            isActive ? `[${shortName}:${count}]` : ` ${shortName}:${count} `
          )
        );
      })
    ),
    Divider({ color: theme.borders.default }),
    // Scroll up indicator (always present, may be empty)
    Box(
      { paddingX: 1, height: 1 },
      Text({ color: theme.palette.primary[500], dim: true }, scrollUpText)
    ),
    // Stories list (fixed height container) - clickable items
    Box(
      { flexDirection: 'column', paddingX: 1, flexGrow: 1 },
      ...visibleStories.map((story, idx) => {
        const actualIdx = startIdx + idx;
        const isSelected = actualIdx === selectedIndex;
        return Box(
          {
            onClick: () => {
              onFocus?.();
              props.onStorySelect(actualIdx);
            },
          },
          Text(
            {
              color: isSelected ? theme.foreground.primary : theme.foreground.muted,
              bold: isSelected,
              inverse: isSelected && isFocused,
            },
            isSelected ? ` ${story.name} ` : `  ${story.name}`
          )
        );
      })
    ),
    // Scroll down indicator (always present, may be empty)
    Box(
      { paddingX: 1, height: 1 },
      Text({ color: theme.palette.primary[500], dim: true }, scrollDownText)
    ),
    // Footer
    Box(
      { borderStyle: 'single', borderColor: theme.borders.default, paddingX: 1 },
      Text({ color: theme.foreground.muted, dim: true }, `${selectedIndex + 1}/${stories.length}`)
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
  isEditingText: boolean;
  editingTextValue: string;
  onTextChange: (value: string) => void;
  onFocus?: () => void;
  onSelectControl?: (idx: number) => void;
  onStartTextEdit?: (key: string, value: string) => void;
}): VNode {
  const theme = getTheme();
  const { story, values, focusedControlIndex, focusArea, isEditingText, editingTextValue, onTextChange, onFocus, onSelectControl, onStartTextEdit } = props;
  const isFocused = focusArea === 'controls';
  const controls = Object.entries(story.controls || {});

  if (controls.length === 0) {
    return Box(
      { padding: 1, borderStyle: 'single', borderColor: theme.borders.default },
      Text({ color: theme.foreground.muted, dim: true }, 'No controls defined')
    );
  }

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'single',
      borderColor: isFocused ? theme.palette.primary[500] : theme.borders.default,
      width: 30,
    },
    Box(
      { borderStyle: 'single', borderColor: isFocused ? theme.palette.primary[500] : theme.borders.default, paddingX: 1 },
      Text({ color: theme.accents.warning, bold: true }, 'Controls')
    ),
    Box(
      { flexDirection: 'column', padding: 1 },
      ...controls.map(([key, control], idx) => {
        const value = values[key] ?? control.defaultValue;
        const isActive = idx === focusedControlIndex && isFocused;
        const isThisEditingText = isActive && isEditingText && control.type === 'text';

        // Click handler for control interaction
        const handleClick = () => {
          onFocus?.();
          onSelectControl?.(idx);

          // Direct interaction based on control type
          if (control.type === 'boolean') {
            props.onValueChange(key, !value);
          } else if (control.type === 'text') {
            onStartTextEdit?.(key, value);
          }
        };

        return Box(
          {
            flexDirection: 'column',
            marginBottom: 1,
            onClick: handleClick,
          },
          Box(
            {},
            Text({ color: isActive ? theme.palette.primary[500] : theme.foreground.muted }, `${control.label}: `),
            isThisEditingText
              ? renderTextInputInline(editingTextValue, isActive, onTextChange)
              : renderControlValue(value, control.type, isActive)
          )
        );
      })
    )
  );
}

/**
 * Render inline text input for editing
 */
function renderTextInputInline(value: string, isActive: boolean, onChange: (value: string) => void): VNode {
  const theme = getTheme();
  // Create inline text input with visible cursor
  const cursorChar = '▎';
  return Box(
    { flexDirection: 'row' },
    Text({ color: theme.foreground.primary }, '"'),
    Text({ color: theme.palette.primary[500] }, value),
    isActive ? Text({ color: theme.palette.primary[500], bold: true }, cursorChar) : null,
    Text({ color: theme.foreground.primary }, '"')
  );
}

/**
 * Render control value display
 */
function renderControlValue(value: any, type: string, isActive: boolean): VNode {
  const theme = getTheme();
  const color = isActive ? theme.foreground.primary : theme.foreground.muted;

  switch (type) {
    case 'boolean':
      return Text({ color: value ? theme.accents.positive : theme.accents.critical }, value ? 'true' : 'false');
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
  const theme = getTheme();
  const { story } = props;
  const controls = Object.entries(story.controls || {});

  const children: VNode[] = [
    // Title
    Box({ marginBottom: 1 }, Text({ color: theme.palette.primary[500], bold: true }, `📖 ${story.name}`)),
  ];

  // Description (optional)
  if (story.description) {
    children.push(Box({ marginBottom: 1 }, Text({ color: theme.foreground.primary }, story.description)));
  }

  // Controls documentation (if any)
  if (controls.length > 0) {
    children.push(
      Box(
        { flexDirection: 'column', marginTop: 1 },
        Text({ color: theme.accents.warning, bold: true }, 'Props:'),
        ...controls.map(([key, control]) =>
          Box(
            { marginLeft: 1 },
            Text({ color: theme.palette.primary[500] }, `• ${key}`),
            Text({ color: theme.foreground.muted }, ` (${control.type})`),
            Text({ color: theme.foreground.muted, dim: true }, ` - ${control.label}`)
          )
        )
      )
    );
  }

  // Category
  children.push(
    Box({ marginTop: 1 }, Text({ color: theme.foreground.muted }, 'Category: '), Text({ color: theme.accents.highlight }, story.category))
  );

  return Box({ flexDirection: 'column', padding: 1 }, ...children);
}

/**
 * Compare view - show story variants side by side
 */
function CompareView(props: { story: Story; values: Record<string, any> }): VNode {
  const theme = getTheme();
  const { story, values } = props;
  const controls = Object.entries(story.controls || {});

  // Find a control to compare (prefer select or boolean)
  const compareControl = controls.find(([, c]) => c.type === 'select' || c.type === 'boolean');

  if (!compareControl) {
    return Box(
      { padding: 1 },
      Text({ color: theme.foreground.muted }, 'No comparable props found for this story')
    );
  }

  const [key, control] = compareControl;
  const variants: any[] =
    control.type === 'select' ? (control.options || []) :
    control.type === 'boolean' ? [true, false] : [];

  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({ color: theme.accents.positive, bold: true }, `🔀 Comparing: ${control.label}`),
    Divider({ color: theme.borders.default }),
    Box(
      { flexDirection: 'row', flexWrap: 'wrap', gap: 1 },
      ...variants.slice(0, 4).map((variant) =>
        Box(
          {
            flexDirection: 'column',
            borderStyle: 'single',
            borderColor: values[key] === variant ? theme.palette.primary[500] : theme.borders.default,
            padding: 1,
            minWidth: 20,
          },
          Text({ color: theme.palette.primary[500], dim: true }, String(variant)),
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
  const theme = getTheme();
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
    Text({ color: theme.foreground.muted }, `${story.category} / `),
    Text({ color: theme.palette.primary[500], bold: true }, story.name),
  ];
  if (isAnimated) {
    headerChildren.push(Text({ color: isPaused ? theme.accents.warning : theme.accents.positive }, isPaused ? ' ⏸' : ' ▶'));
  }
  previewChildren.push(
    Box(
      { borderStyle: 'single', borderColor: isFocused ? theme.palette.primary[500] : theme.borders.default, paddingX: 1 },
      ...headerChildren
    )
  );

  // View mode tabs
  const modeText = isAnimated
    ? `[P][G][C][D] ${viewMode.toUpperCase()} Frame:${frame}`
    : `[P][G][C][D] ${viewMode.toUpperCase()}`;
  previewChildren.push(
    Box(
      { paddingX: 1 },
      Text({ color: getModeColor(viewMode) }, modeText)
    )
  );

  if ((viewMode === 'preview' || viewMode === 'playground') && story.description) {
    previewChildren.push(
      Box({ paddingX: 1 }, Text({ color: theme.foreground.muted, dim: true }, story.description))
    );
  }

  previewChildren.push(Divider({ color: theme.borders.default }));
  previewChildren.push(renderContent());

  return Box(
    {
      flexDirection: 'column',
      flexGrow: 1,
      borderStyle: 'single',
      borderColor: isFocused ? theme.palette.primary[500] : theme.borders.default,
    },
    ...previewChildren
  );
}

/**
 * Get color for view mode
 */
function getModeColor(mode: ViewMode): string {
  const theme = getTheme();
  switch (mode) {
    case 'preview': return theme.palette.primary[500];
    case 'playground': return theme.accents.warning;
    case 'comparatives': return theme.accents.positive;
    case 'docs': return theme.accents.highlight;
    default: return theme.foreground.primary;
  }
}

/**
 * Text editing mode indicator
 */
function TextEditingIndicator(): VNode {
  const theme = getTheme();

  return Box(
    { borderStyle: 'single', borderColor: theme.accents.warning, paddingX: 1 },
    Text({ color: theme.accents.warning, bold: true }, '✏️  EDITING TEXT  '),
    Text({ color: theme.foreground.muted }, '[Enter] Save  '),
    Text({ color: theme.foreground.muted }, '[Esc] Cancel  '),
    Text({ color: theme.foreground.muted }, '[Backspace] Delete')
  );
}

/**
 * Format elapsed time
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}


// =============================================================================
// Splash Screen
// =============================================================================

// Module-level splash state (created once when storybook starts)
let splashState: ReturnType<typeof createSplashScreen> | null = null;
// Module-level flag for splash completion
let splashCompleted = false;
let splashCompletionCallbacks: (() => void)[] = [];

function getSplashState(): ReturnType<typeof createSplashScreen> {
  if (!splashState) {
    splashState = createSplashScreen({
      duration: 1500,
      fadeInDuration: 300,
      onComplete: () => {
        splashCompleted = true;
        // Notify all callbacks
        for (const cb of splashCompletionCallbacks) {
          cb();
        }
        splashCompletionCallbacks = [];
      },
    });
  }
  return splashState;
}

function onSplashComplete(callback: () => void): void {
  if (splashCompleted) {
    callback();
  } else {
    splashCompletionCallbacks.push(callback);
  }
}

/**
 * Main Storybook App
 */
function StorybookApp(): VNode {
  const theme = getTheme();
  const app = useApp();

  // Get or create splash state
  const splash = getSplashState();

  // =========================================================================
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // This ensures consistent hook ordering across renders
  // =========================================================================

  // State - always call these regardless of splash visibility
  const categories = getCategories();
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [focusArea, setFocusArea] = useState<FocusArea>('sidebar');
  const [focusedControlIndex, setFocusedControlIndex] = useState(0);
  const [controlValues, setControlValues] = useState<Record<string, Record<string, any>>>({});

  // Text editing state
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingTextValue, setEditingTextValue] = useState('');

  // Animation state - now uses global tick
  const [isPaused, setIsPaused] = useState(false);

  // Track if we've already cleared screen after splash
  const [splashDone, setSplashDone] = useState(false);

  // Get animation frame from global tick
  const animationFrame = () => getTick();

  // Metrics state
  const [clickCount, setClickCount] = useState(0);
  const [keystrokeCount, setKeystrokeCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // FPS tracking using native hook
  const { fps } = useFps();

  // Timer effect for elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  });

  // Derived state
  const currentCategory = categories[currentCategoryIndex()] || 'Primitives';
  const stories = getStoriesByCategory(currentCategory);
  const currentStory = stories[selectedStoryIndex()] || stories[0];
  
  // Initialize control values from defaults
  const getStoryValues = () => {
    if (!currentStory) return {};
    const stored = controlValues()[currentStory.name];
    if (stored) return stored;
    const defaults: Record<string, any> = {};
    for (const [key, control] of Object.entries(currentStory.controls || {})) {
      defaults[key] = control.defaultValue;
    }
    return defaults;
  };

  const values = getStoryValues();

  // Global tick control for animations
  useEffect(() => {
    const cat = categories[currentCategoryIndex()] || 'Primitives';
    const catStories = getStoriesByCategory(cat);
    const activeStory = catStories[selectedStoryIndex()] || catStories[0];
    const paused = isPaused();

    // Stop tick if paused
    if (paused && isTickRunning()) {
      stopTick();
      return;
    }

    // Start tick if not paused and story has animation
    if (!paused && activeStory?.animation?.enabled) {
      const interval = activeStory.animation.interval ?? 100;
      setTickRate(interval);
      if (!isTickRunning()) {
        startTick(interval);
      }
    }
  });

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

  const controlKeys = currentStory ? Object.keys(currentStory.controls || {}) : [];

  // Search state from store
  const [searchSelectedIndex, setSearchSelectedIndex] = useState(0);

  // Get search results
  const storeState = storybookStore.state();
  const searchResults = storeState.searchVisible
    ? searchStories(allStories, storeState.searchQuery)
    : [];

  // Input handling
  useInput((input, key) => {
    setKeystrokeCount((c) => c + 1);
    // Record key press for indicator
    recordKeyPress(input, key);
    clearOldKeyPresses();

    // Toggle Search with F1
    if (key.f1) {
      storybookStore.dispatch({ type: 'TOGGLE_SEARCH' });
      setSearchSelectedIndex(0);
      return;
    }

    // Toggle Theme with F2
    if (key.f2) {
      const currentTheme = useTheme();
      const nextTheme = getNextTheme(currentTheme);
      setTheme(nextTheme);
      return;
    }

    // Toggle Console Logs
    if (key.f12 || (key.ctrl && input === 'l')) {
      storybookStore.dispatch({ type: 'TOGGLE_LOG' });
      return;
    }
    // Clear logs
    if (input === 'C') { // Shift+c
      storybookStore.dispatch({ type: 'CLEAR_LOGS' });
    }

    // =========================================================================
    // SEARCH MODE
    // =========================================================================
    if (storeState.searchVisible) {
      // Escape - close search
      if (key.escape) {
        storybookStore.dispatch({ type: 'CLOSE_SEARCH' });
        return;
      }

      // Navigate results
      if (key.upArrow) {
        setSearchSelectedIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (key.downArrow) {
        setSearchSelectedIndex((i) => Math.min(searchResults.length - 1, i + 1));
        return;
      }

      // Select result and navigate
      if (key.return && searchResults.length > 0) {
        const selected = searchResults[searchSelectedIndex()];
        if (selected) {
          // Find category and story indices
          const catIndex = categories.indexOf(selected.story.category);
          const catStories = getStoriesByCategory(selected.story.category);
          const storyIndex = catStories.findIndex((s) => s.name === selected.story.name);

          if (catIndex >= 0) setCurrentCategoryIndex(catIndex);
          if (storyIndex >= 0) setSelectedStoryIndex(storyIndex);

          storybookStore.dispatch({ type: 'CLOSE_SEARCH' });
        }
        return;
      }

      // Backspace - delete character from query
      if (key.backspace) {
        const current = storeState.searchQuery;
        storybookStore.dispatch({ type: 'SET_SEARCH_QUERY', payload: current.slice(0, -1) });
        setSearchSelectedIndex(0);
        return;
      }

      // Regular character input - append to search query
      if (input && input.length > 0 && !key.ctrl && !key.meta) {
        storybookStore.dispatch({ type: 'SET_SEARCH_QUERY', payload: storeState.searchQuery + input });
        setSearchSelectedIndex(0);
        return;
      }

      // Consume all other keys while searching
      return;
    }

    // =========================================================================
    // TEXT EDITING MODE
    // =========================================================================
    if (isEditingText()) {
      // Escape - cancel editing
      if (key.escape) {
        setIsEditingText(false);
        setEditingTextValue('');
        return;
      }

      // Enter - save and exit editing
      if (key.return) {
        const currentKey = controlKeys[focusedControlIndex()];
        if (currentKey) {
          setControlValue(currentKey, editingTextValue());
        }
        setIsEditingText(false);
        setEditingTextValue('');
        return;
      }

      // Backspace - delete character
      if (key.backspace) {
        setEditingTextValue((v) => v.slice(0, -1));
        return;
      }

      // Regular character input - append to value
      if (input && input.length > 0 && !key.ctrl && !key.meta) {
        setEditingTextValue((v) => v + input);
        return;
      }

      // Consume all other keys while editing
      return;
    }

    // =========================================================================
    // NORMAL MODE
    // =========================================================================

    // Global shortcuts
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

    if (input === 'p') { setViewMode('preview'); setClickCount((c) => c + 1); return; }
    if (input === 'g') { setViewMode('playground'); setFocusArea('controls'); setClickCount((c) => c + 1); return; }
    if (input === 'c') { setViewMode('comparatives'); setClickCount((c) => c + 1); return; }
    if (input === 'd') { setViewMode('docs'); setClickCount((c) => c + 1); return; }

    if (key.return) {
      setClickCount((c) => c + 1);
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

      // Enter on a text control - start editing
      if (focusArea() === 'controls' && viewMode() === 'playground') {
        const currentKey = controlKeys[focusedControlIndex()];
        const currentControl = currentKey ? currentStory?.controls?.[currentKey] : null;
        if (currentControl?.type === 'text') {
          const currentValue = values[currentKey] ?? currentControl.defaultValue;
          setEditingTextValue(currentValue);
          setIsEditingText(true);
          return;
        }
      }
    }

    if (key.tab) {
      setFocusArea((f) => {
        if (f === 'sidebar') return 'preview';
        if (f === 'preview') return viewMode() === 'playground' ? 'controls' : 'sidebar';
        return 'sidebar';
      });
      return;
    }

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

        if (input === ' ' && currentControl.type === 'boolean') {
          setControlValue(currentKey, !currentValue);
        }
      }
    }

    if (input === ' ' && focusArea() !== 'controls') {
      if (currentStory?.animation?.enabled && currentStory?.animation?.pausable) {
        setIsPaused((p) => !p);
      }
    }
  });

  // =========================================================================
  // SPLASH→MAIN TRANSITION
  // Use callback-based approach to ensure state update triggers re-render
  // =========================================================================

  // Register callback to update state when splash completes
  useEffect(() => {
    if (!splashDone()) {
      onSplashComplete(() => {
        app.clearScreen?.();
        setSplashDone(true);
      });
    }
  });

  // Render splash while not done (use module-level flag + state for reactivity)
  if (!splashDone() && !splashCompleted) {
    const splashNode = ImpactSplashScreen({
      birdArt: TUIUIU_BIRD_COLORED,
      showLogo: true,
      logoColor: '#8ba622', // Verde-amarelado do passarinho
      color: '#8ba622',
      subtitle: 'Component Explorer',
      version: getVersionSync(),
      loadingType: 'spinner',
      spinnerStyle: 'dots',
      loadingMessage: 'Loading stories...',
      state: splash,
    });
    return splashNode ?? Box({});
  }

  // Wait for state to update
  if (!splashDone()) {
    return Box({});
  }

  if (!currentStory) {
    return Box(
      { flexDirection: 'column', padding: 2 },
      Text({ color: theme.accents.warning }, 'No stories found'),
      Text({ color: theme.foreground.muted }, 'Add stories to src/storybook/stories/')
    );
  }

  return Box(
    { flexDirection: 'column', height: '100%' },

    // =========================================================================
    // HEADER SECTION
    // =========================================================================

    // Enhanced Navbar with branding
    Navbar({ componentCount: allStories.length }),

    // StatusBar with metrics
    MetricsStatusBar({
      themeName: useTheme().name,
      clicks: clickCount(),
      keystrokes: keystrokeCount(),
      fps,
      elapsedSeconds: elapsedSeconds(),
    }),

    // Search bar (conditional)
    SearchBar({
      query: storeState.searchQuery,
      results: searchResults,
      selectedIndex: searchSelectedIndex(),
      isVisible: storeState.searchVisible,
    }),

    // Text editing indicator (when editing)
    isEditingText() ? TextEditingIndicator() : null,

    // =========================================================================
    // MAIN CONTENT
    // =========================================================================

    Box(
      { flexDirection: 'row', flexGrow: 1 },
      Sidebar({
        categories,
        currentCategory,
        stories,
        selectedIndex: selectedStoryIndex(),
        focusArea: focusArea(),
        onCategoryChange: () => {},
        onStorySelect: setSelectedStoryIndex,
        onCategoryClick: (idx) => {
          setCurrentCategoryIndex(idx);
          setSelectedStoryIndex(0);
        },
        onFocus: () => setFocusArea('sidebar'),
      }),
      PreviewPanel({
        story: currentStory,
        values,
        viewMode: viewMode(),
        focusArea: focusArea(),
        frame: animationFrame(),
        isPaused: isPaused(),
      }),
      viewMode() === 'playground' &&
        ControlPanel({
          story: currentStory,
          values,
          focusedControlIndex: focusedControlIndex(),
          focusArea: focusArea(),
          onValueChange: setControlValue,
          isEditingText: isEditingText(),
          editingTextValue: editingTextValue(),
          onTextChange: setEditingTextValue,
          onFocus: () => setFocusArea('controls'),
          onSelectControl: setFocusedControlIndex,
          onStartTextEdit: (key, value) => {
            setEditingTextValue(value);
            setIsEditingText(true);
          },
        }),
    ),

    // =========================================================================
    // FOOTER SECTION (Console > Hotkeys > Pressed Keys)
    // =========================================================================

    // Console accordion
    ConsoleAccordion(),

    // Hotkeys panel
    HotkeysPanel(),

    // Pressed keys indicator
    PressedKeysIndicator(),
  );
}

/**
 * Run the storybook
 */
export async function runStorybook(): Promise<void> {
  // Pre-cache version (async load, then sync access everywhere)
  await getVersion();

  // Start global tick for animations
  startTick(100);

  const { waitUntilExit } = render(() => StorybookApp(), {
    // fullHeight disabled to fix incremental renderer sync issues
  });
  await waitUntilExit();

  // Cleanup tick on exit
  stopTick();
}

export { StorybookApp };