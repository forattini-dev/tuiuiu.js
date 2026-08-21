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
import { useConst } from '../hooks/use-const.js';
import { useFactoryState } from '../hooks/factory-state.js';
import { getChars, getRenderMode } from '../core/capabilities.js';
import { warnIfDataDrivenPatternMisused } from '../core/dev-warnings.js';
import { getContrastColor, getTheme } from '../core/theme.js';
import { stringWidth } from '../utils/text-utils.js';
import { createCollectionController } from '../interaction/collection.js';
import { component, type ComponentKeyProps } from '../app/component.js';

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
  colorActive?: ColorValue;
  /** Custom inactive tab color (overrides variant) */
  colorInactive?: ColorValue;
  /** Allow closing tabs */
  closable?: boolean;
  /** Show tab count badge */
  showCount?: boolean;
  /** Callbacks */
  onChange?: (key: T) => void;
  onClose?: (key: T) => void;
  /** Is component active (receives keyboard input) */
  isActive?: boolean;
  /** Whether moving focus also activates the tab (default: automatic) */
  activationMode?: 'automatic' | 'manual';
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
  updateOptions: (options: TabsOptions<T>) => void;
}

// =============================================================================
// State Factory
// =============================================================================

/**
 * Create a Tabs state manager
 */
export function createTabs<T = string>(options: TabsOptions<T>): TabsState<T> {
  const { tabs: initialTabs, initialTab } = options;
  let runtimeOptions = options;
  let lastExternalTabs = initialTabs;

  const firstEnabled = initialTabs.find((tab) => !tab.disabled);
  const requested = initialTabs.find((tab) => Object.is(tab.key, initialTab) && !tab.disabled);
  const initialActive = requested?.key ?? firstEnabled?.key ?? ('' as T);

  const [tabsSignal, setTabs] = createSignal<Tab<T>[]>(initialTabs);
  const [activeTab, setActiveTabSignal] = createSignal<T>(initialActive);
  const [focusIndex, setFocusIndex] = createSignal(Math.max(0, initialTabs.findIndex(
    (tab) => Object.is(tab.key, initialActive),
  )));
  const collection = createCollectionController<Tab<T>, T>({
    items: initialTabs,
    getKey: (tab) => tab.key,
    isDisabled: (tab) => !!tab.disabled,
    activeKey: firstEnabled ? initialActive : null,
    selection: 'single',
    selectedKeys: firstEnabled ? [initialActive] : [],
  });

  const syncFocus = () => {
    const snapshot = collection.snapshot();
    setFocusIndex(Math.max(0, snapshot.activeIndex));
  };

  const setActiveTab = (key: T) => {
    if (!collection.setActive(key)) return;
    collection.selectOnly(key);
    syncFocus();
    setActiveTabSignal(key);
    runtimeOptions.onChange?.(key);
  };

  const movePrev = () => {
    if (!collection.move(-1)) return;
    syncFocus();
    if ((runtimeOptions.activationMode ?? 'automatic') === 'automatic') {
      const key = collection.snapshot().activeKey;
      if (key !== null) setActiveTab(key);
    }
  };

  const moveNext = () => {
    if (!collection.move(1)) return;
    syncFocus();
    if ((runtimeOptions.activationMode ?? 'automatic') === 'automatic') {
      const key = collection.snapshot().activeKey;
      if (key !== null) setActiveTab(key);
    }
  };

  const selectFocused = () => {
    const key = collection.snapshot().activeKey;
    if (key !== null) setActiveTab(key);
  };

  const closeTab = (key: T) => {
    const currentTabs = tabsSignal();
    const index = currentTabs.findIndex((t) => t.key === key);
    if (index >= 0) {
      const newTabs = currentTabs.filter((t) => t.key !== key);
      setTabs(newTabs);
      collection.reconcile(newTabs);
      syncFocus();
      runtimeOptions.onClose?.(key);

      // If closed tab was active, select adjacent
      if (activeTab() === key && newTabs.length > 0) {
        const nextKey = collection.snapshot().activeKey;
        if (nextKey !== null) setActiveTab(nextKey);
      } else if (newTabs.length === 0) {
        setActiveTabSignal('' as T);
      }
    }
  };

  const addTab = (tab: Tab<T>) => {
    const nextTabs = [...tabsSignal(), tab];
    setTabs(nextTabs);
    collection.reconcile(nextTabs);
    syncFocus();
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
    updateOptions: (nextOptions: TabsOptions<T>) => {
      runtimeOptions = nextOptions;
      if (nextOptions.tabs !== lastExternalTabs) {
        lastExternalTabs = nextOptions.tabs;
        setTabs(nextOptions.tabs);
        collection.reconcile(nextOptions.tabs);
        syncFocus();
        const selectedExists = nextOptions.tabs.some(
          (tab) => Object.is(tab.key, activeTab()) && !tab.disabled,
        );
        if (!selectedExists) {
          const nextKey = collection.snapshot().activeKey;
          if (nextKey !== null) setActiveTab(nextKey);
          else setActiveTabSignal('' as T);
        }
      }
    },
  };
}

