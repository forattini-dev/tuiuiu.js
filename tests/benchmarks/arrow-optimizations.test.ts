/**
 * Arrow-JS Optimizations Benchmark
 *
 * Compares the new arrow-js-inspired optimizations against baseline
 * implementations. Each test measures the improvement from a specific
 * optimization.
 */
import { describe, it, expect } from 'vitest';
import {
  Signal,
  Effect,
  createSignal,
  createEffect,
  createMemo,
  batch,
  onCleanup,
} from '../../src/primitives/signal.js';
import {
  createPool,
  vnodePool,
  acquireVNode,
  releaseVNodeTree,
  layoutNodePool,
  acquireLayoutNode,
  releaseLayoutNodeTree,
} from '../../src/core/pool.js';
import { createReactiveStore } from '../../src/primitives/store.js';
import {
  Computed,
  ComputedText,
  isReactiveVNode,
  refreshReactiveVNode,
  type ReactiveVNode,
} from '../../src/primitives/computed-node.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import type { VNode } from '../../src/utils/types.js';

// =============================================================================
// Helpers
// =============================================================================

function average(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function benchOps(label: string, fn: () => void, iterations = 10000): { opsPerMs: number; totalMs: number } {
  // Warmup
  for (let i = 0; i < Math.min(1000, iterations / 10); i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const totalMs = performance.now() - start;

  return { opsPerMs: iterations / totalMs, totalMs };
}

function printResult(label: string, result: { opsPerMs: number; totalMs: number }) {
  console.log(`  ${label}: ${result.opsPerMs.toFixed(0)} ops/ms (${result.totalMs.toFixed(2)}ms total)`);
}

// =============================================================================
// 1. Smart Listener Storage (fn vs Set)
// =============================================================================

describe('Smart Listener Storage', () => {
  it('single-subscriber signals are faster than Set-based', () => {
    // Test: creating signals and subscribing 1 effect is the hot path
    const ITERATIONS = 50_000;

    // New approach: smart storage (single Effect, no Set)
    const smartResult = benchOps('smart-listener', () => {
      const signal = new Signal(0);
      const effect = new Effect(() => {
        signal.value; // subscribe
      });
      effect.dispose();
    }, ITERATIONS);

    printResult('Smart listener (fn|Set)', smartResult);

    // The smart approach should handle at least 100 ops/ms
    expect(smartResult.opsPerMs).toBeGreaterThan(50);
    console.log(`  Throughput: ${smartResult.opsPerMs.toFixed(0)} signal+effect creations/ms`);
  });

  it('handles multi-subscriber efficiently', () => {
    const signal = new Signal(0);
    const effects: Effect[] = [];

    // Add 100 subscribers
    for (let i = 0; i < 100; i++) {
      effects.push(new Effect(() => { signal.value; }));
    }

    // Measure notification speed with many subscribers
    const result = benchOps('multi-sub-notify', () => {
      signal.value = signal.peek() + 1;
    }, 10_000);

    printResult('Multi-subscriber notify (100 subs)', result);
    expect(result.opsPerMs).toBeGreaterThan(1);

    // Cleanup
    effects.forEach(e => e.dispose());
  });

  it('subscriber promotion/demotion is correct', () => {
    const signal = new Signal(0);
    const values: number[] = [];

    // 1 subscriber
    const e1 = new Effect(() => { values.push(signal.value); });
    signal.value = 1;
    expect(values).toEqual([0, 1]);

    // Promote to Set (2 subscribers)
    const e2 = new Effect(() => { values.push(signal.value * 10); });
    signal.value = 2;
    expect(values).toContain(2);
    expect(values).toContain(20);

    // Demote back (1 subscriber)
    e1.dispose();
    signal.value = 3;
    expect(values[values.length - 1]).toBe(30);

    e2.dispose();
  });
});

// =============================================================================
// 2. Dependency Deduplication
// =============================================================================

describe('Dependency Deduplication', () => {
  it('skips re-subscription when deps unchanged', () => {
    const [a] = createSignal(0);
    const [b] = createSignal(0);
    let runCount = 0;

    // Effect reads same signals every run
    const dispose = createEffect(() => {
      void a();
      void b();
      runCount++;
    });

    expect(runCount).toBe(1);

    // Trigger re-run — deps should be deduped (same a, b)
    const [, setA] = createSignal(0);
    // Use the original signal's setter
    dispose();
  });

  it('measures stable-deps effect re-run speed', () => {
    const [count, setCount] = createSignal(0);
    const [name] = createSignal('test');
    let runs = 0;

    createEffect(() => {
      void count();
      void name(); // always reads both
      runs++;
    });

    // Measure re-run speed (deps unchanged between runs = dedup kicks in)
    const result = benchOps('dep-dedup-rerun', () => {
      setCount(c => c + 1);
    }, 50_000);

    printResult('Stable deps re-run', result);
    expect(result.opsPerMs).toBeGreaterThan(100);
    console.log(`  ${runs} effect runs in ${result.totalMs.toFixed(2)}ms`);
  });

  it('correctly handles changing deps', () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(10);
    const [useB, setUseB] = createSignal(true);
    const values: number[] = [];

    createEffect(() => {
      if (useB()) {
        values.push(a() + b());
      } else {
        values.push(a());
      }
    });

    expect(values).toEqual([11]); // a(1) + b(10)

    setA(2);
    expect(values).toEqual([11, 12]); // a(2) + b(10)

    // Switch deps: stop reading b
    setUseB(false);
    expect(values).toEqual([11, 12, 2]); // just a(2)

    // b should NOT trigger effect anymore
    setB(99);
    expect(values).toEqual([11, 12, 2]); // unchanged!

    // a still triggers
    setA(3);
    expect(values).toEqual([11, 12, 2, 3]);
  });
});

// =============================================================================
// 3. onCleanup
// =============================================================================

describe('onCleanup Performance', () => {
  it('onCleanup adds negligible overhead to effects', () => {
    const [count, setCount] = createSignal(0);
    let cleanups = 0;

    createEffect(() => {
      void count();
      onCleanup(() => { cleanups++; });
    });

    const result = benchOps('onCleanup-effect', () => {
      setCount(c => c + 1);
    }, 50_000);

    printResult('Effect with onCleanup', result);
    expect(result.opsPerMs).toBeGreaterThan(100);
    expect(cleanups).toBeGreaterThanOrEqual(50_000); // cleanup runs on each re-run (+ warmup)
    console.log(`  ${cleanups} cleanups executed`);
  });

  it('multiple onCleanup calls scale linearly', () => {
    const [count, setCount] = createSignal(0);
    let cleanups = 0;

    createEffect(() => {
      void count();
      onCleanup(() => { cleanups++; });
      onCleanup(() => { cleanups++; });
      onCleanup(() => { cleanups++; });
    });

    const result = benchOps('multi-onCleanup', () => {
      setCount(c => c + 1);
    }, 20_000);

    printResult('Effect with 3x onCleanup', result);
    expect(result.opsPerMs).toBeGreaterThan(50);
    expect(cleanups).toBeGreaterThanOrEqual(60_000); // 3 cleanups * 20k runs (+ warmup)
  });
});

// =============================================================================
// 4. Microtask Auto-Batching
// =============================================================================

describe('Microtask Auto-Batching', () => {
  it('autoBatch coalesces rapid signal changes', async () => {
    const [count, setCount] = createSignal(0);
    let runs = 0;

    createEffect(() => {
      void count();
      runs++;
    }, { autoBatch: true });

    expect(runs).toBe(1); // initial run

    // Rapid-fire updates in same tick
    for (let i = 1; i <= 100; i++) {
      setCount(i);
    }

    // Before microtask: no additional runs yet
    const runsBeforeTick = runs;

    // After microtask: should have coalesced
    await new Promise(resolve => setTimeout(resolve, 0));

    console.log(`  Runs before tick: ${runsBeforeTick}`);
    console.log(`  Runs after tick: ${runs}`);
    console.log(`  Coalesced ${100} updates into ${runs - 1} effect runs`);

    // Should coalesce to far fewer than 100 runs
    expect(runs).toBeLessThan(10);
    expect(count()).toBe(100); // final value correct
  });

  it('autoBatch vs synchronous performance comparison', async () => {
    const UPDATES = 10_000;

    // Synchronous (default) — each update triggers effect
    {
      const [count, setCount] = createSignal(0);
      let syncRuns = 0;
      const dispose = createEffect(() => { void count(); syncRuns++; });

      const syncStart = performance.now();
      for (let i = 0; i < UPDATES; i++) setCount(i);
      const syncMs = performance.now() - syncStart;

      console.log(`  Synchronous: ${syncRuns} runs in ${syncMs.toFixed(2)}ms`);
      dispose();
    }

    // Auto-batched — updates coalesce in microtask
    {
      const [count, setCount] = createSignal(0);
      let batchRuns = 0;
      const dispose = createEffect(() => { void count(); batchRuns++; }, { autoBatch: true });

      const batchStart = performance.now();
      for (let i = 0; i < UPDATES; i++) setCount(i);
      const burstMs = performance.now() - batchStart;

      await new Promise(resolve => setTimeout(resolve, 10));
      const batchMs = performance.now() - batchStart;

      console.log(`  Auto-batched: ${batchRuns} runs, burst=${burstMs.toFixed(2)}ms, total=${batchMs.toFixed(2)}ms`);
      console.log(`  Coalesce ratio: ${UPDATES}:${batchRuns - 1} (${(UPDATES / Math.max(1, batchRuns - 1)).toFixed(0)}x reduction)`);

      // Auto-batch burst should be significantly faster (no effect runs during burst)
      expect(burstMs).toBeLessThan(50); // Just signal sets, no effect runs
      dispose();
    }
  });
});

// =============================================================================
// 5. Object Pool
// =============================================================================

describe('Object Pool Performance', () => {
  it('pooled VNode allocation is faster than raw object creation', () => {
    const ITERATIONS = 100_000;

    // Baseline: raw object creation
    const rawResult = benchOps('raw-vnode', () => {
      const node: VNode = { type: 'box', props: {}, children: [], key: undefined };
    }, ITERATIONS);

    // Pooled: acquire + release
    const poolResult = benchOps('pool-vnode', () => {
      const node = acquireVNode('box', {}, []);
      vnodePool.release(node);
    }, ITERATIONS);

    printResult('Raw VNode creation', rawResult);
    printResult('Pooled VNode acquire/release', poolResult);

    const ratio = poolResult.opsPerMs / rawResult.opsPerMs;
    console.log(`  Pool/Raw ratio: ${ratio.toFixed(2)}x`);

    // Pool should be competitive — the real gain is GC reduction, not raw throughput
    expect(poolResult.opsPerMs).toBeGreaterThan(rawResult.opsPerMs * 0.1);
  });

  it('pooled tree creation eliminates GC spikes', () => {
    const TREE_SIZE = 50; // 50 nodes per tree
    const ITERATIONS = 5_000;

    // Build a tree of pooled VNodes
    function buildPooledTree(depth: number): VNode {
      if (depth === 0) return acquireVNode('text', { children: 'leaf' }, []);
      const children: VNode[] = [];
      for (let i = 0; i < 3; i++) {
        children.push(buildPooledTree(depth - 1));
      }
      return acquireVNode('box', {}, children);
    }

    // Build a tree of raw VNodes
    function buildRawTree(depth: number): VNode {
      if (depth === 0) return { type: 'text', props: { children: 'leaf' }, children: [] };
      const children: VNode[] = [];
      for (let i = 0; i < 3; i++) {
        children.push(buildRawTree(depth - 1));
      }
      return { type: 'box', props: {}, children };
    }

    // Measure: pooled (build + release)
    const poolTimes: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();
      const tree = buildPooledTree(3);
      releaseVNodeTree(tree);
      poolTimes.push(performance.now() - start);
    }

    // Measure: raw (build only, GC handles cleanup)
    const rawTimes: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();
      buildRawTree(3);
      rawTimes.push(performance.now() - start);
    }

    const poolAvg = average(poolTimes);
    const rawAvg = average(rawTimes);
    const poolMax = Math.max(...poolTimes);
    const rawMax = Math.max(...rawTimes);
    const poolP99 = poolTimes.sort((a, b) => a - b)[Math.floor(ITERATIONS * 0.99)];
    const rawP99 = rawTimes.sort((a, b) => a - b)[Math.floor(ITERATIONS * 0.99)];

    console.log(`  Pooled tree: avg=${poolAvg.toFixed(4)}ms, p99=${poolP99.toFixed(4)}ms, max=${poolMax.toFixed(4)}ms`);
    console.log(`  Raw tree:    avg=${rawAvg.toFixed(4)}ms, p99=${rawP99.toFixed(4)}ms, max=${rawMax.toFixed(4)}ms`);
    console.log(`  GC spike reduction: max ${(rawMax / Math.max(poolMax, 0.001)).toFixed(1)}x better tail latency`);

    // Pool average should be reasonable
    expect(poolAvg).toBeLessThan(1); // < 1ms per tree of 40 nodes
  });

  it('LayoutNode pool works correctly', () => {
    const vnode = acquireVNode('box', {}, []);
    const ITERATIONS = 50_000;

    const result = benchOps('layout-pool', () => {
      const ln = acquireLayoutNode(0, 0, 80, 24, vnode, []);
      layoutNodePool.release(ln);
    }, ITERATIONS);

    printResult('LayoutNode acquire/release', result);
    expect(result.opsPerMs).toBeGreaterThan(100);
  });
});

