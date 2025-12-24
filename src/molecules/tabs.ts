/**
 * Tabs - Tabbed content switcher
 *
 * @layer Molecule
 * @description Interactive tabbed content with keyboard navigation
 *
 * Features:
 * - Tab header bar with clickable tabs
 * - Content panels that switch based on selection
 * - Top/bottom tab bar position
 * - Multiple visual styles (line, box, pills)
 * - Keyboard navigation (arrows)
 * - Closable tabs (optional)
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { createSignal } from '../primitives/signal.js';
import { useInput } from '../hooks/index.js';
import { getChars, getRenderMode } from '../core/capabilities.js';
import { getContrastColor, getTheme } from '../core/theme.js';

/** Variant type for Tabs component */
export type TabsVariant = 'primary' | 'secondary' | 'default';

// =============================================================================
// Types
// =============================================================================

export interface Tab<T = string> {
  /** Unique key */
  key: T;
  /** Tab label */
  label: string;
  /** Tab icon (optional) */
  icon?: string;
  /** Content to render when active */
  content: VNode | (() => VNode);
  /** Disabled state */
  disabled?: boolean;
  /** Closable (if tabs.closable is true) */
  closable?: boolean;
}

export interface TabsOptions<T = string> {
  /** Tab definitions */
  tabs: Tab<T>[];
  /** Initially active tab key */
  initialTab?: T;
  /** Tab bar position */
  position?: 'top' | 'bottom';
  /** Visual style */
  style?: 'line' | 'box' | 'pills';
  /** Semantic variant for theming */
  variant?: TabsVariant;
  /** Custom active tab color (overrides variant) */
  activeColor?: ColorValue;
  /** Custom inactive tab color (overrides variant) */
  inactiveColor?: ColorValue;
  /** Allow closing tabs */
  closable?: boolean;
  /** Show tab count badge */
  showCount?: boolean;
  /** Callbacks */
  onChange?: (key: T) => void;
  onClose?: (key: T) => void;
  /** Is component active (receives keyboard input) */
  isActive?: boolean;
}

export interface TabsState<T = string> {
  activeTab: () => T;
  focusIndex: () => number;
  tabs: () => Tab<T>[];
  setActiveTab: (key: T) => void;
  movePrev: () => void;
  moveNext: () => void;
  selectFocused: () => void;
  closeTab: (key: T) => void;
  addTab: (tab: Tab<T>) => void;
}

// =============================================================================
// State Factory
// =============================================================================

/**
 * Create a Tabs state manager
 */
export function createTabs<T = string>(options: TabsOptions<T>): TabsState<T> {
  const { tabs: initialTabs, initialTab, onChange, onClose } = options;

  const [tabsSignal, setTabs] = createSignal<Tab<T>[]>(initialTabs);
  const [activeTab, setActiveTabSignal] = createSignal<T>(
    initialTab ?? initialTabs[0]?.key ?? ('' as T)
  );
  const [focusIndex, setFocusIndex] = createSignal(
    initialTab
      ? Math.max(0, initialTabs.findIndex((t) => t.key === initialTab))
      : 0
  );

  const setActiveTab = (key: T) => {
    const currentTabs = tabsSignal();
    const tab = currentTabs.find((t) => t.key === key);
    if (tab && !tab.disabled) {
      setActiveTabSignal(key);
      setFocusIndex(currentTabs.findIndex((t) => t.key === key));
      onChange?.(key);
    }
  };

  const movePrev = () => {
    const currentTabs = tabsSignal();
    setFocusIndex((i) => {
      let newIndex = i - 1;
      while (newIndex >= 0 && currentTabs[newIndex]?.disabled) {
        newIndex--;
      }
      return newIndex >= 0 ? newIndex : i;
    });
  };

  const moveNext = () => {
    const currentTabs = tabsSignal();
    setFocusIndex((i) => {
      let newIndex = i + 1;
      while (newIndex < currentTabs.length && currentTabs[newIndex]?.disabled) {
        newIndex++;
      }
      return newIndex < currentTabs.length ? newIndex : i;
    });
  };

  const selectFocused = () => {
    const currentTabs = tabsSignal();
    const tab = currentTabs[focusIndex()];
    if (tab && !tab.disabled) {
      setActiveTabSignal(tab.key);
      onChange?.(tab.key);
    }
  };

  const closeTab = (key: T) => {
    const currentTabs = tabsSignal();
    const index = currentTabs.findIndex((t) => t.key === key);
    if (index >= 0) {
      const newTabs = currentTabs.filter((t) => t.key !== key);
      setTabs(newTabs);
      onClose?.(key);

      // If closed tab was active, select adjacent
      if (activeTab() === key && newTabs.length > 0) {
        const newIndex = Math.min(index, newTabs.length - 1);
        setActiveTab(newTabs[newIndex]!.key);
      }
    }
  };

  const addTab = (tab: Tab<T>) => {
    setTabs((tabs) => [...tabs, tab]);
  };

  return {
    activeTab,
    focusIndex,
    tabs: tabsSignal,
    setActiveTab,
    movePrev,
    moveNext,
    selectFocused,
    closeTab,
    addTab,
  };
}

