/**
 * Menu - Navigable menu with submenus, shortcuts, and separators
 *
 * @layer Molecule
 * @description Context menu / dropdown menu with keyboard navigation
 *
 * Features:
 * - Arrow key + vim (j/k/h/l) navigation
 * - Submenu support with ▶ indicator
 * - Keyboard shortcut hints (right-aligned)
 * - Separators with optional labels
 * - Disabled items
 * - Icons per item
 * - Escape to close, Enter to select
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue, BorderStyleName } from '../utils/types.js';
import { createSignal } from '../primitives/signal.js';
import { useInput } from '../hooks/use-input.js';
import { useFactoryState } from '../hooks/factory-state.js';
import { getTheme } from '../core/theme.js';
import { formatHotkeyPlatform } from '../hooks/use-hotkeys.js';
import { getRenderMode } from '../core/capabilities.js';

// =============================================================================
// Types
// =============================================================================

export interface MenuItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Keyboard shortcut hint (e.g., 'ctrl+s') */
  shortcut?: string;
  /** Icon character */
  icon?: string;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Submenu items */
  children?: MenuItem[];
  /** Action to execute on select */
  action?: () => void;
}

export interface MenuSeparator {
  type: 'separator';
  /** Optional section label */
  label?: string;
}

export type MenuEntry = MenuItem | MenuSeparator;

export interface MenuOptions {
  /** Menu entries (items + separators) */
  items: MenuEntry[];
  /** Whether the menu is active for keyboard input */
  isActive?: boolean;
  /** Menu width in characters */
  width?: number;
  /** Border style */
  borderStyle?: BorderStyleName;
  /** Border color */
  borderColor?: ColorValue;
  /** Highlight color for focused item */
  highlightColor?: ColorValue;
  /** Called when an item is selected */
  onSelect?: (item: MenuItem) => void;
  /** Called when menu is closed (Escape) */
  onClose?: () => void;
}

export interface MenuProps extends MenuOptions {
  state?: MenuState;
}

export interface MenuState {
  selectedIndex: () => number;
  openSubmenuId: () => string | null;
  selectNext: () => void;
  selectPrevious: () => void;
  select: () => void;
  openSubmenu: () => void;
  closeSubmenu: () => void;
  setSelectedIndex: (index: number) => void;
  getSelectableItems: () => MenuItem[];
  updateOptions: (options: MenuOptions) => void;
}

// =============================================================================
// Helpers
// =============================================================================

function isSeparator(entry: MenuEntry): entry is MenuSeparator {
  return 'type' in entry && entry.type === 'separator';
}

function getSelectableIndices(items: MenuEntry[]): number[] {
  const indices: number[] = [];
  for (let i = 0; i < items.length; i++) {
    const entry = items[i]!;
    if (!isSeparator(entry) && !entry.disabled) {
      indices.push(i);
    }
  }
  return indices;
}

// =============================================================================
// State Factory
// =============================================================================

export function createMenu(options: MenuOptions): MenuState {
  let currentOptions = options;
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [openSubmenuId, setOpenSubmenuId] = createSignal<string | null>(null);

  const getSelectableItems = (): MenuItem[] => {
    return currentOptions.items.filter(
      (entry): entry is MenuItem => !isSeparator(entry) && !entry.disabled,
    );
  };

  const selectableIndices = () => getSelectableIndices(currentOptions.items);

  const selectNext = () => {
    const indices = selectableIndices();
    if (indices.length === 0) return;
    const current = selectedIndex();
    const currentPos = indices.indexOf(current);
    const nextPos = currentPos < indices.length - 1 ? currentPos + 1 : 0;
    setSelectedIndex(indices[nextPos]!);
  };

  const selectPrevious = () => {
    const indices = selectableIndices();
    if (indices.length === 0) return;
    const current = selectedIndex();
    const currentPos = indices.indexOf(current);
    const prevPos = currentPos > 0 ? currentPos - 1 : indices.length - 1;
    setSelectedIndex(indices[prevPos]!);
  };

  const select = () => {
    const entry = currentOptions.items[selectedIndex()];
    if (entry && !isSeparator(entry) && !entry.disabled) {
      if (entry.children && entry.children.length > 0) {
        setOpenSubmenuId(entry.id);
      } else {
        entry.action?.();
        currentOptions.onSelect?.(entry);
      }
    }
  };

  const openSubmenu = () => {
    const entry = currentOptions.items[selectedIndex()];
    if (entry && !isSeparator(entry) && entry.children && entry.children.length > 0) {
      setOpenSubmenuId(entry.id);
    }
  };

  const closeSubmenu = () => {
    setOpenSubmenuId(null);
  };

  // Initialize to first selectable index
  const indices = selectableIndices();
  if (indices.length > 0 && indices[0] !== undefined) {
    setSelectedIndex(indices[0]);
  }

  return {
    selectedIndex,
    openSubmenuId,
    selectNext,
    selectPrevious,
    select,
    openSubmenu,
    closeSubmenu,
    setSelectedIndex,
    getSelectableItems,
    updateOptions: (opts) => { currentOptions = opts; },
  };
}

