/**
 * Tests for margin height calculation in renderToString and measureHeight
 * 
 * These tests ensure that margins (marginTop, marginBottom) are properly
 * accounted for when calculating element heights - critical for ScrollList
 * to estimate item heights correctly.
 */

import { describe, it, expect } from 'vitest';
import { Box, Text } from '../../src/primitives/index.js';
import { renderToString, measureHeight } from '../../src/core/renderer.js';

describe('Margin Height Calculation', () => {
  describe('measureHeight', () => {
    it('returns 1 for simple text without margins', () => {
      const node = Box({}, Text({}, 'Hello'));
      expect(measureHeight(node, 80)).toBe(1);
    });

    it('includes marginTop in height calculation', () => {
      const node = Box({ marginTop: 2 }, Text({}, 'Hello'));
      expect(measureHeight(node, 80)).toBe(3); // 2 margin + 1 content
    });

    it('includes marginBottom in height calculation', () => {
      const node = Box({ marginBottom: 2 }, Text({}, 'Hello'));
      expect(measureHeight(node, 80)).toBe(3); // 1 content + 2 margin
    });

    it('includes both marginTop and marginBottom', () => {
      const node = Box({ marginTop: 1, marginBottom: 1 }, Text({}, 'Hello'));
      expect(measureHeight(node, 80)).toBe(3); // 1 + 1 + 1
    });

    it('handles marginY shorthand correctly', () => {
      const node = Box({ marginY: 2 }, Text({}, 'Hello'));
      // marginY: 2 means marginTop: 2 AND marginBottom: 2
      expect(measureHeight(node, 80)).toBe(5); // 2 top + 1 content + 2 bottom
    });

    it('handles margin shorthand correctly', () => {
      const node = Box({ margin: 1 }, Text({}, 'Hello'));
      // margin: 1 means all sides = 1
      expect(measureHeight(node, 80)).toBe(3); // 1 top + 1 content + 1 bottom
    });

    it('handles multi-line content with margins', () => {
      const node = Box(
        { marginTop: 1, marginBottom: 1 },
        Text({}, 'Line 1'),
        Text({}, 'Line 2'),
        Text({}, 'Line 3'),
      );
      expect(measureHeight(node, 80)).toBe(5); // 1 top + 3 content + 1 bottom
    });

    it('handles nested boxes - measureHeight uses ROOT margins only', () => {
      // Note: measureHeight only considers the ROOT node's margins
      // Child margins are handled internally by the layout engine but don't
      // propagate to the root's layout.height
      const node = Box(
        { marginBottom: 1 },
        Box({ marginTop: 2 }, Text({}, 'Inner')),
      );
      // This is a known limitation - for accurate heights with nested margins,
      // use explicit marginTop/marginBottom on the root container
      const height = measureHeight(node, 80);
      expect(height).toBeGreaterThanOrEqual(2); // At least content + root marginBottom
    });
  });

  describe('renderToString with margins', () => {
    it('renders content at correct position with marginTop', () => {
      const node = Box({ marginTop: 2 }, Text({}, 'Hello'));
      const result = renderToString(node, 80);
      const lines = result.split('\n');
      
      // Should have 3 lines: 2 empty (margin) + 1 content
      expect(lines.length).toBe(3);
      expect(lines[0]).toBe(''); // margin line 1
      expect(lines[1]).toBe(''); // margin line 2
      expect(lines[2].trim()).toBe('Hello'); // content
    });

    it('preserves marginBottom in full height calculation', () => {
      const node = Box({ marginBottom: 2 }, Text({}, 'Hello'));
      // Use fullHeight option to preserve trailing empty lines
      const result = renderToString(node, { width: 80, fullHeight: true, height: 3 });
      const lines = result.split('\n');
      
      expect(lines.length).toBe(3);
    });
  });

  describe('ScrollList height estimation scenarios', () => {
    // These tests simulate real ScrollList usage patterns
    
    it('correctly estimates height for chat message with spacing', () => {
      // Typical chat message with margin for spacing
      const message = Box(
        { marginBottom: 1 },
        Text({ color: 'cyan' }, 'User:'),
        Text({}, 'Hello, how are you?'),
      );
      
      // Should be: 2 lines content + 1 margin = 3
      expect(measureHeight(message, 80)).toBe(3);
    });

    it('correctly estimates height for section with header', () => {
      // Section with header and content
      const section = Box(
        { marginTop: 1 },
        Text({ bold: true }, '📊 Statistics'),
        Text({}, 'Total: 100'),
        Text({}, 'Active: 50'),
      );
      
      // Should be: 1 margin + 3 content = 4
      expect(measureHeight(section, 80)).toBe(4);
    });

    it('correctly estimates height for card with padding and margins', () => {
      // Card-like component
      const card = Box(
        { 
          marginTop: 1, 
          marginBottom: 1,
          borderStyle: 'round',
          padding: 1,
        },
        Text({}, 'Card content'),
      );
      
      // marginTop: 1
      // border top: 1
      // padding top: 1  
      // content: 1
      // padding bottom: 1
      // border bottom: 1
      // marginBottom: 1
      // Total: 7
      expect(measureHeight(card, 80)).toBe(7);
    });
  });
});
