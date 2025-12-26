/**
 * Tests for Legend component
 */

import { describe, it, expect, vi } from 'vitest';
import { createLegend, Legend } from '../../../src/molecules/data-viz/legend.js';
import { renderOnce } from '../../../src/app/render-loop.js';

describe('Legend', () => {
  const sampleItems = [
    { label: 'Series 1', color: 'cyan' as const },
    { label: 'Series 2', color: 'green' as const },
    { label: 'Series 3', color: 'yellow' as const },
  ];

  describe('createLegend', () => {
    it('should create legend state with all items visible by default', () => {
      const state = createLegend({ items: sampleItems });

      expect(state.visibleItems()).toEqual([true, true, true]);
    });

    it('should respect initial visibility settings', () => {
      const items = [
        { label: 'Series 1', visible: true },
        { label: 'Series 2', visible: false },
        { label: 'Series 3', visible: true },
      ];
      const state = createLegend({ items });

      expect(state.visibleItems()).toEqual([true, false, true]);
    });

    it('should toggle individual items', () => {
      const state = createLegend({ items: sampleItems });

      state.toggleItem(1);
      expect(state.visibleItems()).toEqual([true, false, true]);

      state.toggleItem(1);
      expect(state.visibleItems()).toEqual([true, true, true]);
    });

    it('should call onItemClick when toggling', () => {
      const onItemClick = vi.fn();
      const state = createLegend({ items: sampleItems, onItemClick });

      state.toggleItem(0);

      expect(onItemClick).toHaveBeenCalledWith(0, 'Series 1');
    });

    it('should toggle all items', () => {
      const state = createLegend({ items: sampleItems });

      // All visible -> all hidden
      state.toggleAll();
      expect(state.visibleItems()).toEqual([false, false, false]);

      // All hidden -> all visible
      state.toggleAll();
      expect(state.visibleItems()).toEqual([true, true, true]);
    });

    it('should show individual items', () => {
      const state = createLegend({ items: sampleItems });
      state.toggleAll(); // Hide all

      state.showItem(1);
      expect(state.visibleItems()).toEqual([false, true, false]);
    });

    it('should hide individual items', () => {
      const state = createLegend({ items: sampleItems });

      state.hideItem(0);
      expect(state.visibleItems()).toEqual([false, true, true]);
    });

    it('should get visible items only', () => {
      const state = createLegend({ items: sampleItems });
      state.toggleItem(1); // Hide Series 2

      const visible = state.getVisibleItems();
      expect(visible).toHaveLength(2);
      expect(visible.map((i) => i.label)).toEqual(['Series 1', 'Series 3']);
    });
  });

  describe('Legend component', () => {
    it('should render legend items', () => {
      const output = renderOnce(
        Legend({
          items: sampleItems,
        }),
        80
      );

      expect(output).toContain('Series 1');
      expect(output).toContain('Series 2');
      expect(output).toContain('Series 3');
    });

    it('should render symbols by default', () => {
      const output = renderOnce(
        Legend({
          items: sampleItems,
        }),
        80
      );

      expect(output).toContain('●'); // Default circle symbol
    });

    it('should use square symbols when specified', () => {
      const output = renderOnce(
        Legend({
          items: sampleItems,
          symbolType: 'square',
        }),
        80
      );

      expect(output).toContain('■');
    });

    it('should use line symbols when specified', () => {
      const output = renderOnce(
        Legend({
          items: sampleItems,
          symbolType: 'line',
        }),
        80
      );

      expect(output).toContain('─');
    });

    it('should use custom symbols', () => {
      const items = [
        { label: 'Custom', color: 'cyan' as const, symbol: '★' },
      ];
      const output = renderOnce(
        Legend({ items }),
        80
      );

      expect(output).toContain('★');
    });

    it('should hide symbols when showSymbols is false', () => {
      const output = renderOnce(
        Legend({
          items: sampleItems,
          showSymbols: false,
        }),
        80
      );

      expect(output).not.toContain('●');
      expect(output).toContain('Series 1');
    });

    it('should render vertically for right position', () => {
      const output = renderOnce(
        Legend({
          items: sampleItems,
          position: 'right',
        }),
        80
      );

      // Just verify it renders without error
      expect(output).toContain('Series 1');
    });

    it('should render vertically for left position', () => {
      const output = renderOnce(
        Legend({
          items: sampleItems,
          position: 'left',
        }),
        80
      );

      expect(output).toContain('Series 1');
    });

    it('should render horizontally for top position', () => {
      const output = renderOnce(
        Legend({
          items: sampleItems,
          position: 'top',
        }),
        80
      );

      expect(output).toContain('Series 1');
    });

    it('should use external state when provided', () => {
      const state = createLegend({ items: sampleItems });
      state.hideItem(0);

      const output = renderOnce(
        Legend({
          items: sampleItems,
          state,
        }),
        80
      );

      // Both should still be present but Series 1 should be dimmed
      expect(output).toContain('Series 1');
      expect(output).toContain('Series 2');
    });

    it('should handle interactive mode', () => {
      const output = renderOnce(
        Legend({
          items: sampleItems,
          interactive: true,
        }),
        80
      );

      expect(output).toContain('Series 1');
    });

    it('should handle empty items array', () => {
      const output = renderOnce(
        Legend({
          items: [],
        }),
        80
      );

      // Should render without error
      expect(output).toBeDefined();
    });
  });
});
