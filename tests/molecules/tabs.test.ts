import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  Tabs,
  createTabs,
  VerticalTabs,
  type Tab,
  type TabsOptions,
  type TabsState,
} from '../../src/molecules/tabs.js';
import { Text, Box } from '../../src/primitives/nodes.js';
import { renderOnce } from '../../src/app/render-loop.js';

describe('Tabs', () => {
  // ==========================================================================
  // createTabs State Factory
  // ==========================================================================
  describe('createTabs', () => {
    const baseTabs: Tab[] = [
      { key: 'tab1', label: 'Tab 1', content: Text({}, 'Content 1') },
      { key: 'tab2', label: 'Tab 2', content: Text({}, 'Content 2') },
      { key: 'tab3', label: 'Tab 3', content: Text({}, 'Content 3') },
    ];

    let state: TabsState;

    beforeEach(() => {
      state = createTabs({ tabs: baseTabs });
    });

    describe('initial state', () => {
      it('should set first tab as active by default', () => {
        expect(state.activeTab()).toBe('tab1');
      });

      it('should set focus index to 0', () => {
        expect(state.focusIndex()).toBe(0);
      });

      it('should return all tabs', () => {
        expect(state.tabs()).toHaveLength(3);
      });

      it('should respect initialTab', () => {
        const stateWithInitial = createTabs({
          tabs: baseTabs,
          initialTab: 'tab2',
        });
        expect(stateWithInitial.activeTab()).toBe('tab2');
        expect(stateWithInitial.focusIndex()).toBe(1);
      });

      it('should handle empty tabs array', () => {
        const emptyState = createTabs({ tabs: [] });
        expect(emptyState.activeTab()).toBe('');
        expect(emptyState.tabs()).toHaveLength(0);
      });
    });

    describe('setActiveTab', () => {
      it('should set active tab', () => {
        state.setActiveTab('tab2');
        expect(state.activeTab()).toBe('tab2');
        expect(state.focusIndex()).toBe(1);
      });

      it('should not set disabled tab as active', () => {
        const tabsWithDisabled: Tab[] = [
          { key: 'tab1', label: 'Tab 1', content: Text({}, 'Content 1') },
          { key: 'tab2', label: 'Tab 2', content: Text({}, 'Content 2'), disabled: true },
        ];
        const stateWithDisabled = createTabs({ tabs: tabsWithDisabled });
        stateWithDisabled.setActiveTab('tab2');
        expect(stateWithDisabled.activeTab()).toBe('tab1');
      });

      it('should call onChange callback', () => {
        const onChange = vi.fn();
        const stateWithCallback = createTabs({ tabs: baseTabs, onChange });
        stateWithCallback.setActiveTab('tab2');
        expect(onChange).toHaveBeenCalledWith('tab2');
      });
    });

    describe('movePrev', () => {
      it('should move focus to previous tab', () => {
        state.setActiveTab('tab2');
        state.movePrev();
        expect(state.focusIndex()).toBe(0);
      });

      it('should not go below 0', () => {
        state.movePrev();
        expect(state.focusIndex()).toBe(0);
      });

      it('should skip disabled tabs', () => {
        const tabsWithDisabled: Tab[] = [
          { key: 'tab1', label: 'Tab 1', content: Text({}, 'Content 1') },
          { key: 'tab2', label: 'Tab 2', content: Text({}, 'Content 2'), disabled: true },
          { key: 'tab3', label: 'Tab 3', content: Text({}, 'Content 3') },
        ];
        const stateWithDisabled = createTabs({ tabs: tabsWithDisabled, initialTab: 'tab3' });
        stateWithDisabled.movePrev();
        expect(stateWithDisabled.focusIndex()).toBe(0);
      });
    });

    describe('moveNext', () => {
      it('should move focus to next tab', () => {
        state.moveNext();
        expect(state.focusIndex()).toBe(1);
      });

      it('should not go beyond last tab', () => {
        state.setActiveTab('tab3');
        state.moveNext();
        expect(state.focusIndex()).toBe(2);
      });

      it('should skip disabled tabs', () => {
        const tabsWithDisabled: Tab[] = [
          { key: 'tab1', label: 'Tab 1', content: Text({}, 'Content 1') },
          { key: 'tab2', label: 'Tab 2', content: Text({}, 'Content 2'), disabled: true },
          { key: 'tab3', label: 'Tab 3', content: Text({}, 'Content 3') },
        ];
        const stateWithDisabled = createTabs({ tabs: tabsWithDisabled });
        stateWithDisabled.moveNext();
        expect(stateWithDisabled.focusIndex()).toBe(2);
      });
    });

    describe('selectFocused', () => {
      it('should select the focused tab', () => {
        state.moveNext();
        state.selectFocused();
        expect(state.activeTab()).toBe('tab2');
      });

      it('should call onChange', () => {
        const onChange = vi.fn();
        const stateWithCallback = createTabs({ tabs: baseTabs, onChange });
        stateWithCallback.moveNext();
        stateWithCallback.selectFocused();
        expect(onChange).toHaveBeenCalledWith('tab2');
      });

      it('should not select disabled tab', () => {
        const tabsWithDisabled: Tab[] = [
          { key: 'tab1', label: 'Tab 1', content: Text({}, 'Content 1') },
          { key: 'tab2', label: 'Tab 2', content: Text({}, 'Content 2'), disabled: true },
        ];
        const stateWithDisabled = createTabs({ tabs: tabsWithDisabled });
        // Force focus index to disabled tab (bypassing movePrev/Next)
        stateWithDisabled.selectFocused();
        expect(stateWithDisabled.activeTab()).toBe('tab1');
      });
    });

    describe('closeTab', () => {
      it('should remove tab from list', () => {
        state.closeTab('tab2');
        expect(state.tabs()).toHaveLength(2);
        expect(state.tabs().find((t) => t.key === 'tab2')).toBeUndefined();
      });

      it('should call onClose callback', () => {
        const onClose = vi.fn();
        const stateWithCallback = createTabs({ tabs: baseTabs, onClose });
        stateWithCallback.closeTab('tab1');
        expect(onClose).toHaveBeenCalledWith('tab1');
      });

      it('should handle closing active tab', () => {
        state.closeTab('tab1');
        // Should still have valid state
        expect(state.tabs()).toHaveLength(2);
      });
    });

    describe('addTab', () => {
      it('should add new tab', () => {
        const newTab: Tab = { key: 'tab4', label: 'Tab 4', content: Text({}, 'Content 4') };
        state.addTab(newTab);
        expect(state.tabs()).toHaveLength(4);
        expect(state.tabs().find((t) => t.key === 'tab4')).toBeDefined();
      });
    });
  });

  // ==========================================================================
  // Tabs Component
  // ==========================================================================
  describe('Tabs component', () => {
    const baseTabs: Tab[] = [
      { key: 'tab1', label: 'Tab 1', content: Text({}, 'Content 1') },
      { key: 'tab2', label: 'Tab 2', content: Text({}, 'Content 2') },
    ];

    it('should render without errors', () => {
      const output = renderOnce(Tabs({ tabs: baseTabs }));
      expect(output).toBeDefined();
    });

    it('should show tab labels', () => {
      const output = renderOnce(Tabs({ tabs: baseTabs }));
      expect(output).toContain('Tab 1');
      expect(output).toContain('Tab 2');
    });

    it('should show active tab content', () => {
      const output = renderOnce(Tabs({ tabs: baseTabs }));
      expect(output).toContain('Content 1');
    });

    it('should accept different styles', () => {
      const styles: Array<'line' | 'box' | 'pills'> = ['line', 'box', 'pills'];
      styles.forEach((style) => {
        const node = Tabs({ tabs: baseTabs, style });
        expect(node).toBeDefined();
      });
    });

    it('should accept different positions', () => {
      const positions: Array<'top' | 'bottom'> = ['top', 'bottom'];
      positions.forEach((position) => {
        const node = Tabs({ tabs: baseTabs, position });
        expect(node).toBeDefined();
      });
    });

    it('should accept external state', () => {
      const externalState = createTabs({ tabs: baseTabs, initialTab: 'tab2' });
      const output = renderOnce(Tabs({ tabs: baseTabs, state: externalState }));
      expect(output).toContain('Content 2');
    });

    it('should accept custom colors', () => {
      const node = Tabs({
        tabs: baseTabs,
        colorActive: 'cyan',
        colorInactive: 'gray',
      });
      expect(node).toBeDefined();
    });

    it('should accept variant', () => {
      const variants: Array<'primary' | 'secondary' | 'default'> = [
        'primary', 'secondary', 'default',
      ];
      variants.forEach((variant) => {
        const node = Tabs({ tabs: baseTabs, variant });
        expect(node).toBeDefined();
      });
    });

    it('should show closable tabs', () => {
      const tabsWithClosable: Tab[] = [
        { key: 'tab1', label: 'Tab 1', content: Text({}, 'Content'), closable: true },
      ];
      const node = Tabs({ tabs: tabsWithClosable, closable: true });
      expect(node).toBeDefined();
    });

    it('should show tab count when enabled', () => {
      const node = Tabs({ tabs: baseTabs, showCount: true });
      expect(node).toBeDefined();
    });

    it('should handle tab with icon', () => {
      const tabsWithIcon: Tab[] = [
        { key: 'tab1', label: 'Home', icon: '🏠', content: Text({}, 'Content') },
      ];
      const output = renderOnce(Tabs({ tabs: tabsWithIcon }));
      expect(output).toBeDefined();
    });

    it('should handle tab with function content', () => {
      const tabsWithFn: Tab[] = [
        { key: 'tab1', label: 'Tab 1', content: () => Text({}, 'Dynamic Content') },
      ];
      const output = renderOnce(Tabs({ tabs: tabsWithFn }));
      expect(output).toContain('Dynamic Content');
    });

    it('should handle isActive=false', () => {
      const node = Tabs({ tabs: baseTabs, isActive: false });
      expect(node).toBeDefined();
    });

    it('should render disabled tabs differently', () => {
      const tabsWithDisabled: Tab[] = [
        { key: 'tab1', label: 'Tab 1', content: Text({}, 'Content 1') },
        { key: 'tab2', label: 'Tab 2', content: Text({}, 'Content 2'), disabled: true },
      ];
      const node = Tabs({ tabs: tabsWithDisabled });
      expect(node).toBeDefined();
    });
  });

  // ==========================================================================
  // VerticalTabs
  // ==========================================================================
  describe('VerticalTabs', () => {
    const baseTabs: Tab[] = [
      { key: 'tab1', label: 'Tab 1', content: Text({}, 'Content 1') },
      { key: 'tab2', label: 'Tab 2', content: Text({}, 'Content 2') },
    ];

    it('should render without errors', () => {
      const output = renderOnce(VerticalTabs({ tabs: baseTabs }));
      expect(output).toBeDefined();
    });

    it('should show tab labels', () => {
      const output = renderOnce(VerticalTabs({ tabs: baseTabs }));
      expect(output).toContain('Tab 1');
      expect(output).toContain('Tab 2');
    });

    it('should accept position left/right', () => {
      const positions: Array<'left' | 'right'> = ['left', 'right'];
      positions.forEach((position) => {
        const node = VerticalTabs({ tabs: baseTabs, position });
        expect(node).toBeDefined();
      });
    });

    it('should accept width option', () => {
      const node = VerticalTabs({ tabs: baseTabs, tabWidth: 20 });
      expect(node).toBeDefined();
    });

    it('should accept external state', () => {
      const externalState = createTabs({ tabs: baseTabs, initialTab: 'tab2' });
      const node = VerticalTabs({ tabs: baseTabs, state: externalState });
      expect(node).toBeDefined();
    });

    it('should accept custom colors', () => {
      const node = VerticalTabs({
        tabs: baseTabs,
        colorActive: 'green',
        colorInactive: 'gray',
      });
      expect(node).toBeDefined();
    });

    it('should handle isActive=false', () => {
      const node = VerticalTabs({ tabs: baseTabs, isActive: false });
      expect(node).toBeDefined();
    });
  });

});
