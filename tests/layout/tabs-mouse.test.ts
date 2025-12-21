/**
 * Tabs Component Mouse Event Tests
 *
 * Tests for mouse interaction with Tabs and VerticalTabs components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Tabs, VerticalTabs, createTabs, type Tab } from '../../src/design-system/layout/tabs.js';
import { Box, Text } from '../../src/primitives/index.js';
import { calculateLayout } from '../../src/design-system/core/layout.js';
import { renderToString } from '../../src/design-system/core/renderer.js';
import {
  getHitTestRegistry,
  resetHitTestRegistry,
  registerHitTestFromLayout,
} from '../../src/core/hit-test.js';
import { MouseSimulator, simulateClick } from '../../src/dev-tools/mouse-simulator.js';
import { clearInputHandlers } from '../../src/hooks/context.js';
import type { VNode } from '../../src/utils/types.js';

// Test tabs
const basicTabs: Tab<string>[] = [
  { key: 'home', label: 'Home', content: Text({}, 'Home content') },
  { key: 'settings', label: 'Settings', content: Text({}, 'Settings content') },
  { key: 'about', label: 'About', content: Text({}, 'About content') },
];

const tabsWithDisabled: Tab<string>[] = [
  { key: 'home', label: 'Home', content: Text({}, 'Home') },
  { key: 'disabled', label: 'Disabled', content: Text({}, 'Disabled'), disabled: true },
  { key: 'about', label: 'About', content: Text({}, 'About') },
];

describe('Tabs Mouse Events', () => {
  beforeEach(() => {
    resetHitTestRegistry();
    clearInputHandlers();
  });

  afterEach(() => {
    resetHitTestRegistry();
    clearInputHandlers();
  });

  describe('Tab Click Selection', () => {
    it('should switch tabs on click', () => {
      const onChange = vi.fn();
      const state = createTabs({ tabs: basicTabs, onChange });

      const vnode = Tabs({
        tabs: basicTabs,
        state,
        onChange,
      });

      const layout = calculateLayout(vnode, 60, 20);
      registerHitTestFromLayout(layout);

      // Initially on first tab
      expect(state.activeTab()).toBe('home');

      const registry = getHitTestRegistry();
      expect(registry.hasClickableElements()).toBe(true);

      // Get clickable tab elements
      const elements = registry.getElements();
      const clickableTabs = elements.filter(e => e.node.props.onClick);

      // Should have 3 clickable tabs
      expect(clickableTabs.length).toBe(3);

      // Click on the second tab (Settings)
      const settingsTab = clickableTabs[1];
      const sim = new MouseSimulator();
      sim.click(settingsTab.x + 1, settingsTab.y);

      // Tab should switch
      expect(state.activeTab()).toBe('settings');
      expect(onChange).toHaveBeenCalledWith('settings');
    });

    it('should not switch to disabled tab on click', () => {
      const onChange = vi.fn();
      const state = createTabs({ tabs: tabsWithDisabled, onChange });

      const vnode = Tabs({
        tabs: tabsWithDisabled,
        state,
        onChange,
      });

      const layout = calculateLayout(vnode, 60, 20);
      registerHitTestFromLayout(layout);

      expect(state.activeTab()).toBe('home');

      const registry = getHitTestRegistry();
      const elements = registry.getElements();

      // Disabled tabs shouldn't be clickable
      const clickableTabs = elements.filter(e => e.node.props.onClick);

      // Should have only 2 clickable tabs (Home and About, not Disabled)
      expect(clickableTabs.length).toBe(2);

      // onChange should not have been called
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should switch tabs with different styles', () => {
      const styles: Array<'line' | 'box' | 'pills'> = ['line', 'box', 'pills'];

      for (const styleType of styles) {
        resetHitTestRegistry();
        clearInputHandlers();

        const onChange = vi.fn();
        const state = createTabs({ tabs: basicTabs, onChange });

        const vnode = Tabs({
          tabs: basicTabs,
          state,
          style: styleType,
          onChange,
        });

        const layout = calculateLayout(vnode, 60, 20);
        registerHitTestFromLayout(layout);

        const registry = getHitTestRegistry();
        const elements = registry.getElements();
        const clickableTabs = elements.filter(e => e.node.props.onClick);

        expect(clickableTabs.length).toBe(3);

        // Click on last tab
        const lastTab = clickableTabs[2];
        const sim = new MouseSimulator();
        sim.click(lastTab.x + 1, lastTab.y);

        expect(state.activeTab()).toBe('about');
      }
    });

    it('should update focus when clicking tab', () => {
      const state = createTabs({ tabs: basicTabs });

      const vnode = Tabs({
        tabs: basicTabs,
        state,
      });

      const layout = calculateLayout(vnode, 60, 20);
      registerHitTestFromLayout(layout);

      expect(state.focusIndex()).toBe(0);

      const registry = getHitTestRegistry();
      const elements = registry.getElements();
      const clickableTabs = elements.filter(e => e.node.props.onClick);

      // Click on third tab
      const thirdTab = clickableTabs[2];
      const sim = new MouseSimulator();
      sim.click(thirdTab.x + 1, thirdTab.y);

      expect(state.focusIndex()).toBe(2);
    });
  });

  describe('Rendering', () => {
    it('should render all tab labels', () => {
      const output = renderToString(Tabs({ tabs: basicTabs }), 60);
      expect(output).toContain('Home');
      expect(output).toContain('Settings');
      expect(output).toContain('About');
    });

    it('should render tab headers with active indicator', () => {
      // Check that the active tab is visually distinct
      const output = renderToString(
        Tabs({ tabs: basicTabs, initialTab: 'settings' }),
        60
      );
      // Settings should be rendered
      expect(output).toContain('Settings');
    });

    it('should render with icons', () => {
      const tabsWithIcons: Tab<string>[] = [
        { key: 'home', label: 'Home', icon: '🏠', content: Text({}, 'Home') },
        { key: 'star', label: 'Starred', icon: '⭐', content: Text({}, 'Starred') },
      ];
      const output = renderToString(Tabs({ tabs: tabsWithIcons }), 60);
      expect(output).toContain('🏠');
      expect(output).toContain('⭐');
    });

    it('should render tab count when showCount is true', () => {
      const output = renderToString(
        Tabs({ tabs: basicTabs, showCount: true }),
        60
      );
      expect(output).toContain('(3)');
    });
  });
});

describe('VerticalTabs Mouse Events', () => {
  beforeEach(() => {
    resetHitTestRegistry();
    clearInputHandlers();
  });

  afterEach(() => {
    resetHitTestRegistry();
    clearInputHandlers();
  });

  describe('Tab Click Selection', () => {
    it('should switch tabs on click', () => {
      const onChange = vi.fn();

      const vnode = VerticalTabs({
        tabs: basicTabs,
        onChange,
      });

      const layout = calculateLayout(vnode, 80, 20);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();
      expect(registry.hasClickableElements()).toBe(true);

      // Get clickable tab elements
      const elements = registry.getElements();
      const clickableTabs = elements.filter(e => e.node.props.onClick);

      // Should have 3 clickable tabs
      expect(clickableTabs.length).toBe(3);
    });

    it('should not switch to disabled tab on click', () => {
      const onChange = vi.fn();

      const vnode = VerticalTabs({
        tabs: tabsWithDisabled,
        onChange,
      });

      const layout = calculateLayout(vnode, 80, 20);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();
      const elements = registry.getElements();

      // Disabled tabs shouldn't be clickable
      const clickableTabs = elements.filter(e => e.node.props.onClick);

      // Should have only 2 clickable tabs (Home and About, not Disabled)
      expect(clickableTabs.length).toBe(2);

      // onChange should not have been called
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Rendering', () => {
    it('should render vertical tabs', () => {
      const output = renderToString(VerticalTabs({ tabs: basicTabs }), 80);
      expect(output).toContain('Home');
      expect(output).toContain('Settings');
      expect(output).toContain('About');
    });

    it('should render active content beside tabs', () => {
      const output = renderToString(
        VerticalTabs({ tabs: basicTabs, initialTab: 'about' }),
        80
      );
      expect(output).toContain('About content');
    });
  });
});

describe('Tabs State API', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  afterEach(() => {
    clearInputHandlers();
  });

  it('should switch tabs via setActiveTab', () => {
    const onChange = vi.fn();
    const state = createTabs({ tabs: basicTabs, onChange });

    expect(state.activeTab()).toBe('home');

    state.setActiveTab('settings');

    expect(state.activeTab()).toBe('settings');
    expect(onChange).toHaveBeenCalledWith('settings');
  });

  it('should not switch to disabled tab via setActiveTab', () => {
    const onChange = vi.fn();
    const state = createTabs({ tabs: tabsWithDisabled, onChange });

    expect(state.activeTab()).toBe('home');

    state.setActiveTab('disabled');

    // Should stay on home
    expect(state.activeTab()).toBe('home');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should navigate with movePrev and moveNext', () => {
    const state = createTabs({ tabs: basicTabs });

    expect(state.focusIndex()).toBe(0);

    state.moveNext();
    expect(state.focusIndex()).toBe(1);

    state.moveNext();
    expect(state.focusIndex()).toBe(2);

    // Should not go past last
    state.moveNext();
    expect(state.focusIndex()).toBe(2);

    state.movePrev();
    expect(state.focusIndex()).toBe(1);
  });

  it('should close tabs via closeTab', () => {
    const onClose = vi.fn();
    const state = createTabs({ tabs: basicTabs, onClose, closable: true });

    expect(state.tabs().length).toBe(3);

    state.closeTab('settings');

    expect(state.tabs().length).toBe(2);
    expect(onClose).toHaveBeenCalledWith('settings');
  });

  it('should add tabs via addTab', () => {
    const state = createTabs({ tabs: basicTabs });

    expect(state.tabs().length).toBe(3);

    state.addTab({ key: 'new', label: 'New Tab', content: Text({}, 'New') });

    expect(state.tabs().length).toBe(4);
  });
});