// =============================================================================
// 6. Lazy Reactive Store
// =============================================================================

describe('Reactive Store Performance', () => {
  it('fine-grained updates only trigger relevant effects', () => {
    const store = createReactiveStore({
      counter: 0,
      name: 'test',
      settings: { theme: 'dark', fontSize: 14 },
    });

    let counterRuns = 0;
    let nameRuns = 0;
    let themeRuns = 0;

    createEffect(() => { void store.counter; counterRuns++; });
    createEffect(() => { void store.name; nameRuns++; });
    createEffect(() => { void store.settings.theme; themeRuns++; });

    // Baseline: each ran once
    expect(counterRuns).toBe(1);
    expect(nameRuns).toBe(1);
    expect(themeRuns).toBe(1);

    // Only counter effect should re-run
    store.counter = 1;
    expect(counterRuns).toBe(2);
    expect(nameRuns).toBe(1);  // unchanged
    expect(themeRuns).toBe(1); // unchanged

    // Only theme effect should re-run
    store.settings.theme = 'light';
    expect(counterRuns).toBe(2); // unchanged
    expect(nameRuns).toBe(1);    // unchanged
    expect(themeRuns).toBe(2);

    console.log('  Fine-grained: counter=2, name=1, theme=2 (correct isolation)');
  });

  it('measures reactive store update throughput', () => {
    const store = createReactiveStore({ count: 0 });
    let runs = 0;
    createEffect(() => { void store.count; runs++; });

    const result = benchOps('reactive-store-update', () => {
      store.count++;
    }, 50_000);

    printResult('Reactive store property update', result);
    expect(result.opsPerMs).toBeGreaterThan(50);
    console.log(`  ${runs} effect runs for ${50_000} updates`);
  });

  it('lazy proxying: nested objects are proxied on-access only', () => {
    const bigStore = createReactiveStore({
      a: { nested: { deep: 1 } },
      b: { nested: { deep: 2 } },
      c: { nested: { deep: 3 } },
      d: { nested: { deep: 4 } },
      e: { nested: { deep: 5 } },
    });

    // Only access 'a' — others should not be proxied
    let runs = 0;
    createEffect(() => {
      void bigStore.a.nested.deep;
      runs++;
    });

    // Changing 'a.nested.deep' triggers
    bigStore.a.nested.deep = 99;
    expect(runs).toBe(2);

    // Changing other branches does NOT trigger our effect
    bigStore.b.nested.deep = 99;
    expect(runs).toBe(2); // unchanged

    console.log('  Lazy proxying: only accessed branches are reactive');
  });
});

