/**
 * Mouse Simulator Tests
 *
 * Tests for the mouse event simulation utilities used in automated testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MouseSimulator,
  createMouseSimulator,
  simulateClick,
  simulateRightClick,
  simulateDoubleClick,
  simulateScroll,
  simulateDrag,
  generateSGRMouseSequence,
  generateX10MouseSequence,
} from '../../src/dev-tools/mouse-simulator.js';
import {
  getHitTestRegistry,
  resetHitTestRegistry,
  registerHitTestFromLayout,
} from '../../src/core/hit-test.js';
import { calculateLayout } from '../../src/design-system/core/layout.js';
import { Box, Text } from '../../src/primitives/index.js';
import type { VNode } from '../../src/utils/types.js';

describe('Mouse Simulator', () => {
  beforeEach(() => {
    resetHitTestRegistry();
  });

  afterEach(() => {
    resetHitTestRegistry();
  });

  describe('Sequence Generation', () => {
    describe('SGR Format', () => {
      it('should generate correct sequence for left click', () => {
        const seq = generateSGRMouseSequence(10, 5, 'left', 'click');
        // Button 0, x+1=11, y+1=6, M for press
        expect(seq).toBe('\x1b[<0;11;6M');
      });

      it('should generate correct sequence for right click', () => {
        const seq = generateSGRMouseSequence(10, 5, 'right', 'click');
        expect(seq).toBe('\x1b[<2;11;6M');
      });

      it('should generate correct sequence for middle click', () => {
        const seq = generateSGRMouseSequence(10, 5, 'middle', 'click');
        expect(seq).toBe('\x1b[<1;11;6M');
      });

      it('should generate correct sequence for release', () => {
        const seq = generateSGRMouseSequence(10, 5, 'left', 'release');
        // lowercase m for release
        expect(seq).toBe('\x1b[<0;11;6m');
      });

      it('should add modifier flags', () => {
        const seq = generateSGRMouseSequence(10, 5, 'left', 'click', { ctrl: true, shift: true });
        // Button 0 + 4 (shift) + 16 (ctrl) = 20
        expect(seq).toBe('\x1b[<20;11;6M');
      });

      it('should add motion flag for drag', () => {
        const seq = generateSGRMouseSequence(10, 5, 'left', 'drag');
        // Button 0 + 32 (motion) = 32
        expect(seq).toBe('\x1b[<32;11;6M');
      });

      it('should generate correct sequence for scroll up', () => {
        const seq = generateSGRMouseSequence(10, 5, 'scroll-up', 'click');
        // Button 64 for scroll up
        expect(seq).toBe('\x1b[<64;11;6M');
      });

      it('should generate correct sequence for scroll down', () => {
        const seq = generateSGRMouseSequence(10, 5, 'scroll-down', 'click');
        // Button 65 for scroll down
        expect(seq).toBe('\x1b[<65;11;6M');
      });
    });

    describe('X10 Format', () => {
      it('should generate correct sequence for left click', () => {
        const seq = generateX10MouseSequence(10, 5, 'left', 'click');
        // Button char: 32+0=' ', x char: 32+11='/', y char: 32+6='&'
        expect(seq).toBe('\x1b[M +&');
      });

      it('should generate correct sequence for right click', () => {
        const seq = generateX10MouseSequence(10, 5, 'right', 'click');
        // Button char: 32+2='"'
        expect(seq).toBe('\x1b[M"+&');
      });
    });
  });

  describe('MouseSimulator Class', () => {
    it('should create instance with default options', () => {
      const sim = new MouseSimulator();
      expect(sim.getPosition()).toEqual({ x: 0, y: 0 });
    });

    it('should track last position after click', () => {
      const sim = new MouseSimulator();
      sim.click(15, 10);
      expect(sim.getPosition()).toEqual({ x: 15, y: 10 });
    });

    it('should reset state', () => {
      const sim = new MouseSimulator();
      sim.click(15, 10);
      sim.reset();
      expect(sim.getPosition()).toEqual({ x: 0, y: 0 });
    });

    it('should generate sequence for configured format', () => {
      const sgrSim = new MouseSimulator({ useSGR: true });
      const x10Sim = new MouseSimulator({ useSGR: false });

      const sgrSeq = sgrSim.generateSequence(10, 5, 'left', 'click');
      const x10Seq = x10Sim.generateSequence(10, 5, 'left', 'click');

      expect(sgrSeq).toContain('\x1b[<');
      expect(x10Seq).toContain('\x1b[M');
    });
  });

  describe('Event Dispatching', () => {
    it('should dispatch click to element handler', () => {
      const onClick = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onClick },
        Text({}, 'Click me')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const sim = new MouseSimulator();
      sim.click(5, 2);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should dispatch right click', () => {
      const onContextMenu = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onContextMenu },
        Text({}, 'Right click me')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const sim = new MouseSimulator();
      sim.rightClick(5, 2);

      expect(onContextMenu).toHaveBeenCalledTimes(1);
    });

    it('should dispatch double click', () => {
      const onClick = vi.fn();
      const onDoubleClick = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onClick, onDoubleClick },
        Text({}, 'Double click me')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const sim = new MouseSimulator();
      sim.doubleClick(5, 2);

      // First click triggers onClick, second click (within 300ms) triggers onDoubleClick
      // The hit-test system correctly uses else-if to avoid double-firing
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onDoubleClick).toHaveBeenCalledTimes(1);
    });

    it('should dispatch scroll events', () => {
      const onScroll = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onScroll },
        Text({}, 'Scroll me')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const sim = new MouseSimulator();
      sim.scroll(5, 2, 'up', 3);

      expect(onScroll).toHaveBeenCalledTimes(3);
    });

    it('should dispatch drag events', () => {
      const onMouseMove = vi.fn();
      const node: VNode = Box(
        { width: 30, height: 15, onMouseMove },
        Text({}, 'Drag area')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const sim = new MouseSimulator();
      sim.drag(5, 5, 20, 10, { steps: 5 });

      // Should receive drag events at each step
      expect(onMouseMove.mock.calls.length).toBeGreaterThan(0);
    });

    it('should dispatch hover events', () => {
      const onMouseEnter = vi.fn();
      const onMouseLeave = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onMouseEnter, onMouseLeave },
        Text({}, 'Hover me')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const sim = new MouseSimulator();

      // Move into element
      sim.hover(5, 2);
      expect(onMouseEnter).toHaveBeenCalledTimes(1);

      // Move out of element
      sim.moveTo(50, 20);
      expect(onMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('should support mouse down and up separately', () => {
      const onMouseDown = vi.fn();
      const onMouseUp = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onMouseDown, onMouseUp },
        Text({}, 'Press me')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const sim = new MouseSimulator();
      sim.mouseDown(5, 2);
      expect(onMouseDown).toHaveBeenCalledTimes(1);
      expect(onMouseUp).not.toHaveBeenCalled();

      sim.mouseUp(5, 2);
      expect(onMouseUp).toHaveBeenCalledTimes(1);
    });

    it('should include modifiers in events', () => {
      const onClick = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onClick },
        Text({}, 'Click me')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      const sim = new MouseSimulator();
      sim.click(5, 2, { ctrl: true, shift: true });

      expect(onClick).toHaveBeenCalledTimes(1);
      const event = onClick.mock.calls[0][0];
      expect(event.modifiers.ctrl).toBe(true);
      expect(event.modifiers.shift).toBe(true);
    });
  });

  describe('Convenience Functions', () => {
    it('simulateClick should dispatch click event', () => {
      const onClick = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onClick },
        Text({}, 'Click me')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      simulateClick(5, 2);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('simulateRightClick should dispatch right click', () => {
      const onContextMenu = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onContextMenu },
        Text({}, 'Right click')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      simulateRightClick(5, 2);
      expect(onContextMenu).toHaveBeenCalledTimes(1);
    });

    it('simulateDoubleClick should dispatch double click', () => {
      const onDoubleClick = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onDoubleClick },
        Text({}, 'Double click')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      simulateDoubleClick(5, 2);
      expect(onDoubleClick).toHaveBeenCalledTimes(1);
    });

    it('simulateScroll should dispatch scroll event', () => {
      const onScroll = vi.fn();
      const node: VNode = Box(
        { width: 20, height: 5, onScroll },
        Text({}, 'Scroll')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      simulateScroll(5, 2, 'down', 2);
      expect(onScroll).toHaveBeenCalledTimes(2);
    });

    it('simulateDrag should dispatch drag events', () => {
      const onMouseMove = vi.fn();
      const node: VNode = Box(
        { width: 40, height: 20, onMouseMove },
        Text({}, 'Drag')
      );

      const layout = calculateLayout(node, 80, 24);
      registerHitTestFromLayout(layout);

      simulateDrag(5, 5, 25, 15, { steps: 5 });
      expect(onMouseMove.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Factory Function', () => {
    it('createMouseSimulator should return MouseSimulator instance', () => {
      const sim = createMouseSimulator();
      expect(sim).toBeInstanceOf(MouseSimulator);
    });

    it('createMouseSimulator should accept options', () => {
      const sim = createMouseSimulator({ useSGR: false });
      const seq = sim.generateSequence(10, 5, 'left', 'click');
      expect(seq).toContain('\x1b[M'); // X10 format
    });
  });
});
