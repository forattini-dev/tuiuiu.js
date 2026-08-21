import { describe, expect, it, vi } from 'vitest';
import { createCollectionController } from '../../src/interaction/collection.js';

type Item = {
  id: string;
  label: string;
  disabled?: boolean;
  group?: string;
  height?: number;
};

const items: Item[] = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta', disabled: true },
  { id: 'c', label: 'Charlie' },
  { id: 'd', label: 'Delta' },
];

function create(options: Partial<Parameters<typeof createCollectionController<Item, string>>[0]> = {}) {
  return createCollectionController<Item, string>({
    items,
    getKey: (item) => item.id,
    isDisabled: (item) => !!item.disabled,
    ...options,
  });
}

describe('CollectionController', () => {
  it('initializes at the first enabled item and skips disabled items', () => {
    const controller = create({ loop: true });
    expect(controller.snapshot().activeKey).toBe('a');

    controller.move(1);
    expect(controller.snapshot().activeKey).toBe('c');
    controller.move(-1);
    expect(controller.snapshot().activeKey).toBe('a');
    controller.move(-1);
    expect(controller.snapshot().activeKey).toBe('d');
  });

  it('preserves active and selected identities across reorder', () => {
    const controller = create({ selection: 'multiple', activeKey: 'c', selectedKeys: ['a', 'c'] });
    controller.reconcile([items[3]!, items[2]!, items[0]!, items[1]!]);

    expect(controller.snapshot().activeKey).toBe('c');
    expect([...controller.snapshot().selectedKeys]).toEqual(['a', 'c']);
  });

  it('chooses a deterministic neighbor and prunes selection after removal', () => {
    const controller = create({ selection: 'multiple', activeKey: 'c', selectedKeys: ['a', 'c'] });
    controller.reconcile([items[0]!, items[3]!]);

    expect(controller.snapshot().activeKey).toBe('d');
    expect([...controller.snapshot().selectedKeys]).toEqual(['a']);
  });

  it('uses null when no enabled items remain', () => {
    const controller = create({ activeKey: 'a' });
    controller.reconcile([{ id: 'x', label: 'Disabled', disabled: true }]);
    expect(controller.snapshot().activeKey).toBeNull();
    expect(controller.activate()).toBeUndefined();
  });

  it('supports single and multiple selection policies', () => {
    const single = create({ selection: 'single' });
    single.selectOnly('a');
    single.toggle('c');
    expect([...single.snapshot().selectedKeys]).toEqual(['c']);

    const multiple = create({ selection: 'multiple' });
    multiple.toggle('a');
    multiple.toggle('c');
    multiple.toggle('a');
    expect([...multiple.snapshot().selectedKeys]).toEqual(['c']);
  });

  it('filters, scores stably, and returns modality to keyboard', () => {
    const controller = create({
      filter: (item, query) => item.label.toLowerCase().includes(query.toLowerCase())
        ? (item.label.toLowerCase().startsWith(query.toLowerCase()) ? 10 : 1)
        : false,
    });
    controller.hover('d');
    expect(controller.snapshot().modality).toBe('mouse');

    controller.setQuery('a');
    expect(controller.snapshot().items.map((item) => item.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(controller.snapshot().modality).toBe('keyboard');
  });

  it('keeps active rows inside a bounded viewport', () => {
    const controller = create({ viewportSize: 2 });
    controller.setActive('d');
    const snapshot = controller.snapshot();
    expect(snapshot.viewportStart).toBeGreaterThan(0);
    expect(snapshot.visibleItems.map((item) => item.id)).toContain('d');
  });

  it('accounts for group headers and variable row heights', () => {
    const grouped: Item[] = [
      { id: 'a', label: 'A', group: 'one', height: 1 },
      { id: 'b', label: 'B', group: 'one', height: 2 },
      { id: 'c', label: 'C', group: 'two', height: 1 },
    ];
    const controller = createCollectionController({
      items: grouped,
      getKey: (item) => item.id,
      getGroup: (item) => item.group,
      getRowHeight: (item) => item.height ?? 1,
      groupHeaderHeight: 1,
      viewportSize: 3,
    });
    controller.setActive('c');
    expect(controller.snapshot().visibleItems.map((item) => item.id)).toContain('c');
  });

  it('supports first, last, page and programmatic activation', () => {
    const controller = create({ viewportSize: 2 });
    controller.last();
    expect(controller.snapshot().activeKey).toBe('d');
    controller.first();
    expect(controller.snapshot().activeKey).toBe('a');
    controller.page(1);
    expect(controller.snapshot().activeKey).toBe('c');
    expect(controller.activate()?.id).toBe('c');
  });

  it('does not let a stationary pointer undo keyboard navigation', () => {
    const controller = create();
    controller.hover('d', { x: 4, y: 2 });
    controller.move(-1);
    expect(controller.snapshot().activeKey).toBe('c');

    expect(controller.hover('d', { x: 4, y: 2 })).toBe(false);
    expect(controller.snapshot().activeKey).toBe('c');
    expect(controller.hover('d', { x: 5, y: 2 })).toBe(true);
  });

  it('notifies subscribers with defensive selection snapshots', () => {
    const listener = vi.fn();
    const controller = create({ selection: 'multiple' });
    const unsubscribe = controller.subscribe(listener);
    controller.toggle('a');
    unsubscribe();
    controller.toggle('c');

    expect(listener).toHaveBeenCalledOnce();
    const snapshot = listener.mock.calls[0]![0];
    expect([...snapshot.selectedKeys]).toEqual(['a']);
  });

  it('rejects duplicate keys and invalid dimensions', () => {
    expect(() => createCollectionController({
      items: [{ id: 'a' }, { id: 'a' }],
      getKey: (item) => item.id,
    })).toThrow(/unique/);
    expect(() => create({ viewportSize: 0 })).toThrow(RangeError);
    expect(() => create({ getRowHeight: () => 0, viewportSize: 2 })).toThrow(RangeError);
  });
});
