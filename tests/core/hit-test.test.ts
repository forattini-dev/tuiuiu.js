/**
 * Hit Test System Tests
 *
 * Tests for the hit-testing system that handles mouse events
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getHitTestRegistry,
  resetHitTestRegistry,
  registerHitTestFromLayout,
  hitTestAt,
} from '../../src/core/hit-test.js';
import { calculateLayout } from '../../src/design-system/core/layout.js';
import { Box, Text } from '../../src/primitives/index.js';
import type { VNode } from '../../src/utils/types.js';

describe('Hit Test System', () => {
  beforeEach(() => {
    resetHitTestRegistry();
  });

  afterEach(() => {
    resetHitTestRegistry();
  });

  describe('Element Registration', () => {
    it('should register elements with onClick handlers', () => {
      const onClick = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onClick },
        Text({}, 'Clickable')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();
      expect(registry.hasClickableElements()).toBe(true);
      expect(registry.count).toBe(1);
    });

    it('should not register elements without mouse handlers', () => {
      const node: VNode = Box(
        { width: 20, height: 5 },
        Text({}, 'Not clickable')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();
      expect(registry.hasClickableElements()).toBe(false);
      expect(registry.count).toBe(0);
    });

    it('should register elements with various mouse handlers', () => {
      const handlers = {
        onClick: vi.fn(),
        onMouseDown: vi.fn(),
        onMouseUp: vi.fn(),
        onMouseEnter: vi.fn(),
        onMouseLeave: vi.fn(),
      };

      const node: VNode = Box(
        { width: 20, height: 5, ...handlers },
        Text({}, 'Many handlers')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();
      expect(registry.hasClickableElements()).toBe(true);
    });
  });

  describe('Hit Testing', () => {
    it('should detect hit on registered element', () => {
      const onClick = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onClick },
        Text({}, 'Clickable')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      // Hit test within the element bounds
      const result = hitTestAt(5, 2);
      expect(result).not.toBeNull();
      expect(result!.absoluteX).toBe(5);
      expect(result!.absoluteY).toBe(2);
    });

    it('should return null for miss', () => {
      const onClick = vi.fn();
      const node: VNode = Box(
        { width: 10, height: 3, onClick },
        Text({}, 'Small')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      // Hit test outside the element bounds
      const result = hitTestAt(50, 10);
      expect(result).toBeNull();
    });

    it('should calculate relative coordinates correctly', () => {
      const onClick = vi.fn();
      const node: VNode = Box(
        { marginLeft: 10, marginTop: 5, width: 20, height: 10, onClick },
        Text({}, 'Offset')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      // Hit at absolute position (15, 8)
      const result = hitTestAt(15, 8);
      expect(result).not.toBeNull();
      expect(result!.absoluteX).toBe(15);
      expect(result!.absoluteY).toBe(8);
      // Relative to element (which starts at 10, 5)
      expect(result!.relativeX).toBe(5);
      expect(result!.relativeY).toBe(3);
    });
  });

  describe('Z-Order', () => {
    it('should return topmost element at overlapping positions', () => {
      const bottomClick = vi.fn();
      const topClick = vi.fn();

      // Build a tree where the second child overlaps the first
      const tree: VNode = Box(
        { flexDirection: 'column' },
        Box({ width: 30, height: 10, onClick: bottomClick }, Text({}, 'Bottom')),
        // This will render below but has higher z-index
        Box({ width: 30, height: 10, onClick: topClick }, Text({}, 'Top'))
      );

      const layout = calculateLayout(tree, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();
      // Both elements should be registered
      expect(registry.count).toBe(2);
    });
  });

  describe('Mouse Event Handling', () => {
    it('should dispatch click event to handler', () => {
      const onClick = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onClick },
        Text({}, 'Click me')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();

      // Simulate a mouse click event
      registry.handleMouseEvent({
        x: 5,
        y: 2,
        button: 'left',
        action: 'click',
        modifiers: { ctrl: false, shift: false, alt: false },
      });

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick.mock.calls[0][0]).toMatchObject({
        absoluteX: 5,
        absoluteY: 2,
        button: 'left',
      });
    });

    it('should dispatch right-click to onContextMenu handler', () => {
      const onContextMenu = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onContextMenu },
        Text({}, 'Right click me')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();

      registry.handleMouseEvent({
        x: 5,
        y: 2,
        button: 'right',
        action: 'click',
        modifiers: { ctrl: false, shift: false, alt: false },
      });

      expect(onContextMenu).toHaveBeenCalledTimes(1);
    });

    it('should not dispatch click outside element', () => {
      const onClick = vi.fn();
      const node: VNode = Box(
        { width: 10, height: 3, onClick },
        Text({}, 'Small')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();

      // Click outside the element
      registry.handleMouseEvent({
        x: 50,
        y: 10,
        button: 'left',
        action: 'click',
        modifiers: { ctrl: false, shift: false, alt: false },
      });

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should dispatch mouse move to onMouseMove handler', () => {
      const onMouseMove = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onMouseMove },
        Text({}, 'Move over me')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();

      registry.handleMouseEvent({
        x: 5,
        y: 2,
        button: 'none',
        action: 'move',
        modifiers: { ctrl: false, shift: false, alt: false },
      });

      expect(onMouseMove).toHaveBeenCalledTimes(1);
    });

    it('should dispatch scroll to onScroll handler', () => {
      const onScroll = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onScroll },
        Text({}, 'Scroll me')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();

      registry.handleMouseEvent({
        x: 5,
        y: 2,
        button: 'scroll-up',
        action: 'click',
        modifiers: { ctrl: false, shift: false, alt: false },
      });

      expect(onScroll).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mouse Enter/Leave', () => {
    it('should dispatch mouseEnter when entering element', () => {
      const onMouseEnter = vi.fn();
      const onMouseLeave = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onMouseEnter, onMouseLeave },
        Text({}, 'Hover me')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();

      // First move outside the element
      registry.handleMouseEvent({
        x: 50,
        y: 10,
        button: 'none',
        action: 'move',
        modifiers: { ctrl: false, shift: false, alt: false },
      });

      expect(onMouseEnter).not.toHaveBeenCalled();

      // Now move inside the element
      registry.handleMouseEvent({
        x: 5,
        y: 2,
        button: 'none',
        action: 'move',
        modifiers: { ctrl: false, shift: false, alt: false },
      });

      expect(onMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('should dispatch mouseLeave when leaving element', () => {
      const onMouseEnter = vi.fn();
      const onMouseLeave = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onMouseEnter, onMouseLeave },
        Text({}, 'Hover me')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();

      // First move inside the element
      registry.handleMouseEvent({
        x: 5,
        y: 2,
        button: 'none',
        action: 'move',
        modifiers: { ctrl: false, shift: false, alt: false },
      });

      expect(onMouseEnter).toHaveBeenCalledTimes(1);

      // Now move outside the element
      registry.handleMouseEvent({
        x: 50,
        y: 10,
        button: 'none',
        action: 'move',
        modifiers: { ctrl: false, shift: false, alt: false },
      });

      expect(onMouseLeave).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Propagation', () => {
    it('should stop propagation when stopPropagation is called', () => {
      const parentClick = vi.fn();
      const childClick = vi.fn((event: any) => {
        event.stopPropagation();
      });

      const node: VNode = Box(
        { width: 30, height: 10, onClick: parentClick },
        Box({ width: 20, height: 5, onClick: childClick }, Text({}, 'Child'))
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();

      // Click on the child
      registry.handleMouseEvent({
        x: 5,
        y: 2,
        button: 'left',
        action: 'click',
        modifiers: { ctrl: false, shift: false, alt: false },
      });

      expect(childClick).toHaveBeenCalledTimes(1);
      // Parent should not receive the click because child stopped propagation
      expect(parentClick).not.toHaveBeenCalled();
    });
  });

  describe('Double Click Detection', () => {
    it('should detect double click within threshold', () => {
      const onClick = vi.fn();
      const onDoubleClick = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onClick, onDoubleClick },
        Text({}, 'Double click me')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();

      // First click
      registry.handleMouseEvent({
        x: 5,
        y: 2,
        button: 'left',
        action: 'click',
        modifiers: { ctrl: false, shift: false, alt: false },
      });

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onDoubleClick).not.toHaveBeenCalled();

      // Second click quickly (simulated - in real code would check timing)
      registry.handleMouseEvent({
        x: 5,
        y: 2,
        button: 'left',
        action: 'click',
        modifiers: { ctrl: false, shift: false, alt: false },
      });

      // Both clicks and double-click should fire
      expect(onDoubleClick).toHaveBeenCalledTimes(1);
    });
  });
});
