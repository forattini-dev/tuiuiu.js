import { describe, expect, it, vi } from 'vitest';
import { createCompletionSession } from '../../src/interaction/completion.js';

describe('createCompletionSession', () => {
  it('keeps only the newest asynchronous result and preserves identity navigation', async () => {
    const resolvers: Array<(items: Array<{ id: string }>) => void> = [];
    const session = createCompletionSession({
      getKey: (item: { id: string }) => item.id,
      getItems: () => new Promise<Array<{ id: string }>>((resolve) => resolvers.push(resolve)),
    });
    const first = session.complete({ start: 0, end: 1, query: 'a' }, undefined);
    const second = session.complete({ start: 0, end: 2, query: 'ab' }, undefined);
    resolvers[1]!([{ id: 'new' }, { id: 'next' }]);
    await second;
    resolvers[0]!([{ id: 'stale' }]);
    await first;

    expect(session.snapshot().items).toEqual([{ id: 'new' }, { id: 'next' }]);
    expect(session.move(1)).toBe(true);
    expect(session.accept()).toEqual({ id: 'next' });
    expect(session.snapshot().status).toBe('idle');
  });

  it('aborts pending work on cancel and isolates provider failures', async () => {
    const onError = vi.fn();
    const session = createCompletionSession<{ id: string }, string>({
      getKey: (item) => item.id,
      getItems: async () => { throw new Error('nope'); },
      onError,
    });
    await session.complete({ start: 0, end: 0, query: '' }, undefined);
    expect(session.snapshot().status).toBe('error');
    expect(onError).toHaveBeenCalledOnce();
    session.cancel();
    expect(session.snapshot().status).toBe('idle');
  });
});
