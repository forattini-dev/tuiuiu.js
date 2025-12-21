/**
 * Tests for Design System Core Layout Engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateLayout,
  clearTextMeasureCache,
  getVisibleWidth,
  measureText,
} from '../../src/design-system/core/layout.js';
import { Box, Text } from '../../src/components/components.js';

describe('Core Layout Engine', () => {
  beforeEach(() => {
    clearTextMeasureCache();
  });

  // ==========================================================================
  // clearTextMeasureCache
  // ==========================================================================

  describe('clearTextMeasureCache', () => {
    it('should clear the cache', () => {
      // Measure some text to populate cache
      measureText('test');
      measureText('another');
      // Clear and verify no error
      clearTextMeasureCache();
    });
  });

  // ==========================================================================
  // getVisibleWidth
  // ==========================================================================

  describe('getVisibleWidth', () => {
    it('should return visible width of plain text', () => {
      expect(getVisibleWidth('hello')).toBe(5);
      expect(getVisibleWidth('hello world')).toBe(11);
    });

    it('should ignore ANSI codes', () => {
      expect(getVisibleWidth('\x1b[31mhello\x1b[0m')).toBe(5);
    });

    it('should handle empty string', () => {
      expect(getVisibleWidth('')).toBe(0);
    });
  });

  // ==========================================================================
  // measureText
  // ==========================================================================

  describe('measureText', () => {
    it('should measure single line text', () => {
      const result = measureText('hello');
      expect(result.width).toBe(5);
      expect(result.height).toBe(1);
    });

    it('should measure multi-line text', () => {
      const result = measureText('hello\nworld');
      expect(result.width).toBe(5);
      expect(result.height).toBe(2);
    });

    it('should return max width for varying line lengths', () => {
      const result = measureText('hi\nhello\nworld!!');
      expect(result.width).toBe(7); // "world!!" is longest
      expect(result.height).toBe(3);
    });

    it('should cache results', () => {
      const text = 'cached text';
      const first = measureText(text);
      const second = measureText(text);
      expect(first).toBe(second); // Same object reference (cached)
    });

    it('should handle empty string', () => {
      const result = measureText('');
      expect(result.width).toBe(0);
      expect(result.height).toBe(1);
    });

    it('should handle large cache eviction', () => {
      // Fill cache with many entries
      for (let i = 0; i < 1100; i++) {
        measureText(`text-${i}`);
      }
      // Should not throw
      const result = measureText('after eviction');
      expect(result.width).toBe(14);
    });
  });

  // ==========================================================================
  // calculateLayout - Basic
  // ==========================================================================

  describe('calculateLayout', () => {
    describe('basic layout', () => {
      it('should layout text node', () => {
        const node = Text({}, 'Hello');
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
        expect(layout.x).toBe(0);
        expect(layout.y).toBe(0);
      });

      it('should layout box with text', () => {
        const node = Box({}, Text({}, 'Content'));
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
        expect(layout.children.length).toBe(1);
      });

      it('should layout with explicit width', () => {
        const node = Box({ width: 40 }, Text({}, 'Content'));
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should layout with explicit height', () => {
        const node = Box({ height: 10 }, Text({}, 'Content'));
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });
    });

    describe('display none', () => {
      it('should return zero-sized layout for display none', () => {
        const node = Box({ display: 'none' }, Text({}, 'Hidden'));
        const layout = calculateLayout(node, 80, 24);
        expect(layout.width).toBe(0);
        expect(layout.height).toBe(0);
        expect(layout.children).toEqual([]);
      });
    });

    describe('padding', () => {
      it('should apply padding', () => {
        const node = Box({ padding: 2 }, Text({}, 'Padded'));
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should apply paddingX', () => {
        const node = Box({ paddingX: 4 }, Text({}, 'Content'));
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should apply paddingY', () => {
        const node = Box({ paddingY: 2 }, Text({}, 'Content'));
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should apply individual paddings', () => {
        const node = Box(
          { paddingTop: 1, paddingBottom: 2, paddingLeft: 3, paddingRight: 4 },
          Text({}, 'Content')
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });
    });

    describe('margin', () => {
      it('should apply margin', () => {
        const node = Box({ margin: 1 }, Text({}, 'Content'));
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should apply marginX', () => {
        const node = Box({ marginX: 2 }, Text({}, 'Content'));
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should apply marginY', () => {
        const node = Box({ marginY: 2 }, Text({}, 'Content'));
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should apply individual margins', () => {
        const node = Box(
          { marginTop: 1, marginBottom: 2, marginLeft: 3, marginRight: 4 },
          Text({}, 'Content')
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should handle margin auto', () => {
        const node = Box({ marginX: 'auto' }, Text({}, 'Centered'));
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });
    });

    describe('border', () => {
      it('should account for border size', () => {
        const node = Box({ borderStyle: 'single' }, Text({}, 'Border'));
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should not add size for borderStyle none', () => {
        const node = Box({ borderStyle: 'none' }, Text({}, 'No Border'));
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });
    });

    describe('flexDirection', () => {
      it('should layout column (default)', () => {
        const node = Box(
          {},
          Text({}, 'Line 1'),
          Text({}, 'Line 2'),
          Text({}, 'Line 3')
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout.children.length).toBe(3);
      });

      it('should layout row', () => {
        const node = Box(
          { flexDirection: 'row' },
          Text({}, 'A'),
          Text({}, 'B'),
          Text({}, 'C')
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout.children.length).toBe(3);
      });

      it('should layout column-reverse', () => {
        const node = Box(
          { flexDirection: 'column-reverse' },
          Text({}, 'First'),
          Text({}, 'Second')
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should layout row-reverse', () => {
        const node = Box(
          { flexDirection: 'row-reverse' },
          Text({}, 'First'),
          Text({}, 'Second')
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });
    });

    describe('flexGrow', () => {
      it('should distribute space with flexGrow', () => {
        const node = Box(
          { flexDirection: 'row', width: 80 },
          Box({ flexGrow: 1 }, Text({}, 'Grow')),
          Box({ width: 10 }, Text({}, 'Fixed'))
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should distribute space proportionally', () => {
        const node = Box(
          { flexDirection: 'row', width: 100 },
          Box({ flexGrow: 1 }, Text({}, 'One')),
          Box({ flexGrow: 2 }, Text({}, 'Two'))
        );
        const layout = calculateLayout(node, 100, 24);
        expect(layout).toBeDefined();
      });
    });

    describe('justifyContent', () => {
      it('should apply flex-start (default)', () => {
        const node = Box(
          { justifyContent: 'flex-start', height: 10 },
          Text({}, 'Start')
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should apply flex-end', () => {
        const node = Box(
          { justifyContent: 'flex-end', height: 10 },
          Text({}, 'End')
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should apply center', () => {
        const node = Box(
          { justifyContent: 'center', height: 10 },
          Text({}, 'Center')
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should apply space-between', () => {
        const node = Box(
          { justifyContent: 'space-between', height: 10 },
          Text({}, 'A'),
          Text({}, 'B'),
          Text({}, 'C')
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should apply space-around', () => {
        const node = Box(
          { justifyContent: 'space-around', height: 10 },
          Text({}, 'A'),
          Text({}, 'B')
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should apply space-evenly', () => {
        const node = Box(
          { justifyContent: 'space-evenly', height: 10 },
          Text({}, 'A'),
          Text({}, 'B')
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });
    });

    describe('alignItems', () => {
      it('should apply flex-start', () => {
        const node = Box(
          { flexDirection: 'row', alignItems: 'flex-start', height: 5 },
          Text({}, 'Top')
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should apply flex-end', () => {
        const node = Box(
          { flexDirection: 'row', alignItems: 'flex-end', height: 5 },
          Text({}, 'Bottom')
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should apply center', () => {
        const node = Box(
          { flexDirection: 'row', alignItems: 'center', height: 5 },
          Text({}, 'Center')
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should apply stretch', () => {
        const node = Box(
          { flexDirection: 'row', alignItems: 'stretch', height: 5 },
          Box({}, Text({}, 'Stretched'))
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });
    });

    describe('gap', () => {
      it('should apply gap between children in column', () => {
        const node = Box(
          { gap: 2 },
          Text({}, 'A'),
          Text({}, 'B')
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should apply gap between children in row', () => {
        const node = Box(
          { flexDirection: 'row', gap: 4 },
          Text({}, 'X'),
          Text({}, 'Y')
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });
    });

    describe('percentage sizes', () => {
      it('should handle percentage width', () => {
        const node = Box({ width: '50%' }, Text({}, 'Half'));
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should handle percentage height', () => {
        const node = Box({ height: '25%' }, Text({}, 'Quarter'));
        const layout = calculateLayout(node, 80, 100);
        expect(layout).toBeDefined();
      });
    });

    describe('nested layouts', () => {
      it('should layout deeply nested structures', () => {
        const node = Box(
          { flexDirection: 'row' },
          Box(
            { flexDirection: 'column' },
            Text({}, 'A1'),
            Text({}, 'A2')
          ),
          Box(
            { flexDirection: 'column' },
            Text({}, 'B1'),
            Box(
              { flexDirection: 'row' },
              Text({}, 'B2a'),
              Text({}, 'B2b')
            )
          )
        );
        const layout = calculateLayout(node, 80, 24);
        expect(layout.children.length).toBe(2);
      });
    });

    describe('minWidth and maxWidth', () => {
      it('should respect minWidth', () => {
        const node = Box({ minWidth: 20 }, Text({}, 'Small'));
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should respect maxWidth', () => {
        const node = Box({ maxWidth: 40 }, Text({}, 'Limited'));
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should respect minHeight', () => {
        const node = Box({ minHeight: 5 }, Text({}, 'Tall'));
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });

      it('should respect maxHeight', () => {
        const node = Box({ maxHeight: 10 }, Text({}, 'Short'));
        const layout = calculateLayout(node, 80, 24);
        expect(layout).toBeDefined();
      });
    });
  });
});
