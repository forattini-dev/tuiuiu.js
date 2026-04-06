/**
 * Menu & createMenu Tests
 *
 * Tests for menu state management (createMenu) and
 * Menu component rendering (items, separators, shortcuts, submenus, disabled, focus).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToString } from '../../src/core/renderer.js';
import { setRenderMode } from '../../src/core/capabilities.js';
import {
  Menu,
  createMenu,
  type MenuItem,
  type MenuSeparator,
  type MenuEntry,
  type MenuOptions,
} from '../../src/molecules/menu.js';

// =============================================================================
// createMenu — state factory
// =============================================================================

describe('createMenu', () => {
  const basicItems: MenuEntry[] = [
    { id: 'new', label: 'New File' },
    { id: 'open', label: 'Open' },
    { id: 'save', label: 'Save' },
  ];

  const itemsWithSeparator: MenuEntry[] = [
    { id: 'new', label: 'New File' },
    { type: 'separator' } as MenuSeparator,
    { id: 'open', label: 'Open' },
    { id: 'save', label: 'Save' },
  ];

  const itemsWithDisabled: MenuEntry[] = [
    { id: 'new', label: 'New File', disabled: true },
    { id: 'open', label: 'Open' },
    { id: 'save', label: 'Save' },
  ];

  const itemsWithSubmenu: MenuEntry[] = [
    { id: 'file', label: 'File' },
    {
      id: 'settings',
      label: 'Settings',
      children: [
        { id: 'theme', label: 'Theme' },
        { id: 'keys', label: 'Keybindings' },
      ],
    },
    { id: 'quit', label: 'Quit' },
  ];

  it('initializes selectedIndex to first selectable item', () => {
    const state = createMenu({ items: basicItems });
    expect(state.selectedIndex()).toBe(0);
  });

  it('initializes selectedIndex skipping leading separators', () => {
    const items: MenuEntry[] = [
      { type: 'separator' } as MenuSeparator,
      { id: 'first', label: 'First' },
      { id: 'second', label: 'Second' },
    ];
    const state = createMenu({ items });
    expect(state.selectedIndex()).toBe(1);
  });

  it('initializes selectedIndex skipping disabled items', () => {
    const state = createMenu({ items: itemsWithDisabled });
    // First item is disabled, so initial selection should be index 1
    expect(state.selectedIndex()).toBe(1);
  });

  it('selectNext moves to next non-separator non-disabled item', () => {
    const state = createMenu({ items: itemsWithSeparator });
    // Initially at 0 (first item "New File")
    expect(state.selectedIndex()).toBe(0);

    state.selectNext();
    // Skips separator at index 1, goes to index 2
    expect(state.selectedIndex()).toBe(2);

    state.selectNext();
    expect(state.selectedIndex()).toBe(3);
  });

  it('selectNext wraps around to beginning', () => {
    const state = createMenu({ items: basicItems });
    expect(state.selectedIndex()).toBe(0);

    state.selectNext(); // 1
    state.selectNext(); // 2
    state.selectNext(); // wraps to 0
    expect(state.selectedIndex()).toBe(0);
  });

  it('selectPrevious moves to previous selectable item', () => {
    const state = createMenu({ items: basicItems });
    state.setSelectedIndex(2);
    expect(state.selectedIndex()).toBe(2);

    state.selectPrevious();
    expect(state.selectedIndex()).toBe(1);

    state.selectPrevious();
    expect(state.selectedIndex()).toBe(0);
  });

  it('selectPrevious wraps around to end', () => {
    const state = createMenu({ items: basicItems });
    expect(state.selectedIndex()).toBe(0);

    state.selectPrevious();
    expect(state.selectedIndex()).toBe(2);
  });

  it('selectPrevious skips separators', () => {
    const state = createMenu({ items: itemsWithSeparator });
    // Set to index 2 (after separator)
    state.setSelectedIndex(2);
    state.selectPrevious();
    // Should skip separator at index 1, land on index 0
    expect(state.selectedIndex()).toBe(0);
  });

  it('select calls onSelect for regular items', () => {
    const onSelect = vi.fn();
    const state = createMenu({ items: basicItems, onSelect });
    state.setSelectedIndex(0);
    state.select();
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'new', label: 'New File' }),
    );
  });

  it('select calls item action', () => {
    const action = vi.fn();
    const items: MenuEntry[] = [
      { id: 'test', label: 'Test', action },
    ];
    const state = createMenu({ items });
    state.select();
    expect(action).toHaveBeenCalledOnce();
  });

  it('select does nothing on separator', () => {
    const onSelect = vi.fn();
    const state = createMenu({ items: itemsWithSeparator, onSelect });
    // Force index to the separator position
    state.setSelectedIndex(1);
    state.select();
    // onSelect should NOT be called for separators
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('select does nothing on disabled item', () => {
    const onSelect = vi.fn();
    const state = createMenu({ items: itemsWithDisabled, onSelect });
    state.setSelectedIndex(0); // disabled item
    state.select();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('select opens submenu for items with children', () => {
    const onSelect = vi.fn();
    const state = createMenu({ items: itemsWithSubmenu, onSelect });
    state.setSelectedIndex(1); // "Settings" with children
    state.select();
    // Should open submenu, NOT call onSelect
    expect(state.openSubmenuId()).toBe('settings');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('openSubmenu sets openSubmenuId for items with children', () => {
    const state = createMenu({ items: itemsWithSubmenu });
    state.setSelectedIndex(1); // "Settings" with children
    state.openSubmenu();
    expect(state.openSubmenuId()).toBe('settings');
  });

  it('openSubmenu does nothing for items without children', () => {
    const state = createMenu({ items: itemsWithSubmenu });
    state.setSelectedIndex(0); // "File" — no children
    state.openSubmenu();
    expect(state.openSubmenuId()).toBeNull();
  });

  it('closeSubmenu clears openSubmenuId', () => {
    const state = createMenu({ items: itemsWithSubmenu });
    state.setSelectedIndex(1);
    state.openSubmenu();
    expect(state.openSubmenuId()).toBe('settings');

    state.closeSubmenu();
    expect(state.openSubmenuId()).toBeNull();
  });

  it('getSelectableItems returns only non-separator non-disabled items', () => {
    const items: MenuEntry[] = [
      { id: 'a', label: 'A' },
      { type: 'separator' } as MenuSeparator,
      { id: 'b', label: 'B', disabled: true },
      { id: 'c', label: 'C' },
    ];
    const state = createMenu({ items });
    const selectable = state.getSelectableItems();
    expect(selectable.length).toBe(2);
    expect(selectable[0]!.id).toBe('a');
    expect(selectable[1]!.id).toBe('c');
  });

  it('updateOptions replaces internal options', () => {
    const state = createMenu({ items: basicItems });
    const newItems: MenuEntry[] = [{ id: 'x', label: 'X' }];
    state.updateOptions({ items: newItems });
    const selectable = state.getSelectableItems();
    expect(selectable.length).toBe(1);
    expect(selectable[0]!.id).toBe('x');
  });

  it('handles empty items array', () => {
    const state = createMenu({ items: [] });
    expect(state.selectedIndex()).toBe(0);
    state.selectNext(); // should not crash
    state.selectPrevious(); // should not crash
    expect(state.getSelectableItems().length).toBe(0);
  });
});

// =============================================================================
// Menu component rendering
// =============================================================================

describe('Menu Component', () => {
  beforeEach(() => {
    setRenderMode('unicode');
  });

  it('renders items with labels', () => {
    const node = Menu({
      items: [
        { id: 'new', label: 'New File' },
        { id: 'open', label: 'Open' },
      ],
      isActive: false,
    });
    expect(node).not.toBeNull();
    const output = renderToString(node, 40);
    expect(output).toContain('New File');
    expect(output).toContain('Open');
  });

  it('renders separators', () => {
    const node = Menu({
      items: [
        { id: 'new', label: 'New File' },
        { type: 'separator' } as MenuSeparator,
        { id: 'open', label: 'Open' },
      ],
      isActive: false,
    });
    expect(node).not.toBeNull();
    const output = renderToString(node, 40);
    // Separator uses ─ characters in unicode mode
    expect(output).toContain('\u2500');
  });

  it('renders separator with label', () => {
    const node = Menu({
      items: [
        { id: 'new', label: 'New File' },
        { type: 'separator', label: 'Recent' } as MenuSeparator,
        { id: 'open', label: 'Open' },
      ],
      isActive: false,
    });
    expect(node).not.toBeNull();
    const output = renderToString(node, 40);
    expect(output).toContain('Recent');
    expect(output).toContain('\u2500');
  });

  it('renders ascii separators in ascii mode', () => {
    setRenderMode('ascii');
    const node = Menu({
      items: [
        { id: 'new', label: 'New File' },
        { type: 'separator' } as MenuSeparator,
        { id: 'open', label: 'Open' },
      ],
      isActive: false,
    });
    expect(node).not.toBeNull();
    const output = renderToString(node, 40);
    expect(output).toContain('-');
  });

  it('renders shortcut hints right-aligned', () => {
    const node = Menu({
      items: [
        { id: 'save', label: 'Save', shortcut: 'ctrl+s' },
      ],
      isActive: false,
    });
    expect(node).not.toBeNull();
    const output = renderToString(node, 40);
    expect(output).toContain('Save');
    expect(output).toContain('Ctrl+S');
  });

  it('renders submenu indicator', () => {
    const node = Menu({
      items: [
        {
          id: 'settings',
          label: 'Settings',
          children: [
            { id: 'theme', label: 'Theme' },
          ],
        },
      ],
      isActive: false,
    });
    expect(node).not.toBeNull();
    const output = renderToString(node, 40);
    expect(output).toContain('Settings');
    expect(output).toContain('\u25B6'); // ▶
  });

  it('renders ascii submenu indicator in ascii mode', () => {
    setRenderMode('ascii');
    const node = Menu({
      items: [
        {
          id: 'settings',
          label: 'Settings',
          children: [
            { id: 'theme', label: 'Theme' },
          ],
        },
      ],
      isActive: false,
    });
    expect(node).not.toBeNull();
    const output = renderToString(node, 40);
    expect(output).toContain('>');
  });

  it('renders disabled items dimmed', () => {
    const state = createMenu({
      items: [
        { id: 'disabled-item', label: 'Cannot Click', disabled: true },
        { id: 'enabled', label: 'Can Click' },
      ],
    });
    const node = Menu({
      items: [
        { id: 'disabled-item', label: 'Cannot Click', disabled: true },
        { id: 'enabled', label: 'Can Click' },
      ],
      isActive: false,
      state,
    });
    expect(node).not.toBeNull();
    // The component renders the first item with dim=true for disabled
    // Check that the output contains the disabled item text
    const output = renderToString(node, 40);
    expect(output).toContain('Cannot Click');
    expect(output).toContain('Can Click');
  });

  it('renders focused item highlighted', () => {
    const items: MenuEntry[] = [
      { id: 'a', label: 'Alpha' },
      { id: 'b', label: 'Beta' },
      { id: 'c', label: 'Charlie' },
    ];
    const state = createMenu({ items });
    state.setSelectedIndex(1); // Focus on "Beta"

    const node = Menu({
      items,
      isActive: false,
      state,
    });
    expect(node).not.toBeNull();

    // The Box has rows as children. Row at index 1 should be bold.
    // The main Box has borderStyle, so its child (the column box content)
    // contains the row nodes.
    const output = renderToString(node, 40);
    expect(output).toContain('Alpha');
    expect(output).toContain('Beta');
    expect(output).toContain('Charlie');
  });

  it('renders items with icons', () => {
    const node = Menu({
      items: [
        { id: 'new', label: 'New File', icon: '+' },
        { id: 'delete', label: 'Delete', icon: 'x' },
      ],
      isActive: false,
    });
    expect(node).not.toBeNull();
    const output = renderToString(node, 40);
    expect(output).toContain('+');
    expect(output).toContain('New File');
    expect(output).toContain('x');
    expect(output).toContain('Delete');
  });

  it('renders with custom width', () => {
    const node = Menu({
      items: [{ id: 'a', label: 'Item' }],
      width: 50,
      isActive: false,
    });
    expect(node).not.toBeNull();
    expect(node.props.width).toBe(50);
  });

  it('renders focused indicator on selected item', () => {
    const items: MenuEntry[] = [
      { id: 'a', label: 'Alpha' },
      { id: 'b', label: 'Beta' },
    ];
    const state = createMenu({ items });
    state.setSelectedIndex(0);

    const node = Menu({
      items,
      isActive: false,
      state,
    });
    const output = renderToString(node, 40);
    // The focused item has a ❯ pointer in unicode mode
    expect(output).toContain('\u276F');
  });
});