// =============================================================================
// Component
// =============================================================================

export interface TabsProps<T = string> extends TabsOptions<T> {
  /** Pre-created state */
  state?: TabsState<T>;
  /** Height of content area (optional) */
  contentHeight?: number;
  /** Width of tabs (optional) */
  width?: number;
}

/**
 * Tabs - Tabbed content switcher
 *
 * @example
 * // Basic tabs
 * Tabs({
 *   tabs: [
 *     { key: 'home', label: 'Home', content: Text({}, 'Home content') },
 *     { key: 'settings', label: 'Settings', content: Text({}, 'Settings') },
 *   ],
 * })
 *
 * @example
 * // With style and icons
 * Tabs({
 *   tabs: [
 *     { key: 'code', label: 'Code', icon: '📝', content: codeView() },
 *     { key: 'output', label: 'Output', icon: '▶️', content: outputView() },
 *   ],
 *   style: 'pills',
 *   activeColor: 'cyan',
 * })
 */
export function Tabs<T = string>(props: TabsProps<T>): VNode {
  const theme = getTheme();
  const {
    position = 'top',
    style = 'line',
    variant = 'default',
    activeColor: customActiveColor,
    inactiveColor: customInactiveColor,
    closable = false,
    showCount = false,
    isActive = true,
    contentHeight,
    width,
    state: externalState,
  } = props;

  // Resolve colors from theme tokens or custom colors
  const tabTokens = theme.components.tabs;
  const activeColor = customActiveColor ?? tabTokens.tab.indicator;
  const inactiveColor = customInactiveColor ?? tabTokens.tab.fg;
  const activeFg = tabTokens.tab.activeFg;
  const activeBg = tabTokens.tab.activeBg;

  const state = externalState || createTabs(props);
  const chars = getChars();
  const isAscii = getRenderMode() === 'ascii';

  // Setup keyboard handling
  useInput(
    (input, key) => {
      if (key.leftArrow || input === 'h') state.movePrev();
      else if (key.rightArrow || input === 'l') state.moveNext();
      else if (key.return || input === ' ') state.selectFocused();
      else if (closable && (input === 'x' || input === 'w')) {
        const currentTabs = state.tabs();
        const tab = currentTabs[state.focusIndex()];
        if (tab?.closable !== false) {
          state.closeTab(tab!.key);
        }
      }
    },
    { isActive }
  );

  const currentTabs = state.tabs();
  const activeKey = state.activeTab();
  const focusIdx = state.focusIndex();

  // Render tab header
  const renderTabHeader = (): VNode => {
    const tabNodes: VNode[] = [];

    currentTabs.forEach((tab, i) => {
      const isTabActive = tab.key === activeKey;
      const isFocused = i === focusIdx;
      const isDisabled = tab.disabled;

      let tabContent: VNode;

      // Build tab label
      const labelParts: VNode[] = [];
      if (tab.icon) {
        labelParts.push(Text({}, tab.icon + ' '));
      }
      labelParts.push(Text({}, tab.label));
      if (closable && tab.closable !== false) {
        labelParts.push(Text({ dim: true }, ' ×'));
      }

      // Style-specific rendering
      switch (style) {
        case 'box': {
          const borderColor = isTabActive
            ? activeColor
            : isFocused
              ? 'foreground'
              : inactiveColor;
          const bgColor = isTabActive ? activeColor : undefined;
          // Use contrast color when tab is active with background
          const textColor = isTabActive
            ? getContrastColor(activeColor as string)
            : isDisabled
              ? 'mutedForeground'
              : 'foreground';

          if (isAscii) {
            const wrapper = isTabActive ? '[' + tab.label + ']' : ' ' + tab.label + ' ';
            tabContent = Text(
              { color: isDisabled ? 'mutedForeground' : borderColor, dim: isDisabled },
              wrapper
            );
          } else {
            tabContent = Box(
              {
                borderStyle: 'round',
                borderColor,
                paddingLeft: 1,
                paddingRight: 1,
              },
              Text(
                {
                  color: textColor,
                  backgroundColor: bgColor,
                  dim: isDisabled,
                },
                tab.icon ? `${tab.icon} ${tab.label}` : tab.label
              )
            );
          }
          break;
        }

        case 'pills': {
          const pillBg = isTabActive ? activeColor : undefined;
          // Use contrast color when pill is active with background
          const pillColor = isTabActive
            ? getContrastColor(activeColor as string)
            : isDisabled
              ? 'mutedForeground'
              : 'foreground';

          if (isAscii) {
            const wrapper = isTabActive
              ? `(${tab.label})`
              : ` ${tab.label} `;
            tabContent = Text(
              {
                color: isTabActive ? activeColor : isDisabled ? 'mutedForeground' : 'foreground',
                dim: isDisabled,
              },
              wrapper
            );
          } else {
            tabContent = Box(
              {
                paddingLeft: 1,
                paddingRight: 1,
              },
              Text(
                {
                  color: pillColor,
                  backgroundColor: pillBg,
                  dim: isDisabled,
                },
                tab.icon ? `${tab.icon} ${tab.label}` : tab.label
              )
            );
          }
          break;
        }

        case 'line':
        default: {
          const lineColor = isTabActive
            ? activeColor
            : isFocused
              ? 'foreground'
              : inactiveColor;

          const underline = isTabActive
            ? isAscii
              ? '─'.repeat(tab.label.length + (tab.icon ? 2 : 0))
              : '━'.repeat(tab.label.length + (tab.icon ? 2 : 0))
            : '';

          tabContent = Box(
            { flexDirection: 'column' },
            Box(
              { flexDirection: 'row' },
              ...labelParts.map((n) =>
                Text(
                  {
                    color: lineColor,
                    dim: isDisabled,
                    bold: isTabActive,
                  },
                  ''
                )
              ),
              Text(
                {
                  color: lineColor,
                  dim: isDisabled,
                  bold: isTabActive,
                },
                tab.icon ? `${tab.icon} ${tab.label}` : tab.label
              )
            ),
            isTabActive
              ? Text({ color: activeColor }, underline)
              : Text({ dim: true }, ' '.repeat(tab.label.length + (tab.icon ? 2 : 0)))
          );
          break;
        }
      }

      // Wrap tab content with onClick handler
      const clickableTab = Box(
        {
          onClick: isDisabled ? undefined : () => state.setActiveTab(tab.key),
        },
        tabContent
      );

      tabNodes.push(clickableTab);

      // Add separator between tabs (except for pills)
      if (i < currentTabs.length - 1 && style !== 'pills') {
        tabNodes.push(
          Text({ dim: true }, style === 'box' ? ' ' : '  ')
        );
      }
    });

    // Show count badge
    if (showCount) {
      tabNodes.push(
        Box(
          { marginLeft: 2 },
          Text({ color: 'mutedForeground', dim: true }, `(${currentTabs.length})`)
        )
      );
    }

    return Box(
      {
        flexDirection: 'row',
        width,
      },
      ...tabNodes
    );
  };

  // Render active content
  const activeTab = currentTabs.find((t) => t.key === activeKey);
  const content = activeTab
    ? typeof activeTab.content === 'function'
      ? activeTab.content()
      : activeTab.content
    : null;

  const contentBox = content
    ? Box(
        {
          height: contentHeight,
          marginTop: position === 'top' ? 1 : 0,
          marginBottom: position === 'bottom' ? 1 : 0,
        },
        content
      )
    : null;

  // Compose layout
  if (position === 'bottom') {
    return Box(
      { flexDirection: 'column', width },
      contentBox,
      renderTabHeader()
    );
  }

  return Box(
    { flexDirection: 'column', width },
    renderTabHeader(),
    contentBox
  );
}

