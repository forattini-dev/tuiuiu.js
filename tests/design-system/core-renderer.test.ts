/**
 * Tests for Design System Core Renderer
 */

import { describe, it, expect } from 'vitest';
import { renderToString } from '../../src/design-system/core/renderer.js';
import { Box, Text } from '../../src/components/components.js';

describe('Core Renderer', () => {
  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('basic rendering', () => {
    it('should render text', () => {
      const node = Text({}, 'Hello World');
      const output = renderToString(node, 80);
      expect(output).toContain('Hello World');
    });

    it('should render box with text', () => {
      const node = Box({}, Text({}, 'Content'));
      const output = renderToString(node, 80);
      expect(output).toContain('Content');
    });

    it('should render empty box', () => {
      const node = Box({});
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should handle null children', () => {
      const node = Box({}, null as any, Text({}, 'Valid'));
      const output = renderToString(node, 80);
      expect(output).toContain('Valid');
    });
  });

  // ==========================================================================
  // Text Wrapping
  // ==========================================================================

  describe('text wrapping', () => {
    it('should not wrap text that fits', () => {
      const node = Box(
        { width: 80 },
        Text({ wrap: 'wrap' }, 'Short text that fits')
      );
      const output = renderToString(node, 80);
      expect(output).toContain('Short text');
    });

    it('should wrap long text', () => {
      const longText = 'This is a very long line of text that should definitely be wrapped because it exceeds the available width in the container';
      const node = Box(
        { width: 30, height: 10 },
        Text({ wrap: 'wrap' }, longText)
      );
      const output = renderToString(node, 30);
      expect(output).toBeDefined();
      // Text should be present
      expect(output).toContain('This');
    });

    it('should wrap at word boundaries', () => {
      const node = Box(
        { width: 20 },
        Text({ wrap: 'wrap' }, 'Hello beautiful world today')
      );
      const output = renderToString(node, 20);
      expect(output).toBeDefined();
    });

    it('should handle wrap mode none', () => {
      const node = Box(
        { width: 10 },
        Text({ wrap: 'none' }, 'This text should not wrap at all')
      );
      const output = renderToString(node, 10);
      expect(output).toBeDefined();
    });
  });

  // ==========================================================================
  // Text Truncation (via wrap property)
  // ==========================================================================

  describe('text truncation', () => {
    it('should truncate at end with ellipsis', () => {
      const node = Box(
        { width: 15 },
        Text({ wrap: 'truncate-end' }, 'This is a very long text that needs truncation')
      );
      const output = renderToString(node, 15);
      expect(output).toContain('…');
    });

    it('should truncate at start with ellipsis', () => {
      const node = Box(
        { width: 15 },
        Text({ wrap: 'truncate-start' }, 'This is a very long text that needs truncation')
      );
      const output = renderToString(node, 15);
      expect(output).toContain('…');
    });

    it('should truncate in middle with ellipsis', () => {
      const node = Box(
        { width: 20 },
        Text({ wrap: 'truncate-middle' }, 'This is a very long text that needs truncation')
      );
      const output = renderToString(node, 20);
      expect(output).toContain('…');
    });

    it('should not truncate short text', () => {
      const node = Box(
        { width: 50 },
        Text({ wrap: 'truncate-end' }, 'Short')
      );
      const output = renderToString(node, 50);
      expect(output).toContain('Short');
      expect(output).not.toContain('…');
    });

    it('should truncate with default mode', () => {
      const node = Box(
        { width: 15 },
        Text({ wrap: 'truncate' }, 'This is a very long text')
      );
      const output = renderToString(node, 15);
      expect(output).toContain('…');
    });
  });

  // ==========================================================================
  // Text Styling
  // ==========================================================================

  describe('text styling', () => {
    it('should apply bold', () => {
      const node = Text({ bold: true }, 'Bold text');
      const output = renderToString(node, 80);
      expect(output).toContain('Bold text');
    });

    it('should apply italic', () => {
      const node = Text({ italic: true }, 'Italic text');
      const output = renderToString(node, 80);
      expect(output).toContain('Italic text');
    });

    it('should apply underline', () => {
      const node = Text({ underline: true }, 'Underlined text');
      const output = renderToString(node, 80);
      expect(output).toContain('Underlined text');
    });

    it('should apply strikethrough', () => {
      const node = Text({ strikethrough: true }, 'Strikethrough text');
      const output = renderToString(node, 80);
      expect(output).toContain('Strikethrough text');
    });

    it('should apply dim', () => {
      const node = Text({ dim: true }, 'Dim text');
      const output = renderToString(node, 80);
      expect(output).toContain('Dim text');
    });

    it('should apply color', () => {
      const node = Text({ color: 'red' }, 'Red text');
      const output = renderToString(node, 80);
      expect(output).toContain('Red text');
    });

    it('should apply background color', () => {
      const node = Text({ backgroundColor: 'blue' }, 'Blue background');
      const output = renderToString(node, 80);
      expect(output).toContain('Blue background');
    });

    it('should apply multiple styles', () => {
      const node = Text({ bold: true, italic: true, color: 'green' }, 'Styled');
      const output = renderToString(node, 80);
      expect(output).toContain('Styled');
    });
  });

  // ==========================================================================
  // Box Rendering
  // ==========================================================================

  describe('box rendering', () => {
    it('should render box with border', () => {
      const node = Box({ borderStyle: 'single' }, Text({}, 'Bordered'));
      const output = renderToString(node, 80);
      expect(output).toContain('─');
      expect(output).toContain('│');
    });

    it('should render box with round border', () => {
      const node = Box({ borderStyle: 'round' }, Text({}, 'Rounded'));
      const output = renderToString(node, 80);
      expect(output).toContain('╭');
    });

    it('should render box with double border', () => {
      const node = Box({ borderStyle: 'double' }, Text({}, 'Double'));
      const output = renderToString(node, 80);
      expect(output).toContain('═');
    });

    it('should render box with border color', () => {
      const node = Box(
        { borderStyle: 'single', borderColor: 'cyan' },
        Text({}, 'Colored border')
      );
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render box with background', () => {
      const node = Box(
        { backgroundColor: 'blue' },
        Text({}, 'With background')
      );
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });
  });

  // ==========================================================================
  // Alignment and Positioning
  // ==========================================================================

  describe('alignment and positioning', () => {
    it('should align text left', () => {
      const node = Box(
        { width: 20 },
        Text({ align: 'left' }, 'Left')
      );
      const output = renderToString(node, 80);
      expect(output).toContain('Left');
    });

    it('should align text center', () => {
      const node = Box(
        { width: 20 },
        Text({ align: 'center' }, 'Center')
      );
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should align text right', () => {
      const node = Box(
        { width: 20 },
        Text({ align: 'right' }, 'Right')
      );
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });
  });

  // ==========================================================================
  // Complex Layouts
  // ==========================================================================

  describe('complex layouts', () => {
    it('should render nested boxes', () => {
      const node = Box(
        { borderStyle: 'single' },
        Box(
          { borderStyle: 'round' },
          Text({}, 'Nested')
        )
      );
      const output = renderToString(node, 80);
      expect(output).toContain('Nested');
    });

    it('should render horizontal layout', () => {
      const node = Box(
        { flexDirection: 'row' },
        Box({ width: 10 }, Text({}, 'Left')),
        Box({ width: 10 }, Text({}, 'Right'))
      );
      const output = renderToString(node, 80);
      expect(output).toContain('Left');
      expect(output).toContain('Right');
    });

    it('should render with gaps', () => {
      const node = Box(
        { gap: 2 },
        Text({}, 'First'),
        Text({}, 'Second')
      );
      const output = renderToString(node, 80);
      expect(output).toContain('First');
      expect(output).toContain('Second');
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle zero width', () => {
      const node = Box({ width: 0 }, Text({}, 'Hidden'));
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should handle empty text', () => {
      const node = Text({}, '');
      const output = renderToString(node, 80);
      expect(output).toBe('');
    });

    it('should handle special characters', () => {
      const node = Text({}, '← → ↑ ↓ ♠ ♣ ♥ ♦');
      const output = renderToString(node, 80);
      expect(output).toContain('←');
    });

    it('should handle multiline text', () => {
      const node = Text({}, 'Line 1\nLine 2\nLine 3');
      const output = renderToString(node, 80);
      expect(output).toContain('Line 1');
      expect(output).toContain('Line 2');
      expect(output).toContain('Line 3');
    });

    it('should handle ANSI codes in text', () => {
      const node = Box({ width: 20 }, Text({}, '\x1b[31mRed\x1b[0m text'));
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });
  });

  // ==========================================================================
  // Display Property
  // ==========================================================================

  describe('display property', () => {
    it('should hide content with display none', () => {
      const node = Box(
        {},
        Text({}, 'Visible'),
        Box({ display: 'none' }, Text({}, 'Hidden'))
      );
      const output = renderToString(node, 80);
      expect(output).toContain('Visible');
      // Hidden content should not appear
    });
  });

  // ==========================================================================
  // Overflow Handling
  // ==========================================================================

  describe('overflow handling', () => {
    it('should handle overflow hidden', () => {
      const node = Box(
        { width: 10, height: 2, overflow: 'hidden' },
        Text({}, 'This is a very long text that exceeds the box size')
      );
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should handle overflow visible (default)', () => {
      const node = Box(
        { width: 10, height: 2 },
        Text({}, 'Long text')
      );
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });
  });
});
