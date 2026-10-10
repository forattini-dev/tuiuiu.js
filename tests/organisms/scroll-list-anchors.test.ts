import { afterEach, describe, expect, it } from 'vitest';
import { createTestHarness } from '../../src/dev-tools/testing.js';
import { ScrollList, createScrollList } from '../../src/organisms/scroll-list.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import { component, type ComponentKeyProps } from '../../src/app/component.js';
import { useState } from '../../src/hooks/use-state.js';

const harnesses: ReturnType<typeof createTestHarness>[] = [];
afterEach(() => { for (const harness of harnesses.splice(0)) harness.cleanup(); });
const harness = () => {
  const app = createTestHarness({ columns: 40, rows: 8 });
  harnesses.push(app);
  return app;
};
const seed = () => Array.from({ length: 12 }, (_, id) => ({ id, text: `item-${id}` }));

describe('ScrollList stable anchors in the real app', () => {
  it('evaluates an auto-measured stateful row only once per frame and preserves its owner', async () => {
    const app = harness();
    const Row = component('MeasuredRow', ({ id }: { id: number } & ComponentKeyProps) => {
      const [count, setCount] = useState(0);
      return Box({ onClick: () => setCount(value => value + 1) }, Text({}, `${id}:${count()}`));
    });
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const children = (item: typeof items[number]) => Row({ key: item.id, id: item.id });
    expect(() => app.render(() => ScrollList({ items, children, width: 20, height: 2 }))).not.toThrow();
    app.events.click(1, 0);
    await app.flush();
    expect(app.getScreen()[0]!.slice(0, 3)).toBe('1:1');
  });
  it('retains interactive nodes and clips partial rows instead of flattening to ANSI', async () => {
    const app = harness();
    const state = createScrollList();
    const clicks: { id: number; y: number }[] = [];
    app.render(() => ScrollList({
      state, items: [0, 1, 2, 3], itemHeight: 3, height: 4, width: 20,
      showScrollbar: false,
      children: id => Box({ id: `row-${id}`, role: 'button', onClick: event => clicks.push({ id, y: event.y }) },
        Text({}, `a${id}\nb${id}\nc${id}`)),
    }));
    state.scrollTo(4);
    await app.flush();
    expect(app.getScreen().slice(0, 4).map(line => line.trim())).toEqual(['b1', 'c1', 'a2', 'b2']);
    const targets = app.getFrame()!.hitTargets.filter(target => target.node.props.id?.startsWith('row-'));
    expect(targets.map(target => target.node.props.id)).toEqual(['row-1', 'row-2']);
    expect(targets.map(({ y, height }) => ({ y, height }))).toEqual([{ y: 0, height: 2 }, { y: 2, height: 2 }]);
    expect(app.getFrame()!.queries.getElement('row-1').status).toBe('found');
    app.events.click(1, 0);
    app.events.click(1, 3);
    app.events.click(1, 5);
    expect(clicks).toEqual([{ id: 1, y: 1 }, { id: 2, y: 1 }]);
  });
  it.each([false, true])('retains visible identity across prepend/append (inverted=%s)', async inverted => {
    const app = harness();
    const state = createScrollList({ inverted });
    let items = seed();
    app.render(() => ScrollList({
      state, items, inverted, getKey: item => item.id,
      children: item => Text({}, item.text), height: 3, width: 30, itemHeight: 1,
      showScrollbar: false,
    }));
    state.scrollTo(inverted ? 3 : 6);
    await app.flush();
    const before = app.getScreenString();
    expect(before).toContain('item-6');
    items = [{ id: -1, text: 'prepend' }, ...items, { id: 12, text: 'append' }];
    await app.flush();
    expect(app.getScreenString()).toBe(before);
    expect(state.scrollTop()).toBe(inverted ? 4 : 7);
    // Changes in scroll state between frames must be read against OLD geometry.
    state.scrollBy(inverted ? -1 : 1);
    await app.flush();
    expect(app.getScreenString()).toContain('item-9');
    const moved = app.getScreenString();
    items = [{ id: -2, text: 'another prepend' }, ...items];
    await app.flush();
    expect(app.getScreenString()).toBe(moved);
  });
  it('falls forward to a surviving neighbor when the visible anchor is removed', async () => {
    const app = harness();
    const state = createScrollList();
    let items = seed();
    app.render(() => ScrollList({
      state, items, getKey: item => item.id, children: item => Text({}, item.text),
      height: 3, width: 30, itemHeight: 1, showScrollbar: false,
    }));
    state.scrollTo(4);
    await app.flush();
    items = items.filter(item => item.id !== 4 && item.id !== 5);
    await app.flush();
    expect(app.getScreen()[0]!.trim()).toBe('item-6');
    expect(state.scrollTop()).toBe(4);
  });
  it('keeps the item and line offset when preceding items reflow on resize', async () => {
    const app = harness();
    const state = createScrollList();
    const items = [{ id: 0, text: 'a'.repeat(20) }, { id: 1, text: 'b'.repeat(30) }, { id: 2, text: 'c'.repeat(40) }];
    let width = 10;
    app.render(() => ScrollList({
      state, items, getKey: item => item.id, children: item => Text({ wrap: 'wrap' }, item.text),
      height: 2, width, showScrollbar: false,
    }));
    state.scrollTo(3); // second item, one physical line in
    await app.flush();
    width = 5;
    await app.flush();
    expect(state.scrollTop()).toBe(5); // first item now 4 lines + one line into second
    expect(app.getScreen()[0]!.trim()).toBe('bbbbb');
  });
  it('lets smart auto-follow take precedence only when near the bottom', async () => {
    const app = harness();
    const state = createScrollList();
    let items = seed();
    app.render(() => ScrollList({
      state, items, getKey: item => item.id, children: item => Text({}, item.text),
      height: 3, width: 30, itemHeight: 1, showScrollbar: false,
      autoScroll: true, autoScrollThreshold: 1,
    }));
    state.scrollToBottom();
    await app.flush();
    items = [...items, { id: 12, text: 'newest' }];
    await app.flush();
    expect(state.scrollTop()).toBe(state.maxScroll());
    expect(app.getScreenString()).toContain('newest');
    state.scrollTo(4);
    await app.flush();
    const before = app.getScreenString();
    items = [{ id: -1, text: 'older' }, ...items, { id: 13, text: 'another' }];
    await app.flush();
    expect(app.getScreenString()).toBe(before);
  });
  it('preserves historical unkeyed behavior and allows explicitly disabling anchors', async () => {
    for (const keyed of [true, false]) {
      const app = harness();
      const state = createScrollList();
      let items = seed();
      app.render(() => ScrollList({
        state, items, getKey: keyed ? item => item.id : undefined, preserveAnchor: false,
        children: item => Text({}, item.text), height: 3, width: 30, itemHeight: 1, showScrollbar: false,
      }));
      state.scrollTo(4);
      await app.flush();
      items = [{ id: -1, text: 'older' }, ...items];
      await app.flush();
      expect(state.scrollTop()).toBe(4);
      expect(app.getScreen()[0]!.trim()).toBe('item-3');
    }
  });
  it('rejects duplicate or invalid identities with a useful error', () => {
    for (const getKey of [() => 'duplicate', () => NaN]) {
      const app = harness();
      expect(() => app.render(() => ScrollList({
        items: seed(), getKey, children: item => Text({}, item.text),
        height: 3, width: 30, itemHeight: 1,
      }))).toThrow('unique strings or finite numbers');
    }
  });
  it('cuts the correct side of a multiline item while scrolling upward from bottom', async () => {
    const app = harness();
    const state = createScrollList({ inverted: true });
    const items = Array.from({ length: 4 }, (_, id) => ({ id, text: `a${id}\nb${id}\nc${id}` }));
    app.render(() => ScrollList({
      state, items, inverted: true, getKey: item => item.id, children: item => Text({}, item.text),
      height: 4, width: 30, itemHeight: 3, showScrollbar: false,
    }));
    expect(app.getScreen().slice(0, 4).map(line => line.trim())).toEqual(['c2', 'a3', 'b3', 'c3']);
    state.scrollTo(1);
    await app.flush();
    expect(app.getScreen().slice(0, 4).map(line => line.trim())).toEqual(['b2', 'c2', 'a3', 'b3']);
  });
});