// =============================================================================
// TabPanel - Individual tab content wrapper
// =============================================================================

export interface TabPanelProps {
  /** Content */
  children: VNode;
  /** Is currently active */
  active?: boolean;
  /** Padding */
  padding?: number;
}

/**
 * TabPanel - Wrapper for tab content
 */
export function TabPanel(props: TabPanelProps): VNode | null {
  const { children, active = true, padding = 0 } = props;

  if (!active) return null;

  return Box(
    { padding },
    children
  );
}

// =============================================================================
// VerticalTabs - Tabs with vertical tab bar
// =============================================================================

export interface VerticalTabsOptions<T = string> extends TabsOptions<T> {
  /** Tab bar width */
  tabWidth?: number;
  /** Content width */
  contentWidth?: number;
}

/**
 * VerticalTabs - Tabs with vertical tab bar on the left
 */
export function VerticalTabs<T = string>(props: VerticalTabsOptions<T>): VNode {
  const theme = getTheme();
  const {
    tabs,
    tabWidth = 20,
    contentWidth,
    activeColor: customActiveColor,
    inactiveColor: customInactiveColor,
    isActive = true,
  } = props;

  // Resolve colors from theme tokens or custom colors
  const tabTokens = theme.components.tabs;
  const activeColor = customActiveColor ?? tabTokens.tab.indicator;
  const inactiveColor = customInactiveColor ?? tabTokens.tab.fg;

  const state = createTabs(props);
  const chars = getChars();

  // Setup keyboard handling
  useInput(
    (input, key) => {
      if (key.upArrow || input === 'k') state.movePrev();
      else if (key.downArrow || input === 'j') state.moveNext();
      else if (key.return || input === ' ') state.selectFocused();
    },
    { isActive }
  );

  const currentTabs = state.tabs();
  const activeKey = state.activeTab();
  const focusIdx = state.focusIndex();

  // Tab bar
  const tabNodes = currentTabs.map((tab, i) => {
    const isTabActive = tab.key === activeKey;
    const isFocused = i === focusIdx;

    const indicator = isTabActive ? chars.radio.selected : ' ';
    const color = isTabActive
      ? activeColor
      : isFocused
        ? 'foreground'
        : inactiveColor;

    return Box(
      {
        flexDirection: 'row',
        onClick: tab.disabled ? undefined : () => state.setActiveTab(tab.key),
      },
      Text({ color: activeColor }, indicator + ' '),
      Text(
        { color, bold: isTabActive, dim: tab.disabled },
        tab.icon ? `${tab.icon} ${tab.label}` : tab.label
      )
    );
  });

  // Active content
  const activeTab = currentTabs.find((t) => t.key === activeKey);
  const content = activeTab
    ? typeof activeTab.content === 'function'
      ? activeTab.content()
      : activeTab.content
    : null;

  return Box(
    { flexDirection: 'row' },
    Box(
      {
        flexDirection: 'column',
        width: tabWidth,
        borderStyle: 'single',
        borderRight: true,
        borderTop: false,
        borderBottom: false,
        borderLeft: false,
        paddingRight: 1,
      },
      ...tabNodes
    ),
    Box(
      {
        width: contentWidth,
        paddingLeft: 2,
      },
      content
    )
  );
}

