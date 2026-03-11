/**
 * Pixel-precision Hit Test Tests
 *
 * Tests for pixel-level mouse hit testing used with terminal images
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getHitTestRegistry,
  resetHitTestRegistry,
  registerHitTestFromLayout,
  hitTestAt,
} from '../../src/core/hit-test.js';
import { calculateLayout } from '../../src/core/layout.js';
import { Box, Text } from '../../src/primitives/index.js';
import type { VNode } from '../../src/utils/types.js';
import type { CellSize } from '../../src/core/graphics.js';

describe('Pixel Hit Test', () => {
  const cellSize: CellSize = { width: 10, height: 20 };

  beforeEach(() => {
    resetHitTestRegistry();
  });

  afterEach(() => {
    resetHitTestRegistry();
  });

  describe('pixelHitTest', () => {
    it('should convert pixel coords to cell coords and find element', () => {
      const onClick = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onClick },
        Text({}, 'Clickable'),
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();
      // Pixel (55, 30) => cell (5, 1) with cellSize 10x20
      const result = registry.pixelHitTest(55, 30, cellSize);

      expect(result).not.toBeNull();
      expect(result!.relativeX).toBe(5);
      expect(result!.relativeY).toBe(1);
      expect(result!.absoluteX).toBe(5);
      expect(result!.absoluteY).toBe(1);
    });

    it('should compute pixel-relative offsets within element', () => {
      const onClick = vi.fn();
      // Element starts at cell (0, 0)
      const node: VNode = Box(
        { width: 20, height: 5, onClick },
        Text({}, 'Clickable'),
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();
      // Pixel (55, 35) => cell (5, 1); element at (0,0) so pixelRelative = (55, 35)
      const result = registry.pixelHitTest(55, 35, cellSize);

      expect(result).not.toBeNull();
      expect(result!.pixelRelativeX).toBe(55);
      expect(result!.pixelRelativeY).toBe(35);
    });

    it('should return null when pixel coords are outside all elements', () => {
      const onClick = vi.fn();
      const node: VNode = Box(
        { width: 5, height: 2, onClick },
        Text({}, 'Small'),
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();
      // Pixel (600, 400) => cell (60, 20) which is outside a 5x2 element
      const result = registry.pixelHitTest(600, 400, cellSize);

      expect(result).toBeNull();
    });

    it('should handle pixel coords at cell boundaries', () => {
      const onClick = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onClick },
        Text({}, 'Clickable'),
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();
      // Pixel (0, 0) => cell (0, 0) - exact top-left corner
      const result = registry.pixelHitTest(0, 0, cellSize);

      expect(result).not.toBeNull();
      expect(result!.relativeX).toBe(0);
      expect(result!.relativeY).toBe(0);
      expect(result!.pixelRelativeX).toBe(0);
      expect(result!.pixelRelativeY).toBe(0);
    });

    it('should floor pixel-to-cell conversion', () => {
      const onClick = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onClick },
        Text({}, 'Clickable'),
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();
      // Pixel (9, 19) => cell (0, 0) with cellSize 10x20 (floors)
      const result = registry.pixelHitTest(9, 19, cellSize);

      expect(result).not.toBeNull();
      expect(result!.relativeX).toBe(0);
      expect(result!.relativeY).toBe(0);
      expect(result!.pixelRelativeX).toBe(9);
      expect(result!.pixelRelativeY).toBe(19);
    });

    it('should work with different cell sizes', () => {
      const onClick = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onClick },
        Text({}, 'Clickable'),
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();
      const largeCells: CellSize = { width: 16, height: 32 };
      // Pixel (32, 64) => cell (2, 2)
      const result = registry.pixelHitTest(32, 64, largeCells);

      expect(result).not.toBeNull();
      expect(result!.relativeX).toBe(2);
      expect(result!.relativeY).toBe(2);
      expect(result!.pixelRelativeX).toBe(32);
      expect(result!.pixelRelativeY).toBe(64);
    });
  });

  describe('regular hitTest unchanged', () => {
    it('should still work with cell coordinates', () => {
      const onClick = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onClick },
        Text({}, 'Clickable'),
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const result = hitTestAt(5, 2);

      expect(result).not.toBeNull();
      expect(result!.relativeX).toBe(5);
      expect(result!.relativeY).toBe(2);
      expect(result!.absoluteX).toBe(5);
      expect(result!.absoluteY).toBe(2);
      // Regular hitTest should NOT have pixel fields
      expect(result!.pixelRelativeX).toBeUndefined();
      expect(result!.pixelRelativeY).toBeUndefined();
    });

    it('should return null for misses', () => {
      const onClick = vi.fn();
      const node: VNode = Box(
        { width: 5, height: 2, onClick },
        Text({}, 'Small'),
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const result = hitTestAt(70, 20);
      expect(result).toBeNull();
    });
  });
});
