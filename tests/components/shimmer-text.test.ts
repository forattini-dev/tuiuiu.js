/**
 * ShimmerText Tests
 *
 * Tests for animated shimmer text rendering, reduced motion,
 * active/inactive states, and start time reset.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from '../../src/core/renderer.js';
import { setRenderMode } from '../../src/core/capabilities.js';
import { ShimmerText, resetShimmerStartTime } from '../../src/atoms/shimmer-text.js';
import { setTickValue, resetTick } from '../../src/core/tick.js';
import * as motionRuntime from '../../src/core/motion-runtime.js';

describe('ShimmerText', () => {
  beforeEach(() => {
    setRenderMode('unicode');
    resetTick();
    resetShimmerStartTime();
    // Ensure reduced motion is off by default
    motionRuntime.setPrefersReducedMotion(false);
  });

  afterEach(() => {
    motionRuntime.setPrefersReducedMotion(false);
  });

  it('renders text content', () => {
    const node = ShimmerText({ text: 'Loading...' });
    expect(node).not.toBeNull();
    // Active shimmer renders each char as individual Text node in a row Box
    expect(node!.type).toBe('box');
    expect(node!.children.length).toBe('Loading...'.length);
    // Each child is a Text node with one character
    const chars = node!.children.map((c: any) => c.props?.children ?? '').join('');
    expect(chars).toBe('Loading...');
  });

  it('renders one node per Unicode grapheme without replacement characters', () => {
    const node = ShimmerText({ text: 'A👩‍💻界' });
    expect(node.type).toBe('box');
    expect(node.children).toHaveLength(3);

    const output = renderToString(node, 20);
    expect(output).toContain('A👩‍💻界');
    expect(output).not.toContain('\uFFFD');
  });

  it('returns a Box with individual character Text nodes when active', () => {
    const node = ShimmerText({ text: 'ABC' });
    expect(node).not.toBeNull();
    // Active shimmer renders each char separately in a Box
    expect(node!.type).toBe('box');
    expect(node!.children.length).toBe(3);
    // Each child should be a text node with one character
    expect(node!.children[0]!.type).toBe('text');
    expect(node!.children[1]!.type).toBe('text');
    expect(node!.children[2]!.type).toBe('text');
  });

  it('renders static text when active=false', () => {
    const node = ShimmerText({ text: 'Hello', active: false });
    expect(node).not.toBeNull();
    // Inactive: returns a single Text node, not per-character
    expect(node!.type).toBe('text');
    const output = renderToString(node!, 40);
    expect(output).toContain('Hello');
  });

  it('renders static text when reducedMotion is enabled', () => {
    motionRuntime.setPrefersReducedMotion(true);

    const node = ShimmerText({ text: 'Thinking' });
    expect(node).not.toBeNull();
    // Should be a single Text node (static), not per-character
    expect(node!.type).toBe('text');
    const output = renderToString(node!, 40);
    expect(output).toContain('Thinking');
  });

  it('renders empty text without crashing', () => {
    const node = ShimmerText({ text: '' });
    expect(node).not.toBeNull();
    // Empty text produces a Text node
    expect(node!.type).toBe('text');
  });

  it('changes shimmer position based on tick', () => {
    // At tick 0, focal point is at position 0
    setTickValue(0);
    const node1 = ShimmerText({ text: 'ABCDE', speed: 1, width: 1 });
    expect(node1).not.toBeNull();
    expect(node1!.type).toBe('box');

    // Capture colors at tick 0
    const colorAtTick0 = node1!.children[0]!.props.color;

    // At tick 2, focal point moves
    setTickValue(2);
    const node2 = ShimmerText({ text: 'ABCDE', speed: 1, width: 1 });
    expect(node2).not.toBeNull();
    expect(node2!.type).toBe('box');

    // At tick 2, the first char may no longer be highlighted
    // (focal point moved to position 2)
    const colorAtTick2 = node2!.children[0]!.props.color;
    // The colors should differ — the shimmer moved
    const colorAtTick2FocalPoint = node2!.children[2]!.props.color;
    expect(colorAtTick2FocalPoint).not.toBe(colorAtTick2);
  });

  it('respects speed parameter (slower wave)', () => {
    setTickValue(0);
    const fast = ShimmerText({ text: 'ABCDE', speed: 1 });
    setTickValue(0);
    const slow = ShimmerText({ text: 'ABCDE', speed: 3 });

    // Both should render but with different position calculations
    expect(fast).not.toBeNull();
    expect(slow).not.toBeNull();
    expect(fast!.type).toBe('box');
    expect(slow!.type).toBe('box');
  });

  it('respects custom shimmer width', () => {
    setTickValue(0);
    // With width=1, only 1 char is highlighted at focal point
    const narrow = ShimmerText({ text: 'ABCDEF', speed: 1, width: 1 });
    expect(narrow).not.toBeNull();
    expect(narrow!.type).toBe('box');

    // With width=6, all chars within width distance are highlighted
    const wide = ShimmerText({ text: 'ABCDEF', speed: 1, width: 6 });
    expect(wide).not.toBeNull();
    expect(wide!.type).toBe('box');
  });

  it('uses custom base color and shimmer color', () => {
    setTickValue(0);
    const node = ShimmerText({
      text: 'AB',
      color: 'red',
      shimmerColor: 'blue',
      width: 1,
    });
    expect(node).not.toBeNull();
    expect(node!.type).toBe('box');
    // At tick 0, focal point is at 0 — char 0 should use shimmerColor
    expect(node!.children[0]!.props.color).toBe('blue');
    // Char 1 is far from focal point — should use base color
    expect(node!.children[1]!.props.color).toBe('red');
  });

  it('resetShimmerStartTime resets the timer', () => {
    // First call sets internal _shimmerStartTime
    ShimmerText({ text: 'Test' });

    // Reset it
    resetShimmerStartTime();

    // After reset, next call should set a new start time
    // (no crash, just verifying it does not throw)
    const node = ShimmerText({ text: 'Test' });
    expect(node).not.toBeNull();
  });

  it('shifts to stall color after threshold', () => {
    // Set start time in the past (more than stallThreshold ago)
    const pastTime = Date.now() - 15000; // 15 seconds ago
    const node = ShimmerText({
      text: 'AB',
      startTime: pastTime,
      stallThreshold: 10000,
      stallColor: 'yellow',
      shimmerColor: 'cyan',
      width: 3,
    });
    expect(node).not.toBeNull();
    expect(node!.type).toBe('box');
    // At stall, highlighted chars should use stallColor instead of shimmerColor
    // Since width=3 and focal is at 0, char 0 should be highlighted with stallColor
    expect(node!.children[0]!.props.color).toBe('yellow');
  });

  it('uses shimmer color before stall threshold', () => {
    const recentTime = Date.now() - 1000; // 1 second ago
    const node = ShimmerText({
      text: 'AB',
      startTime: recentTime,
      stallThreshold: 10000,
      stallColor: 'yellow',
      shimmerColor: 'cyan',
      width: 3,
    });
    expect(node).not.toBeNull();
    expect(node!.type).toBe('box');
    expect(node!.children[0]!.props.color).toBe('cyan');
  });
});