// =============================================================================
// Lazy Tabs - Load content only when tab is activated
// =============================================================================

export interface LazyTabsProps<T = string> extends TabsProps<T> {
  /** Render loading placeholder */
  loadingContent?: VNode;
}

/**
 * LazyTabs - Tabs that only render content when activated
 *
 * Content functions are called lazily, only when the tab becomes active.
 */
export function LazyTabs<T = string>(props: LazyTabsProps<T>): VNode {
  const { loadingContent = Text({ dim: true }, 'Loading...'), ...rest } = props;

  // Track which tabs have been loaded
  const [loadedTabs, setLoadedTabs] = createSignal<Set<T>>(new Set());

  const state = createTabs({
    ...rest,
    onChange: (key: T) => {
      setLoadedTabs((loaded) => {
        const newLoaded = new Set(loaded);
        newLoaded.add(key);
        return newLoaded;
      });
      rest.onChange?.(key);
    },
  });

  // Mark initial tab as loaded
  const initialKey = state.activeTab();
  if (initialKey && !loadedTabs().has(initialKey)) {
    setLoadedTabs((loaded) => {
      const newLoaded = new Set(loaded);
      newLoaded.add(initialKey);
      return newLoaded;
    });
  }

  return Tabs({
    ...rest,
    state,
  });
}
