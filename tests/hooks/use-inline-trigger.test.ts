import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  beginRender,
  endRender,
  resetHookState,
} from '../../src/hooks/context.js';
import {
  useInlineTrigger,
  useMultiInlineTrigger,
  type TriggerConfig,
} from '../../src/hooks/use-inline-trigger.js';

function renderSingle<T>(config: TriggerConfig<T>) {
  beginRender();
  const completion = useInlineTrigger(config);
  endRender();
  return completion;
}

function renderMultiple<T>(configs: TriggerConfig<T>[]) {
  beginRender();
  const completion = useMultiInlineTrigger(configs);
  endRender();
  return completion;
}

describe('inline trigger hooks', () => {
  beforeEach(() => {
    resetHookState();
  });

  afterEach(() => {
    resetHookState();
  });

  it('keeps a single-trigger completion stable across equivalent renders', () => {
    const getItems = vi.fn(() => []);
    const first = renderSingle({
      trigger: '@',
      getItems,
      queryPattern: /[\w.-]/u,
    });
    const second = renderSingle({
      trigger: '@',
      getItems,
      queryPattern: /[\w.-]/u,
    });

    expect(second).toBe(first);
  });

  it('recreates a single-trigger completion when behavior changes', () => {
    const first = renderSingle({
      trigger: '@',
      getItems: () => [],
      minChars: 1,
    });
    const second = renderSingle({
      trigger: '#',
      getItems: () => [],
      minChars: 2,
    });

    expect(second).not.toBe(first);
  });

  it('keeps multi-trigger completion stable for equivalent configs', () => {
    const mentions = vi.fn(() => []);
    const tags = vi.fn(() => []);
    const first = renderMultiple([
      { trigger: '@', getItems: mentions },
      { trigger: '#', getItems: tags },
    ]);
    const second = renderMultiple([
      { trigger: '@', getItems: mentions },
      { trigger: '#', getItems: tags },
    ]);

    expect(second).toBe(first);
  });

  it('refreshes multi-trigger behavior when a source changes at the same length', () => {
    const first = renderMultiple([
      { trigger: '@', getItems: () => [] },
      { trigger: '#', getItems: () => [] },
    ]);
    const second = renderMultiple([
      { trigger: '@', getItems: () => [] },
      { trigger: '/', getItems: () => [] },
    ]);

    expect(second).not.toBe(first);
  });

  it('refreshes multi-trigger behavior when trigger count changes', () => {
    const getItems = vi.fn(() => []);
    const first = renderMultiple([{ trigger: '@', getItems }]);
    const second = renderMultiple([
      { trigger: '@', getItems },
      { trigger: '#', getItems },
    ]);

    expect(second).not.toBe(first);
  });
});
