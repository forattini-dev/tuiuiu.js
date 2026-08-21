export type InputModality = 'keyboard' | 'mouse' | 'programmatic';
export type CollectionSelectionMode = 'none' | 'single' | 'multiple';
export type CollectionFilterResult = boolean | number;

export interface CollectionControllerOptions<T, K> {
  items: readonly T[];
  getKey: (item: T) => K;
  isDisabled?: (item: T) => boolean;
  selection?: CollectionSelectionMode;
  selectedKeys?: readonly K[];
  activeKey?: K | null;
  loop?: boolean;
  query?: string;
  filter?: (item: T, query: string) => CollectionFilterResult;
  viewportSize?: number;
  getRowHeight?: (item: T) => number;
  getGroup?: (item: T) => string | undefined;
  groupHeaderHeight?: number;
}

export interface CollectionSnapshot<T, K> {
  items: readonly T[];
  visibleItems: readonly T[];
  activeKey: K | null;
  activeIndex: number;
  selectedKeys: ReadonlySet<K>;
  query: string;
  modality: InputModality;
  viewportStart: number;
  viewportEnd: number;
}

export interface CollectionController<T, K> {
  snapshot(): CollectionSnapshot<T, K>;
  reconcile(items: readonly T[]): void;
  setQuery(query: string): void;
  setViewportSize(size: number): void;
  setActive(key: K | null, modality?: InputModality): boolean;
  setSelected(keys: readonly K[]): void;
  move(delta: number): boolean;
  page(delta: -1 | 1): boolean;
  first(): boolean;
  last(): boolean;
  hover(key: K, pointer?: { x: number; y: number }): boolean;
  activate(): T | undefined;
  toggle(key?: K): boolean;
  selectOnly(key?: K): boolean;
  clearSelection(): void;
  subscribe(listener: (snapshot: CollectionSnapshot<T, K>) => void): () => void;
}

interface VisibleEntry<T, K> {
  item: T;
  key: K;
  sourceIndex: number;
  score: number;
}