export function useTabsState<T = string>(options: TabsOptions<T>) {
  const state = useConst(() => createTabs(options));
  state.updateOptions(options);
  return state;
}

// =============================================================================
// Component
// =============================================================================

export interface TabsProps<T = string> extends TabsOptions<T>, ComponentKeyProps {
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
 *   colorActive: 'cyan',
 * })
 */
export const Tabs = component('Tabs', function Tabs<T = string>(props: TabsProps<T>): VNode {
  const maybeMisusedProps = props as TabsProps<T> & Record<string, unknown>;
  warnIfDataDrivenPatternMisused(
    'Tabs',
    maybeMisusedProps.children !== undefined || maybeMisusedProps.content !== undefined,
    'Tabs is data-driven. Put content inside each tab object: `Tabs({ tabs: [{ key, label, content: View() }] })`.',
    'top-level-content',
  );
  warnIfDataDrivenPatternMisused(
    'Tabs',
    props.tabs.some((tab) => tab.content === undefined),
    'Each tab passed to Tabs should include its own `content` field.',
    'missing-item-content',
  );

  const theme = getTheme();
  const {
    position = 'top',
    style = 'line',
    variant = 'default',
    colorActive: customColorActive,
    colorInactive: customColorInactive,
    closable = false,
    showCount = false,
    isActive = true,
    contentHeight,
    width,
    state: externalState,
  } = props;

  // Resolve colors from theme tokens or custom colors
  const tabTokens = theme.components.tabs;
  const variantColor = variant === 'primary'
    ? theme.palette.primary[500]
    : variant === 'secondary'
      ? theme.palette.secondary[500]
      : tabTokens.tab.indicator;
  const colorActive = customColorActive ?? variantColor;
  const colorInactive = customColorInactive ?? tabTokens.tab.fg;
  const activeFg = tabTokens.tab.activeFg;
  const activeBg = tabTokens.tab.activeBg;
  const resolvedActiveBg = customColorActive || variant !== 'default'
    ? colorActive
    : activeBg;
  const resolvedActiveFg = customColorActive || variant !== 'default'
    ? getContrastColor(colorActive as string)
    : activeFg;

  const state = useFactoryState(externalState, props, createTabs);
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
      const tabLabel = `${tab.icon ? `${tab.icon} ` : ''}${tab.label}${
        closable && tab.closable !== false ? ' ×' : ''
      }`;
      const tabLabelWidth = stringWidth(tabLabel);

      let tabContent: VNode;

      // Style-specific rendering
      switch (style) {
        case 'box': {
          const borderColor = isTabActive
            ? colorActive
            : isFocused
              ? 'foreground'
              : colorInactive;
          const bgColor = isTabActive ? resolvedActiveBg : undefined;
          const textColor = isTabActive
            ? resolvedActiveFg
            : isDisabled
              ? 'mutedForeground'
              : 'foreground';

          if (isAscii) {
            const wrapper = isTabActive ? `[${tabLabel}]` : ` ${tabLabel} `;
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
                tabLabel
              )
            );
          }
          break;
        }

        case 'pills': {
          const pillBg = isTabActive ? resolvedActiveBg : undefined;
          const pillColor = isTabActive
            ? resolvedActiveFg
            : isDisabled
              ? 'mutedForeground'
              : 'foreground';

          if (isAscii) {
            const wrapper = isTabActive
              ? `(${tabLabel})`
              : ` ${tabLabel} `;
            tabContent = Text(
              {
                color: isTabActive ? colorActive : isDisabled ? 'mutedForeground' : 'foreground',
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
                tabLabel
              )
            );
          }
          break;
        }

        case 'line':
        default: {
          const lineColor = isTabActive
            ? colorActive
            : isFocused
              ? 'foreground'
              : colorInactive;

          const underline = isTabActive
            ? (isAscii ? chars.border.horizontal : '━').repeat(tabLabelWidth)
            : '';

          tabContent = Box(
            { flexDirection: 'column' },
            Box(
              { flexDirection: 'row' },
              Text(
                {
                  color: lineColor,
                  dim: isDisabled,
                  bold: isTabActive,
                },
                tabLabel
              )
            ),
            isTabActive
              ? Text({ color: colorActive }, underline)
              : Text({ dim: true }, ' '.repeat(tabLabelWidth))
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
});

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

export interface VerticalTabsOptions<T = string> extends Omit<TabsOptions<T>, 'position'> {
  /** Side on which to render the vertical tab bar */
  position?: 'left' | 'right';
  /** Tab bar width */
  tabWidth?: number;
  /** Content width */
  contentWidth?: number;
}

export interface VerticalTabsProps<T = string> extends VerticalTabsOptions<T>, ComponentKeyProps {
  /** Pre-created state */
  state?: TabsState<T>;
}

/**
 * VerticalTabs - Tabs with vertical tab bar on the left
 */
export const VerticalTabs = component('VerticalTabs', function VerticalTabs<T = string>(
  props: VerticalTabsProps<T>,
): VNode {
  const theme = getTheme();
  const {
    position = 'left',
    tabWidth = 20,
    contentWidth,
    colorActive: customColorActive,
    colorInactive: customColorInactive,
    isActive = true,
    state: externalState,
  } = props;

  // Resolve colors from theme tokens or custom colors
  const tabTokens = theme.components.tabs;
  const colorActive = customColorActive ?? tabTokens.tab.indicator;
  const colorInactive = customColorInactive ?? tabTokens.tab.fg;

  const { position: _position, ...tabsOptions } = props;
  void _position;
  const state = useFactoryState(externalState, tabsOptions, createTabs);
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
      ? colorActive
      : isFocused
        ? 'foreground'
        : colorInactive;

    return Box(
      {
        flexDirection: 'row',
        onClick: tab.disabled ? undefined : () => state.setActiveTab(tab.key),
      },
      Text({ color: colorActive }, indicator + ' '),
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

  const tabBar = Box(
    {
      flexDirection: 'column',
      width: tabWidth,
      borderStyle: 'single',
      borderRight: position === 'left',
      borderTop: false,
      borderBottom: false,
      borderLeft: position === 'right',
      paddingRight: position === 'left' ? 1 : undefined,
      paddingLeft: position === 'right' ? 1 : undefined,
    },
    ...tabNodes
  );
  const contentPanel = Box(
    {
      width: contentWidth,
      paddingLeft: position === 'left' ? 2 : undefined,
      paddingRight: position === 'right' ? 2 : undefined,
    },
    content
  );

  return Box(
    { flexDirection: 'row' },
    ...(position === 'left' ? [tabBar, contentPanel] : [contentPanel, tabBar]),
  );
});

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
export const LazyTabs = component('LazyTabs', function LazyTabs<T = string>(
  props: LazyTabsProps<T>,
): VNode {
  const { loadingContent = Text({ dim: true }, 'Loading...'), ...rest } = props;

  // useConst ensures signals + state persist across re-renders (created once)
  const { loadedTabs, setLoadedTabs, state } = useConst(() => {
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

    return { loadedTabs, setLoadedTabs, state };
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
});
