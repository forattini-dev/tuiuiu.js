/**
 * Signal → Render Integration Tests
 *
 * Tests that verify signals properly trigger re-renders
 * and the rendered output reflects signal changes.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createSignal,
  createEffect,
  batch,
} from '../../src/primitives/signal.js';
import { renderToString } from '../../src/design-system/core/renderer.js';
import { Box, Text } from '../../src/primitives/index.js';
import {
  beginRender,
  endRender,
  resetHookState,
} from '../../src/hooks/context.js';
import { useState } from '../../src/hooks/use-state.js';
import type { VNode } from '../../src/utils/types.js';

/**
 * Utility to create a test render loop that captures outputs
 */
function createTestRenderer(componentFn: () => VNode) {
  const renders: string[] = [];
  let currentNode: VNode | null = null;

  const dispose = createEffect(() => {
    beginRender();
    currentNode = componentFn();
    endRender();

    const output = renderToString(currentNode, 80);
    renders.push(output);
  });

  return {
    renders,
    dispose,
    getCurrentOutput: () => renders[renders.length - 1],
    getRenderCount: () => renders.length,
  };
}

describe('Signal → Render Integration', () => {
  beforeEach(() => {
    resetHookState();
  });

  afterEach(() => {
    resetHookState();
  });

  describe('createSignal external to component', () => {
    it('should re-render when external signal changes', () => {
      const [count, setCount] = createSignal(0);

      function Counter(): VNode {
        return Text({}, `Count: ${count()}`);
      }

      const { renders, dispose } = createTestRenderer(() => Counter());

      // Initial render
      expect(renders).toHaveLength(1);
      expect(renders[0]).toContain('Count: 0');

      // Update signal
      setCount(1);
      expect(renders).toHaveLength(2);
      expect(renders[1]).toContain('Count: 1');

      // Update again
      setCount(5);
      expect(renders).toHaveLength(3);
      expect(renders[2]).toContain('Count: 5');

      dispose();
    });

    it('should track multiple external signals', () => {
      const [name, setName] = createSignal('Alice');
      const [age, setAge] = createSignal(25);

      function Profile(): VNode {
        return Box(
          { flexDirection: 'column' },
          Text({}, `Name: ${name()}`),
          Text({}, `Age: ${age()}`)
        );
      }

      const { renders, dispose } = createTestRenderer(() => Profile());

      expect(renders).toHaveLength(1);
      expect(renders[0]).toContain('Name: Alice');
      expect(renders[0]).toContain('Age: 25');

      setName('Bob');
      expect(renders).toHaveLength(2);
      expect(renders[1]).toContain('Name: Bob');
      expect(renders[1]).toContain('Age: 25');

      setAge(30);
      expect(renders).toHaveLength(3);
      expect(renders[2]).toContain('Name: Bob');
      expect(renders[2]).toContain('Age: 30');

      dispose();
    });

    it('should batch multiple signal updates', () => {
      const [a, setA] = createSignal(0);
      const [b, setB] = createSignal(0);

      function Sum(): VNode {
        return Text({}, `Sum: ${a() + b()}`);
      }

      const { renders, dispose } = createTestRenderer(() => Sum());

      expect(renders).toHaveLength(1);
      expect(renders[0]).toContain('Sum: 0');

      // Batch updates - should only trigger one render
      batch(() => {
        setA(5);
        setB(10);
      });

      expect(renders).toHaveLength(2);
      expect(renders[1]).toContain('Sum: 15');

      dispose();
    });
  });

  describe('useState inside component', () => {
    it('should re-render when useState signal changes', () => {
      function Counter(): VNode {
        const [count, setCount] = useState(0);

        // Simulate external trigger (like useInput)
        if (count() === 0) {
          // Defer to avoid infinite loop
          setTimeout(() => setCount(1), 0);
        }

        return Text({}, `Count: ${count()}`);
      }

      const { renders, dispose, getCurrentOutput } = createTestRenderer(() =>
        Counter()
      );

      expect(renders).toHaveLength(1);
      expect(renders[0]).toContain('Count: 0');

      dispose();
    });

    it('should persist useState across re-renders', () => {
      const [trigger, setTrigger] = createSignal(0);

      function Counter(): VNode {
        const [count, setCount] = useState(10);
        // Read trigger to create dependency
        const t = trigger();
        return Text({}, `Count: ${count()}, Trigger: ${t}`);
      }

      const { renders, dispose } = createTestRenderer(() => Counter());

      expect(renders).toHaveLength(1);
      expect(renders[0]).toContain('Count: 10');

      // Trigger re-render via external signal
      setTrigger(1);

      expect(renders).toHaveLength(2);
      // useState should still have value 10 (persisted)
      expect(renders[1]).toContain('Count: 10');
      expect(renders[1]).toContain('Trigger: 1');

      dispose();
    });
  });

  describe('Progress bar simulation', () => {
    it('should update progress bar incrementally', () => {
      const [progress, setProgress] = createSignal(0);

      function ProgressBar(): VNode {
        const p = progress();
        const filled = Math.floor(p / 10);
        const empty = 10 - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        return Text({}, `[${bar}] ${p}%`);
      }

      const { renders, dispose } = createTestRenderer(() => ProgressBar());

      expect(renders).toHaveLength(1);
      expect(renders[0]).toContain('[░░░░░░░░░░] 0%');

      // Simulate incremental progress
      setProgress(10);
      expect(renders).toHaveLength(2);
      expect(renders[1]).toContain('[█░░░░░░░░░] 10%');

      setProgress(20);
      expect(renders).toHaveLength(3);
      expect(renders[2]).toContain('[██░░░░░░░░] 20%');

      setProgress(50);
      expect(renders).toHaveLength(4);
      expect(renders[3]).toContain('[█████░░░░░] 50%');

      setProgress(100);
      expect(renders).toHaveLength(5);
      expect(renders[4]).toContain('[██████████] 100%');

      dispose();
    });

    it('should track progress signal created in factory function', () => {
      // This simulates createProgressBar pattern
      function createProgressState() {
        const [progress, setProgress] = createSignal(0);
        return {
          progress,
          setProgress: (v: number) => setProgress(Math.min(100, Math.max(0, v))),
          increment: (amount: number) =>
            setProgress((p) => Math.min(100, p + amount)),
        };
      }

      const progressState = createProgressState();

      function ProgressBar(): VNode {
        const p = progressState.progress();
        const filled = Math.floor(p / 10);
        const empty = 10 - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        return Text({}, `[${bar}] ${p}%`);
      }

      const { renders, dispose } = createTestRenderer(() => ProgressBar());

      expect(renders).toHaveLength(1);
      expect(renders[0]).toContain('0%');

      progressState.increment(10);
      expect(renders).toHaveLength(2);
      expect(renders[1]).toContain('10%');

      progressState.increment(10);
      expect(renders).toHaveLength(3);
      expect(renders[2]).toContain('20%');

      dispose();
    });
  });

  describe('Conditional rendering', () => {
    it('should track signals in conditionally rendered branches', () => {
      const [loading, setLoading] = createSignal(false);
      const [progress, setProgress] = createSignal(0);

      function LoadingView(): VNode {
        if (loading()) {
          return Text({}, `Loading: ${progress()}%`);
        }
        return Text({}, 'Ready');
      }

      const { renders, dispose } = createTestRenderer(() => LoadingView());

      // Initial: not loading
      expect(renders).toHaveLength(1);
      expect(renders[0]).toContain('Ready');

      // Change progress while not loading - should NOT trigger render
      // because progress() is not called when loading is false
      setProgress(50);
      expect(renders).toHaveLength(1); // Still 1!

      // Start loading
      setLoading(true);
      expect(renders).toHaveLength(2);
      expect(renders[1]).toContain('Loading: 50%'); // Gets current progress

      // Now progress changes should trigger renders
      setProgress(75);
      expect(renders).toHaveLength(3);
      expect(renders[2]).toContain('Loading: 75%');

      dispose();
    });

    it('should re-track signals when branch changes', () => {
      const [showA, setShowA] = createSignal(true);
      const [valueA, setValueA] = createSignal('A');
      const [valueB, setValueB] = createSignal('B');

      function Switcher(): VNode {
        if (showA()) {
          return Text({}, `Value A: ${valueA()}`);
        }
        return Text({}, `Value B: ${valueB()}`);
      }

      const { renders, dispose } = createTestRenderer(() => Switcher());

      expect(renders).toHaveLength(1);
      expect(renders[0]).toContain('Value A: A');

      // valueB changes - should NOT trigger (not tracked)
      setValueB('B2');
      expect(renders).toHaveLength(1);

      // valueA changes - should trigger
      setValueA('A2');
      expect(renders).toHaveLength(2);
      expect(renders[1]).toContain('Value A: A2');

      // Switch to B branch
      setShowA(false);
      expect(renders).toHaveLength(3);
      expect(renders[2]).toContain('Value B: B2');

      // Now valueA should NOT trigger, valueB should
      setValueA('A3');
      expect(renders).toHaveLength(3);

      setValueB('B3');
      expect(renders).toHaveLength(4);
      expect(renders[3]).toContain('Value B: B3');

      dispose();
    });
  });
});