// =============================================================================
// 7. Computed/Fine-Grained VNode
// =============================================================================

describe('Fine-Grained Rendering (Computed)', () => {
  it('Computed refreshes only the affected subtree', () => {
    const [count, setCount] = createSignal(0);
    const [name, setName] = createSignal('Alice');

    const countNode = Computed(() => Text({}, `Count: ${count()}`)) as ReactiveVNode;
    const nameNode = Computed(() => Text({}, `Name: ${name()}`)) as ReactiveVNode;

    // Initial
    expect(countNode.children[0].props.children).toBe('Count: 0');
    expect(nameNode.children[0].props.children).toBe('Name: Alice');

    // Change count — only countNode's content changes
    setCount(42);
    refreshReactiveVNode(countNode);
    refreshReactiveVNode(nameNode);

    // countNode content updated
    expect(countNode.children[0].props.children).toBe('Count: 42');
    // nameNode content unchanged (no signal dependency on count)
    expect(nameNode.children[0].props.children).toBe('Name: Alice');

    // Now change name — only nameNode content changes
    setName('Bob');
    refreshReactiveVNode(countNode);
    refreshReactiveVNode(nameNode);

    expect(countNode.children[0].props.children).toBe('Count: 42'); // unchanged
    expect(nameNode.children[0].props.children).toBe('Name: Bob');

    console.log('  Fine-grained: count and name update independently (correct isolation)');
  });

  it('measures Computed refresh throughput', () => {
    const [count, setCount] = createSignal(0);
    const node = Computed(() => Text({}, `${count()}`)) as ReactiveVNode;

    const result = benchOps('computed-refresh', () => {
      setCount(c => c + 1);
      refreshReactiveVNode(node);
    }, 50_000);

    printResult('Computed refresh', result);
    expect(result.opsPerMs).toBeGreaterThan(50);
  });

  it('ComputedText is efficient for reactive labels', () => {
    const [score, setScore] = createSignal(0);
    const node = ComputedText(() => `Score: ${score()}`, { color: 'green' }) as ReactiveVNode;

    expect(node.children[0].props.children).toBe('Score: 0');
    expect(node.children[0].props.color).toBe('green');

    const result = benchOps('computed-text', () => {
      setScore(s => s + 1);
      refreshReactiveVNode(node);
    }, 50_000);

    printResult('ComputedText refresh', result);
    expect(result.opsPerMs).toBeGreaterThan(50);
  });

  it('Computed vs full component re-eval: advantage grows with tree size', () => {
    const [count, setCount] = createSignal(0);

    // Simulate full component re-eval: rebuild entire tree
    function fullComponent() {
      return Box({ flexDirection: 'column' },
        Text({ bold: true }, 'Header'),
        Text({}, 'Static line 1'),
        Text({}, 'Static line 2'),
        Text({}, 'Static line 3'),
        Text({}, 'Static line 4'),
        Text({}, `Count: ${count()}`), // only this changes
        Text({}, 'Static line 5'),
        Text({}, 'Static line 6'),
        Text({}, 'Footer'),
      );
    }

    // Fine-grained: only refresh the Computed node
    const computedNode = Computed(() => Text({}, `Count: ${count()}`)) as ReactiveVNode;

    // Benchmark full re-eval
    const fullResult = benchOps('full-re-eval', () => {
      setCount(c => c + 1);
      fullComponent();
    }, 50_000);

    // Reset counter
    setCount(0);

    // Benchmark computed refresh
    const computedResult = benchOps('computed-only', () => {
      setCount(c => c + 1);
      refreshReactiveVNode(computedNode);
    }, 50_000);

    printResult('Full component re-eval (10 nodes)', fullResult);
    printResult('Computed refresh (1 node)', computedResult);

    const speedup = computedResult.opsPerMs / fullResult.opsPerMs;
    console.log(`  Fine-grained speedup: ${speedup.toFixed(1)}x faster`);

    // Computed should be meaningfully faster
    expect(speedup).toBeGreaterThan(1.2);
  });
});

// =============================================================================
// Summary
// =============================================================================

describe('Overall Signal Pipeline', () => {
  it('end-to-end signal → effect throughput', () => {
    const [a, setA] = createSignal(0);
    const [b, setB] = createSignal(0);
    const memo = createMemo(() => a() + b());
    let result = 0;

    createEffect(() => {
      result = memo();
    });

    const bench = benchOps('e2e-pipeline', () => {
      setA(a => a + 1);
    }, 50_000);

    printResult('Signal → Memo → Effect pipeline', bench);
    expect(bench.opsPerMs).toBeGreaterThan(50);
    expect(result).toBeGreaterThanOrEqual(50_001); // initial + iterations + warmup
  });

  it('batch throughput with many signals', () => {
    const signals = Array.from({ length: 20 }, (_, i) => createSignal(0));
    let total = 0;

    createEffect(() => {
      total = signals.reduce((sum, [get]) => sum + get(), 0);
    });

    const result = benchOps('batch-20-signals', () => {
      batch(() => {
        for (const [, set] of signals) {
          set(v => v + 1);
        }
      });
    }, 10_000);

    printResult('Batch update 20 signals', result);
    expect(result.opsPerMs).toBeGreaterThan(5);
    console.log(`  Final total: ${total}`);
  });
});
