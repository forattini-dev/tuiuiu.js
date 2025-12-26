/**
 * Tests for data visualization hooks
 */

import { describe, it, expect, vi } from 'vitest';
import {
  useChartSelection,
  useChartHover,
  useChartTooltip,
  useChartZoom,
  useChartKeyboard,
  useChartInteraction,
  useChartDataChange,
} from '../../../src/molecules/data-viz/hooks.js';

describe('Data Visualization Hooks', () => {
  describe('useChartSelection', () => {
    it('should initialize with empty selection', () => {
      const selection = useChartSelection(10);
      expect(selection.selectedIndices()).toEqual([]);
      expect(selection.lastSelectedIndex()).toBeUndefined();
    });

    it('should select a single item', () => {
      const selection = useChartSelection(10);
      selection.select(5);
      expect(selection.selectedIndices()).toEqual([5]);
      expect(selection.lastSelectedIndex()).toBe(5);
    });

    it('should replace selection on new select without multiSelect', () => {
      const selection = useChartSelection(10, false);
      selection.select(5);
      selection.select(3);
      expect(selection.selectedIndices()).toEqual([3]);
    });

    it('should add to selection with multiSelect enabled', () => {
      const selection = useChartSelection(10, true);
      selection.select(5, true);
      selection.select(3, true);
      expect(selection.selectedIndices()).toContain(5);
      expect(selection.selectedIndices()).toContain(3);
    });

    it('should toggle selection in multiSelect mode', () => {
      const selection = useChartSelection(10, true);
      selection.select(5, true);
      selection.select(5, true); // Toggle off
      expect(selection.selectedIndices()).not.toContain(5);
    });

    it('should ignore out of range indices', () => {
      const selection = useChartSelection(10);
      selection.select(-1);
      selection.select(15);
      expect(selection.selectedIndices()).toEqual([]);
    });

    it('should select a range of items', () => {
      const selection = useChartSelection(10);
      selection.selectRange(2, 5);
      expect(selection.selectedIndices()).toEqual([2, 3, 4, 5]);
    });

    it('should handle reversed range selection', () => {
      const selection = useChartSelection(10);
      selection.selectRange(5, 2);
      expect(selection.selectedIndices()).toEqual([2, 3, 4, 5]);
    });

    it('should clear selection', () => {
      const selection = useChartSelection(10);
      selection.select(5);
      selection.clear();
      expect(selection.selectedIndices()).toEqual([]);
      expect(selection.lastSelectedIndex()).toBeUndefined();
    });

    it('should check if item is selected', () => {
      const selection = useChartSelection(10);
      selection.select(5);
      expect(selection.isSelected(5)).toBe(true);
      expect(selection.isSelected(3)).toBe(false);
    });
  });

  describe('useChartHover', () => {
    it('should initialize with no hover', () => {
      const hover = useChartHover(10);
      expect(hover.hoveredIndex()).toBeUndefined();
      expect(hover.position()).toBeUndefined();
    });

    it('should set hovered index', () => {
      const hover = useChartHover(10);
      hover.hover(5);
      expect(hover.hoveredIndex()).toBe(5);
    });

    it('should set position when provided', () => {
      const hover = useChartHover(10);
      hover.hover(5, { x: 100, y: 200 });
      expect(hover.position()).toEqual({ x: 100, y: 200 });
    });

    it('should ignore out of range indices', () => {
      const hover = useChartHover(10);
      hover.hover(-1);
      hover.hover(15);
      expect(hover.hoveredIndex()).toBeUndefined();
    });

    it('should clear hover on unhover', () => {
      const hover = useChartHover(10);
      hover.hover(5, { x: 100, y: 200 });
      hover.unhover();
      expect(hover.hoveredIndex()).toBeUndefined();
      expect(hover.position()).toBeUndefined();
    });
  });

  describe('useChartTooltip', () => {
    it('should initialize hidden', () => {
      const tooltip = useChartTooltip();
      expect(tooltip.visible()).toBe(false);
      expect(tooltip.content()).toBe('');
    });

    it('should show tooltip with content and position', () => {
      const tooltip = useChartTooltip();
      tooltip.show('Value: 42', { x: 10, y: 20 });
      expect(tooltip.visible()).toBe(true);
      expect(tooltip.content()).toBe('Value: 42');
      expect(tooltip.position()).toEqual({ x: 10, y: 20 });
    });

    it('should hide tooltip', () => {
      const tooltip = useChartTooltip();
      tooltip.show('Value: 42', { x: 10, y: 20 });
      tooltip.hide();
      expect(tooltip.visible()).toBe(false);
    });
  });

  describe('useChartZoom', () => {
    it('should initialize with default level', () => {
      const zoom = useChartZoom();
      expect(zoom.level()).toBe(1);
      expect(zoom.panX()).toBe(0);
      expect(zoom.panY()).toBe(0);
    });

    it('should initialize with custom level', () => {
      const zoom = useChartZoom(2);
      expect(zoom.level()).toBe(2);
    });

    it('should zoom to specific level', () => {
      const zoom = useChartZoom();
      zoom.zoom(1.5);
      expect(zoom.level()).toBe(1.5);
    });

    it('should clamp zoom to min/max', () => {
      const zoom = useChartZoom();
      zoom.zoom(0.01); // Below min
      expect(zoom.level()).toBe(0.1);
      zoom.zoom(10); // Above max
      expect(zoom.level()).toBe(5);
    });

    it('should zoom in by factor', () => {
      const zoom = useChartZoom();
      zoom.zoomIn(1.5);
      expect(zoom.level()).toBe(1.5);
    });

    it('should zoom out by factor', () => {
      const zoom = useChartZoom(2);
      zoom.zoomOut(0.5);
      expect(zoom.level()).toBe(1);
    });

    it('should pan by delta', () => {
      const zoom = useChartZoom();
      zoom.pan(10, 20);
      expect(zoom.panX()).toBe(10);
      expect(zoom.panY()).toBe(20);
    });

    it('should accumulate pan deltas', () => {
      const zoom = useChartZoom();
      zoom.pan(10, 20);
      zoom.pan(5, 10);
      expect(zoom.panX()).toBe(15);
      expect(zoom.panY()).toBe(30);
    });

    it('should reset zoom and pan', () => {
      const zoom = useChartZoom(1);
      zoom.zoom(2);
      zoom.pan(100, 200);
      zoom.reset();
      expect(zoom.level()).toBe(1);
      expect(zoom.panX()).toBe(0);
      expect(zoom.panY()).toBe(0);
    });
  });

  describe('useChartKeyboard', () => {
    it('should initialize at index 0', () => {
      const keyboard = useChartKeyboard(10);
      expect(keyboard.currentIndex()).toBe(0);
      expect(keyboard.isNavigating()).toBe(false);
    });

    it('should navigate down', () => {
      const keyboard = useChartKeyboard(10);
      keyboard.navigate('down');
      expect(keyboard.currentIndex()).toBe(1);
      expect(keyboard.isNavigating()).toBe(true);
    });

    it('should navigate up', () => {
      const keyboard = useChartKeyboard(10);
      keyboard.navigate('down');
      keyboard.navigate('down');
      keyboard.navigate('up');
      expect(keyboard.currentIndex()).toBe(1);
    });

    it('should not go below 0', () => {
      const keyboard = useChartKeyboard(10);
      keyboard.navigate('up');
      expect(keyboard.currentIndex()).toBe(0);
    });

    it('should not go above max', () => {
      const keyboard = useChartKeyboard(3);
      keyboard.navigate('down');
      keyboard.navigate('down');
      keyboard.navigate('down');
      keyboard.navigate('down');
      expect(keyboard.currentIndex()).toBe(2);
    });

    it('should navigate to first', () => {
      const keyboard = useChartKeyboard(10);
      keyboard.navigate('down');
      keyboard.navigate('down');
      keyboard.navigate('first');
      expect(keyboard.currentIndex()).toBe(0);
    });

    it('should navigate to last', () => {
      const keyboard = useChartKeyboard(10);
      keyboard.navigate('last');
      expect(keyboard.currentIndex()).toBe(9);
    });

    it('should call onNavigate callback', () => {
      const onNavigate = vi.fn();
      const keyboard = useChartKeyboard(10, undefined, onNavigate);
      keyboard.navigate('down');
      expect(onNavigate).toHaveBeenCalledWith(1);
    });

    it('should call onSelect callback', () => {
      const onSelect = vi.fn();
      const keyboard = useChartKeyboard(10, onSelect);
      keyboard.navigate('down');
      keyboard.selectCurrent();
      expect(onSelect).toHaveBeenCalledWith(1);
    });
  });

  describe('useChartInteraction', () => {
    it('should combine all interaction hooks', () => {
      const interaction = useChartInteraction(10);

      expect(interaction.state).toBeDefined();
      expect(interaction.select).toBeDefined();
      expect(interaction.hoverPoint).toBeDefined();
      expect(interaction.unhover).toBeDefined();
      expect(interaction.navigateUp).toBeDefined();
      expect(interaction.navigateDown).toBeDefined();
    });

    it('should handle selection', () => {
      const interaction = useChartInteraction(10, { multiSelect: false });
      interaction.select(5);
      expect(interaction.isSelected(5)).toBe(true);
    });

    it('should handle range selection', () => {
      const interaction = useChartInteraction(10);
      interaction.selectRange(2, 5);
      expect(interaction.isSelected(3)).toBe(true);
    });

    it('should clear selection', () => {
      const interaction = useChartInteraction(10);
      interaction.select(5);
      interaction.clearSelection();
      expect(interaction.isSelected(5)).toBe(false);
    });

    it('should handle hover', () => {
      const interaction = useChartInteraction(10);
      interaction.hoverPoint(3, { x: 10, y: 20 });
      expect(interaction.hoveredIndex()).toBe(3);
    });

    it('should handle unhover', () => {
      const interaction = useChartInteraction(10);
      interaction.hoverPoint(3);
      interaction.unhover();
      expect(interaction.hoveredIndex()).toBeUndefined();
    });

    it('should handle tooltip when enabled', () => {
      const interaction = useChartInteraction(10, { withTooltip: true });
      interaction.showTooltip?.('Test', { x: 0, y: 0 });
      expect(interaction.state().tooltip?.visible).toBe(true);
    });

    it('should handle zoom when enabled', () => {
      const interaction = useChartInteraction(10, { withZoom: true });
      interaction.zoomIn?.(1.5);
      expect(interaction.state().zoom?.level).toBe(1.5);
    });

    it('should handle keyboard navigation', () => {
      const interaction = useChartInteraction(10, { withKeyboard: true });
      interaction.navigateDown();
      interaction.navigateDown();
      // State should reflect navigation
      expect(interaction.state()).toBeDefined();
    });

    it('should handle focus and blur', () => {
      const interaction = useChartInteraction(10);
      expect(interaction.isFocused()).toBe(false);
      interaction.focus();
      expect(interaction.isFocused()).toBe(true);
      interaction.blur();
      expect(interaction.isFocused()).toBe(false);
    });

    it('should work without optional features', () => {
      const interaction = useChartInteraction(10, {
        withTooltip: false,
        withZoom: false,
        withKeyboard: false,
      });

      expect(interaction.showTooltip).toBeUndefined();
      expect(interaction.zoomIn).toBeUndefined();
    });
  });

  describe('useChartDataChange', () => {
    it('should initialize with empty changed indices', () => {
      const dataChange = useChartDataChange([1, 2, 3]);
      expect(dataChange.changedIndices()).toEqual([]);
    });

    it('should detect changed indices', () => {
      const dataChange = useChartDataChange([1, 2, 3]);
      dataChange.updateChangedIndices([1, 5, 3]); // Index 1 changed
      expect(dataChange.changedIndices()).toContain(1);
    });

    it('should detect multiple changes', () => {
      const dataChange = useChartDataChange([1, 2, 3, 4]);
      dataChange.updateChangedIndices([9, 9, 9, 9]);
      expect(dataChange.changedIndices()).toEqual([0, 1, 2, 3]);
    });

    it('should check if specific index changed', () => {
      const dataChange = useChartDataChange([1, 2, 3]);
      dataChange.updateChangedIndices([1, 5, 3]);
      expect(dataChange.hasChanged(1)).toBe(true);
      expect(dataChange.hasChanged(0)).toBe(false);
    });

    it('should call onDataChange callback', () => {
      const onDataChange = vi.fn();
      const dataChange = useChartDataChange([1, 2, 3], onDataChange);
      dataChange.updateChangedIndices([1, 5, 3]);
      expect(onDataChange).toHaveBeenCalledWith([1]);
    });

    it('should handle length changes', () => {
      const dataChange = useChartDataChange([1, 2, 3]);
      dataChange.updateChangedIndices([1, 2]); // One element removed
      expect(dataChange.changedIndices()).toContain(2);
    });
  });
});