function validateSize(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${label} must be a positive safe integer`);
  }
  return value;
}

export function createCollectionController<T, K>(
  options: CollectionControllerOptions<T, K>,
): CollectionController<T, K> {
  let items = [...options.items];
  let query = options.query ?? '';
  let modality: InputModality = 'programmatic';
  let activeKey: K | null = options.activeKey === undefined
    ? null
    : options.activeKey;
  let selectedKeys = new Set(options.selectedKeys ?? []);
  let viewportSize = validateSize(options.viewportSize ?? Number.MAX_SAFE_INTEGER, 'viewportSize');
  let viewportStart = 0;
  let lastPointer: { x: number; y: number } | null = null;
  const listeners = new Set<(snapshot: CollectionSnapshot<T, K>) => void>();
  const selection = options.selection ?? 'none';
  const loop = options.loop ?? false;
  const groupHeaderHeight = options.groupHeaderHeight ?? 1;
  if (!Number.isSafeInteger(groupHeaderHeight) || groupHeaderHeight < 0) {
    throw new RangeError('groupHeaderHeight must be a non-negative safe integer');
  }

  const getKey = options.getKey;
  const isDisabled = options.isDisabled ?? (() => false);
  const getRowHeight = options.getRowHeight ?? (() => 1);

  const entries = (): VisibleEntry<T, K>[] => {
    const normalizedQuery = query.trim();
    const result = items.flatMap((item, sourceIndex) => {
      const score = normalizedQuery && options.filter
        ? options.filter(item, normalizedQuery)
        : true;
      if (score === false || (typeof score === 'number' && score < 0)) return [];
      return [{
        item,
        key: getKey(item),
        sourceIndex,
        score: typeof score === 'number' ? score : 0,
      }];
    });
    if (!normalizedQuery || !options.filter) return result;
    return result.sort((left, right) => right.score - left.score || left.sourceIndex - right.sourceIndex);
  };

  const assertUniqueKeys = () => {
    const keys = new Set<K>();
    for (const item of items) {
      const key = getKey(item);
      if (keys.has(key)) throw new Error('Collection keys must be unique');
      keys.add(key);
    }
  };

  const enabledEntries = () => entries().filter((entry) => !isDisabled(entry.item));

  const rowHeight = (entry: VisibleEntry<T, K>, index: number, all: VisibleEntry<T, K>[]) => {
    const height = getRowHeight(entry.item);
    if (!Number.isSafeInteger(height) || height < 1) {
      throw new RangeError('Collection row heights must be positive safe integers');
    }
    if (!options.getGroup) return height;
    const group = options.getGroup(entry.item);
    const previous = index > 0 ? options.getGroup(all[index - 1]!.item) : undefined;
    return height + (group !== undefined && group !== previous ? groupHeaderHeight : 0);
  };

  const rowTop = (index: number, all: VisibleEntry<T, K>[]) => {
    let result = 0;
    for (let cursor = 0; cursor < index; cursor++) result += rowHeight(all[cursor]!, cursor, all);
    return result;
  };

  const viewport = (all: VisibleEntry<T, K>[]) => {
    if (all.length === 0) return { start: 0, end: 0 };
    const start = Math.max(0, Math.min(viewportStart, all.length - 1));
    let used = 0;
    let end = start;
    while (end < all.length) {
      const height = rowHeight(all[end]!, end, all);
      if (end > start && used + height > viewportSize) break;
      used += height;
      end++;
      if (used >= viewportSize) break;
    }
    return { start, end };
  };

  const ensureVisible = () => {
    const all = entries();
    const index = all.findIndex((entry) => Object.is(entry.key, activeKey));
    if (index < 0) {
      viewportStart = 0;
      return;
    }
    let window = viewport(all);
    if (index < window.start) {
      viewportStart = index;
      return;
    }
    if (index < window.end) return;
    viewportStart = index;
    while (viewportStart > 0) {
      const candidate = viewportStart - 1;
      const top = rowTop(candidate, all);
      const bottom = rowTop(index, all) + rowHeight(all[index]!, index, all);
      if (bottom - top > viewportSize) break;
      viewportStart = candidate;
    }
    window = viewport(all);
    if (index >= window.end) viewportStart = index;
  };

  const buildSnapshot = (): CollectionSnapshot<T, K> => {
    const all = entries();
    const window = viewport(all);
    return {
      items: all.map((entry) => entry.item),
      visibleItems: all.slice(window.start, window.end).map((entry) => entry.item),
      activeKey,
      activeIndex: all.findIndex((entry) => Object.is(entry.key, activeKey)),
      selectedKeys: new Set(selectedKeys),
      query,
      modality,
      viewportStart: window.start,
      viewportEnd: window.end,
    };
  };

  const notify = () => {
    const next = buildSnapshot();
    for (const listener of [...listeners]) listener(next);
  };

  const reconcileState = (previousIndex = -1) => {
    assertUniqueKeys();
    const allKeys = new Set(items.map(getKey));
    selectedKeys = new Set([...selectedKeys].filter((key) => allKeys.has(key)));
    const visible = entries();
    const activeVisible = visible.some((entry) => Object.is(entry.key, activeKey) && !isDisabled(entry.item));
    if (!activeVisible) {
      const clampedIndex = Math.min(Math.max(previousIndex, 0), Math.max(0, visible.length - 1));
      const forward = visible.slice(clampedIndex).find((entry) => !isDisabled(entry.item));
      const backward = visible.slice(0, clampedIndex).reverse().find((entry) => !isDisabled(entry.item));
      activeKey = forward?.key ?? backward?.key ?? null;
    }
    ensureVisible();
  };

  const moveToIndex = (index: number, nextModality: InputModality) => {
    const enabled = enabledEntries();
    const entry = enabled[index];
    if (!entry) return false;
    activeKey = entry.key;
    modality = nextModality;
    ensureVisible();
    notify();
    return true;
  };

  const setActive = (key: K | null, nextModality: InputModality = 'programmatic') => {
    if (key === null) {
      activeKey = null;
      modality = nextModality;
      ensureVisible();
      notify();
      return true;
    }
    const entry = entries().find((candidate) => Object.is(candidate.key, key));
    if (!entry || isDisabled(entry.item)) return false;
    activeKey = entry.key;
    modality = nextModality;
    ensureVisible();
    notify();
    return true;
  };

  const move = (delta: number) => {
    if (!Number.isSafeInteger(delta) || delta === 0) return false;
    const enabled = enabledEntries();
    if (enabled.length === 0) return false;
    const current = enabled.findIndex((entry) => Object.is(entry.key, activeKey));
    const start = current < 0 ? (delta > 0 ? -1 : 0) : current;
    let next = start + delta;
    if (loop) next = ((next % enabled.length) + enabled.length) % enabled.length;
    else next = Math.max(0, Math.min(enabled.length - 1, next));
    return moveToIndex(next, 'keyboard');
  };

  const selectKey = (key: K | undefined, exclusive: boolean) => {
    const resolved = key ?? activeKey ?? undefined;
    if (resolved === undefined) return false;
    const entry = entries().find((candidate) => Object.is(candidate.key, resolved));
    if (!entry || isDisabled(entry.item) || selection === 'none') return false;
    if (selection === 'single' || exclusive) selectedKeys = new Set([entry.key]);
    else if (selectedKeys.has(entry.key)) selectedKeys.delete(entry.key);
    else selectedKeys.add(entry.key);
    activeKey = entry.key;
    ensureVisible();
    notify();
    return true;
  };

  assertUniqueKeys();
  reconcileState();

  return {
    snapshot: buildSnapshot,
    reconcile(nextItems) {
      const previousIndex = entries().findIndex((entry) => Object.is(entry.key, activeKey));
      items = [...nextItems];
      reconcileState(previousIndex);
      notify();
    },
    setQuery(nextQuery) {
      const previousIndex = entries().findIndex((entry) => Object.is(entry.key, activeKey));
      query = nextQuery;
      modality = 'keyboard';
      viewportStart = 0;
      reconcileState(previousIndex);
      notify();
    },
    setViewportSize(size) {
      viewportSize = validateSize(size, 'viewportSize');
      ensureVisible();
      notify();
    },
    setActive,
    setSelected(keys) {
      selectedKeys = new Set(keys);
      reconcileState();
      notify();
    },
    move,
    page(delta) {
      const all = entries();
      if (all.length === 0) return false;
      const current = all.findIndex((entry) => Object.is(entry.key, activeKey));
      const start = current < 0 ? (delta > 0 ? 0 : all.length - 1) : current;
      const startTop = rowTop(start, all);
      const desiredTop = startTop + delta * viewportSize;
      let candidate = start;
      if (delta > 0) {
        while (candidate < all.length - 1 && rowTop(candidate, all) < desiredTop) candidate++;
        while (candidate < all.length && isDisabled(all[candidate]!.item)) candidate++;
        if (candidate >= all.length) candidate = all.length - 1;
        while (candidate > start && isDisabled(all[candidate]!.item)) candidate--;
      } else {
        while (candidate > 0 && rowTop(candidate, all) > desiredTop) candidate--;
        while (candidate >= 0 && isDisabled(all[candidate]!.item)) candidate--;
        if (candidate < 0) candidate = 0;
        while (candidate < start && isDisabled(all[candidate]!.item)) candidate++;
      }
      const entry = all[candidate];
      return entry && !isDisabled(entry.item)
        ? setActive(entry.key, 'keyboard')
        : false;
    },
    first() {
      return moveToIndex(0, 'keyboard');
    },
    last() {
      return moveToIndex(enabledEntries().length - 1, 'keyboard');
    },
    hover(key, pointer) {
      if (pointer) {
        const pointerMoved = !lastPointer
          || pointer.x !== lastPointer.x
          || pointer.y !== lastPointer.y;
        lastPointer = pointer;
        if (modality === 'keyboard' && !pointerMoved) return false;
      }
      return setActive(key, 'mouse');
    },
    activate() {
      return entries().find((entry) => Object.is(entry.key, activeKey) && !isDisabled(entry.item))?.item;
    },
    toggle(key) {
      return selectKey(key, false);
    },
    selectOnly(key) {
      return selectKey(key, true);
    },
    clearSelection() {
      if (selectedKeys.size === 0) return;
      selectedKeys.clear();
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