// =============================================================================
// Component
// =============================================================================

/**
 * Menu component with keyboard navigation, submenus, and shortcuts.
 *
 * @example
 * Menu({
 *   items: [
 *     { id: 'new', label: 'New File', shortcut: 'ctrl+n', icon: '+' },
 *     { id: 'open', label: 'Open', shortcut: 'ctrl+o' },
 *     { type: 'separator', label: 'Recent' },
 *     { id: 'file1', label: 'project.ts' },
 *     { type: 'separator' },
 *     { id: 'settings', label: 'Settings', children: [
 *       { id: 'theme', label: 'Theme' },
 *       { id: 'keys', label: 'Keybindings' },
 *     ]},
 *     { type: 'separator' },
 *     { id: 'quit', label: 'Quit', shortcut: 'ctrl+q' },
 *   ],
 *   onSelect: (item) => handleAction(item.id),
 *   onClose: () => setMenuOpen(false),
 * })
 */
export function Menu(props: MenuProps): VNode {
  const {
    items,
    isActive = true,
    width = 30,
    borderStyle = 'round',
    borderColor = 'border',
    onClose,
  } = props;

  const theme = getTheme();
  const highlightColor = props.highlightColor ?? theme.accents?.info ?? 'cyan';
  const isAscii = getRenderMode() === 'ascii';
  const submenuIndicator = isAscii ? '>' : '\u25B6'; // ▶

  const state = useFactoryState(props.state, props, createMenu);

  // Keyboard handling
  if (isActive) {
    useInput((input, key) => {
      if (state.openSubmenuId()) {
        // In submenu — left arrow or escape closes it
        if (key.leftArrow || input === 'h') {
          state.closeSubmenu();
          return true;
        }
        if (key.escape) {
          state.closeSubmenu();
          return true;
        }
      }

      if (key.downArrow || input === 'j') { state.selectNext(); return true; }
      if (key.upArrow || input === 'k') { state.selectPrevious(); return true; }
      if (key.return || input === ' ') { state.select(); return true; }
      if (key.rightArrow || input === 'l') { state.openSubmenu(); return true; }
      if (key.escape) { onClose?.(); return true; }
      return;
    }, { isActive });
  }

  const currentIndex = state.selectedIndex();
  const innerWidth = width - 2; // Account for border left/right

  // Build menu rows
  const rows: VNode[] = [];

  for (let i = 0; i < items.length; i++) {
    const entry = items[i]!;

    if (isSeparator(entry)) {
      // Separator line
      if (entry.label) {
        const sepChar = isAscii ? '-' : '\u2500'; // ─
        const labelPad = entry.label.length + 2;
        const sideLen = Math.max(0, Math.floor((innerWidth - labelPad) / 2));
        const line = `${sepChar.repeat(sideLen)} ${entry.label} ${sepChar.repeat(innerWidth - sideLen - labelPad)}`;
        rows.push(Text({ color: 'mutedForeground', dim: true }, line));
      } else {
        const sepChar = isAscii ? '-' : '\u2500';
        rows.push(Text({ color: 'mutedForeground', dim: true }, sepChar.repeat(innerWidth)));
      }
      continue;
    }

    const isFocused = i === currentIndex;
    const isDisabled = entry.disabled ?? false;
    const hasSubmenu = entry.children && entry.children.length > 0;

    // Build item content
    const pointer = isFocused ? (isAscii ? '>' : '\u276F') : ' '; // ❯
    const icon = entry.icon ? `${entry.icon} ` : '';
    const label = `${pointer} ${icon}${entry.label}`;

    // Right side: shortcut or submenu indicator
    let rightText = '';
    if (hasSubmenu) {
      rightText = ` ${submenuIndicator}`;
    } else if (entry.shortcut) {
      rightText = ` ${formatHotkeyPlatform(entry.shortcut)}`;
    }

    // Pad label to fill width
    const labelLen = label.length + rightText.length;
    const padding = Math.max(0, innerWidth - labelLen);
    const fullLine = `${label}${' '.repeat(padding)}${rightText}`;

    if (isDisabled) {
      rows.push(Text({ dim: true }, fullLine));
    } else if (isFocused) {
      rows.push(Text({ color: highlightColor, bold: true }, fullLine));
    } else {
      rows.push(Text({}, fullLine));
    }
  }

  return Box(
    {
      flexDirection: 'column',
      borderStyle,
      borderColor,
      width,
      paddingLeft: 1,
      paddingRight: 1,
    },
    ...rows,
  );
}
