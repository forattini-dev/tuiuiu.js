import { describe, it, expect } from 'vitest';
import {
  createPool,
  vnodePool,
  acquireVNode,
  releaseVNodeTree,
  layoutNodePool,
  acquireLayoutNode,
  releaseLayoutNodeTree,
} from '../../src/core/pool.js';

describe('createPool', () => {
  it('creates a pool with initial objects', () => {
    const pool = createPool(() => ({ value: 0 }), (obj) => { obj.value = 0; }, { initialSize: 10 });
    expect(pool.available).toBe(10);
    expect(pool.totalCreated).toBe(10);
  });

  it('acquires objects from the pool', () => {
    const pool = createPool(() => ({ value: 0 }), (obj) => { obj.value = 0; }, { initialSize: 5 });
    const obj = pool.acquire();
    expect(obj).toEqual({ value: 0 });
    expect(pool.available).toBe(4);
  });

  it('creates new objects when pool is empty', () => {
    const pool = createPool(() => ({ value: 0 }), (obj) => { obj.value = 0; }, { initialSize: 0 });
    expect(pool.available).toBe(0);
    const obj = pool.acquire();
    expect(obj).toEqual({ value: 0 });
    expect(pool.totalCreated).toBe(1);
  });

  it('releases objects back to the pool', () => {
    const pool = createPool(() => ({ value: 0 }), (obj) => { obj.value = 0; }, { initialSize: 0 });
    const obj = pool.acquire();
    obj.value = 42;
    pool.release(obj);
    expect(pool.available).toBe(1);

    // Reacquired object should be reset
    const reused = pool.acquire();
    expect(reused.value).toBe(0);
    expect(reused).toBe(obj); // Same reference
  });

  it('respects maxSize on release', () => {
    const pool = createPool(() => ({ value: 0 }), (obj) => { obj.value = 0; }, { initialSize: 0, maxSize: 2 });
    const a = pool.acquire();
    const b = pool.acquire();
    const c = pool.acquire();
    pool.release(a);
    pool.release(b);
    pool.release(c); // Should be discarded (maxSize = 2)
    expect(pool.available).toBe(2);
  });

  it('grows the pool', () => {
    const pool = createPool(() => ({ value: 0 }), (obj) => { obj.value = 0; }, { initialSize: 0, maxSize: 100 });
    pool.grow(50);
    expect(pool.available).toBe(50);
  });

  it('drains the pool', () => {
    const pool = createPool(() => ({ value: 0 }), (obj) => { obj.value = 0; }, { initialSize: 10 });
    pool.drain();
    expect(pool.available).toBe(0);
  });
});

describe('vnodePool', () => {
  it('acquires and configures VNodes', () => {
    const node = acquireVNode('text', { children: 'hello' }, []);
    expect(node.type).toBe('text');
    expect(node.props).toEqual({ children: 'hello' });
    expect(node.children).toEqual([]);
  });

  it('releases VNode trees recursively', () => {
    const child1 = acquireVNode('text', { children: 'a' }, []);
    const child2 = acquireVNode('text', { children: 'b' }, []);
    const parent = acquireVNode('box', {}, [child1, child2]);

    const before = vnodePool.available;
    releaseVNodeTree(parent);
    expect(vnodePool.available).toBe(before + 3); // parent + 2 children
  });
});

describe('layoutNodePool', () => {
  it('acquires and configures LayoutNodes', () => {
    const vnode = acquireVNode('box', {}, []);
    const ln = acquireLayoutNode(10, 20, 80, 24, vnode, []);
    expect(ln.x).toBe(10);
    expect(ln.y).toBe(20);
    expect(ln.width).toBe(80);
    expect(ln.height).toBe(24);
    expect(ln.node).toBe(vnode);
  });

  it('releases LayoutNode trees recursively', () => {
    const vnode = acquireVNode('box', {}, []);
    const child = acquireLayoutNode(0, 0, 10, 1, vnode, []);
    const parent = acquireLayoutNode(0, 0, 80, 24, vnode, [child]);

    const before = layoutNodePool.available;
    releaseLayoutNodeTree(parent);
    expect(layoutNodePool.available).toBe(before + 2);
  });
});
