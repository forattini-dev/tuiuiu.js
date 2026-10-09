import { describe, expect, it, vi } from 'vitest';
import { parseKeypress } from '../../src/core/hotkeys.js';
import { createInteractionKeyEvent, createInteractionRuntime } from '../../src/interaction/runtime.js';

function key(input: string) {
  const parsed = parseKeypress(input);
  return {
    type: 'key' as const,
    key: createInteractionKeyEvent(parsed.input, parsed.key),
  };
}

describe('InteractionRuntime', () => {
  function ambiguousRuntime(options: Parameters<typeof createInteractionRuntime>[0] = {}) {
    const calls: string[] = [];
    const runtime = createInteractionRuntime(options);
    let shortCommand: ReturnType<typeof runtime.registerCommand> | undefined;
    for (const id of ['short', 'long', 'plain']) {
      const registration = runtime.registerCommand({ id, title: id, run: () => { calls.push(id); } });
      if (id === 'short') shortCommand = registration;
    }
    const shortBinding = runtime.bind({ command: 'short', keys: 'g' });
    const longBinding = runtime.bind({ command: 'long', keys: ['g', 'g'] });
    runtime.bind({ command: 'plain', keys: 'x' });
    return { runtime, calls, longBinding, shortBinding, shortCommand: shortCommand! };
  }

  it('defers ambiguous exact matches and exposes their continuations', () => {
    const { runtime, calls } = ambiguousRuntime();
    const observer = vi.fn();
    runtime.subscribe(observer);
    expect(runtime.dispatch(key('g'))).toEqual({ status: 'handled' });
    expect(calls).toEqual([]);
    expect(runtime.inspect()).toMatchObject({
      pendingSequence: ['g'], deferredCommand: 'short',
      continuations: [{ command: 'long', keys: ['g'] }],
      diagnostics: [{ type: 'prefix-ambiguity', commands: ['short', 'long'], keys: ['g'] }],
    });
    expect(observer).toHaveBeenCalled();
    expect(runtime.dispatch(key('g'))).toEqual({ status: 'handled', command: 'long' });
    expect(calls).toEqual(['long']);
    expect(runtime.inspect().pendingSequence).toEqual([]);
    runtime.dispose();
  });

  it('executes the shorter command once after the timeout', async () => {
    vi.useFakeTimers();
    const { runtime, calls } = ambiguousRuntime({ sequenceTimeoutMs: 25 });
    try {
      runtime.dispatch(key('g'));
      await vi.advanceTimersByTimeAsync(26);
      expect(calls).toEqual(['short']);
      expect(runtime.inspect().pendingSequence).toEqual([]);
      await vi.advanceTimersByTimeAsync(100);
      expect(calls).toEqual(['short']);
    } finally { runtime.dispose(); vi.useRealTimers(); }
  });

  it('runs the deferred command and redispatches an unmatched chord', () => {
    const { runtime, calls } = ambiguousRuntime();
    runtime.dispatch(key('g'));
    expect(runtime.dispatch(key('x'))).toEqual({ status: 'handled', command: 'plain' });
    expect(calls).toEqual(['short', 'plain']);
    runtime.dispose();
  });

  it('preserves the last exact match while advancing a deeper prefix', async () => {
    vi.useFakeTimers();
    const { runtime, calls, longBinding } = ambiguousRuntime({ sequenceTimeoutMs: 25 });
    try {
      longBinding.update({ command: 'long', keys: ['g', 'g', 'g'] });
      runtime.dispatch(key('g'));
      runtime.dispatch(key('g'));
      expect(runtime.inspect().deferredCommand).toBe('short');
      await vi.advanceTimersByTimeAsync(51);
      expect(calls).toEqual(['short', 'short']);
      runtime.dispatch(key('g'));
      runtime.dispatch(key('g'));
      runtime.dispatch(key('x'));
      expect(calls).toEqual(['short', 'short', 'short', 'short', 'plain']);
    } finally { runtime.dispose(); vi.useRealTimers(); }
  });

  it('redispatches an unmatched chord in the mode opened by its fallback', () => {
    const { runtime, calls, shortCommand } = ambiguousRuntime();
    shortCommand.update({ id: 'short', title: 'Short', run: () => {
      calls.push('short');
      runtime.enter({ mode: 'modal', exclusive: true });
    } });
    runtime.registerCommand({ id: 'modal', title: 'Modal', run: () => { calls.push('modal'); } });
    runtime.bind({ command: 'modal', keys: 'x', mode: 'modal' });
    runtime.dispatch(key('g'));
    runtime.dispatch(key('x'));
    expect(calls).toEqual(['short', 'modal']);
    runtime.dispose();
  });

  it('supports explicit immediate resolution and preserves higher-priority exact bindings', () => {
    const { runtime, calls } = ambiguousRuntime({ sequenceResolution: 'immediate' });
    runtime.dispatch(key('g'));
    runtime.dispatch(key('g'));
    expect(calls).toEqual(['short', 'short']);
    expect(runtime.inspect().diagnostics[0]?.type).toBe('prefix-ambiguity');
    runtime.dispose();
    const ranked = ambiguousRuntime();
    ranked.runtime.bind({ command: 'short', keys: 'g', priority: 10 });
    ranked.runtime.dispatch(key('g'));
    expect(ranked.calls).toEqual(['short']);
    ranked.runtime.dispose();
  });

  it('does not execute a deferred command that was disabled, unbound or left its mode', async () => {
    vi.useFakeTimers();
    try {
      for (const change of ['disabled', 'when', 'unbound', 'mode', 'disposed']) {
        const { runtime, calls, shortCommand, shortBinding } = ambiguousRuntime({ sequenceTimeoutMs: 25 });
        runtime.dispatch(key('g'));
        if (change === 'disabled') {
          shortCommand.update({ id: 'short', title: 'Short', enabled: () => false,
            run: () => { calls.push('short'); } });
        } else if (change === 'when') shortBinding.update({ command: 'short', keys: 'g', when: () => false });
        else if (change === 'unbound') shortBinding.dispose();
        else if (change === 'mode') runtime.enter({ mode: 'modal', exclusive: true });
        else runtime.dispose();
        await vi.advanceTimersByTimeAsync(26);
        expect(calls).toEqual([]);
        runtime.dispose();
      }
    } finally { vi.useRealTimers(); }
  });

  it('does not interpret release events as sequence chords', () => {
    const { runtime, calls } = ambiguousRuntime();
    runtime.dispatch(key('g'));
    const release = key('g');
    release.key.phase = 'release';
    runtime.dispatch(release);
    expect(runtime.inspect().pendingSequence).toEqual(['g']);
    runtime.dispatch(key('g'));
    expect(calls).toEqual(['long']);
    runtime.dispose();
  });

  it('reports equivalent aliases and unresolved commands', () => {
    const runtime = createInteractionRuntime({ warnOnConflict: false });
    runtime.bind({ command: 'first', keys: 'control+k' });
    runtime.bind({ command: 'second', keys: ['ctrl+k', 'x'], mode: 'global' });
    expect(runtime.inspect().diagnostics.map((diagnostic) => diagnostic.type))
      .toEqual(['unresolved-command', 'prefix-ambiguity', 'unresolved-command']);
    runtime.dispose();
  });

  it.each([NaN, Infinity, -1])('rejects invalid sequenceTimeoutMs %s eagerly', (sequenceTimeoutMs) => {
    expect(() => createInteractionRuntime({ sequenceTimeoutMs })).toThrow(RangeError);
  });

  it('resolves a semantic command from a configured key', () => {
    const run = vi.fn();
    const runtime = createInteractionRuntime();
    runtime.registerCommand({ id: 'save', title: 'Save', run });
    runtime.bind({ command: 'save', keys: 'ctrl+s' });

    expect(runtime.dispatch(key('\x13'))).toEqual({ status: 'handled', command: 'save' });
    expect(run).toHaveBeenCalledOnce();
  });

  it('prefers the top mode and exact target over global bindings', () => {
    const calls: string[] = [];
    const runtime = createInteractionRuntime();
    for (const id of ['global', 'modal', 'target']) {
      runtime.registerCommand({ id, title: id, run: () => { calls.push(id); } });
    }
    runtime.bind({ command: 'global', keys: 'escape' });
    runtime.bind({ command: 'modal', keys: 'escape', mode: 'modal' });
    runtime.bind({ command: 'target', keys: 'escape', mode: 'modal', target: 'rename' });
    runtime.enter({ mode: 'modal', target: 'rename' });

    runtime.dispatch(key('\x1b'));
    expect(calls).toEqual(['target']);
  });

  it('removes exact leases safely when cleanup occurs out of order', () => {
    const runtime = createInteractionRuntime();
    const modal = runtime.enter({ mode: 'modal', exclusive: true });
    const autocomplete = runtime.enter({ mode: 'autocomplete', exclusive: true });

    modal.dispose();
    modal.dispose();
    expect(runtime.inspect().mode).toBe('autocomplete');

    autocomplete.dispose();
    expect(runtime.inspect().mode).toBe('global');
  });

  it('blocks lower modes when the top mode is exclusive', () => {
    const run = vi.fn();
    const runtime = createInteractionRuntime();
    runtime.registerCommand({ id: 'quit', title: 'Quit', run });
    runtime.bind({ command: 'quit', keys: 'q' });
    runtime.enter({ mode: 'modal', exclusive: true });

    expect(runtime.dispatch(key('q'))).toEqual({ status: 'blocked' });
    expect(run).not.toHaveBeenCalled();
  });

  it('runs mode handlers before blocking an exclusive mode', () => {
    const handler = vi.fn(() => true);
    const runtime = createInteractionRuntime();
    runtime.registerHandler(handler, { mode: 'prompt' });
    runtime.enter({ mode: 'prompt', exclusive: true });

    expect(runtime.dispatch(key('x'))).toEqual({ status: 'handled' });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('uses priority and then latest registration as deterministic tie breakers', () => {
    const calls: string[] = [];
    const runtime = createInteractionRuntime({ warnOnConflict: false });
    for (const id of ['old', 'latest', 'priority']) {
      runtime.registerCommand({ id, title: id, run: () => { calls.push(id); } });
    }
    runtime.bind({ command: 'old', keys: 'x' });
    runtime.bind({ command: 'latest', keys: 'x' });
    runtime.bind({ command: 'priority', keys: 'x', priority: 10 });

    runtime.dispatch(key('x'));
    expect(calls).toEqual(['priority']);
  });

  it('reports conflicts and unresolved bindings through inspection', () => {
    const runtime = createInteractionRuntime({ warnOnConflict: false });
    runtime.bind({ command: 'first', keys: 'x', mode: 'modal' });
    runtime.bind({ command: 'second', keys: 'x', mode: 'modal' });

    expect(runtime.inspect().conflicts).toEqual([{
      mode: 'modal',
      target: undefined,
      key: 'x',
      priority: 0,
      commands: ['first', 'second'],
    }]);
    expect(runtime.dispatch(key('x'))).toEqual({ status: 'unhandled' });
  });

  it('honors enabled and when predicates', () => {
    const calls: string[] = [];
    const runtime = createInteractionRuntime();
    runtime.registerCommand({ id: 'disabled', title: 'Disabled', enabled: () => false, run: () => { calls.push('disabled'); } });
    runtime.registerCommand({ id: 'fallback', title: 'Fallback', run: () => { calls.push('fallback'); } });
    runtime.bind({ command: 'fallback', keys: 'x', priority: 0 });
    runtime.bind({ command: 'disabled', keys: 'x', priority: 1 });
    runtime.bind({ command: 'disabled', keys: 'y', when: () => false });

    expect(runtime.dispatch(key('x'))).toEqual({ status: 'handled', command: 'fallback' });
    expect(runtime.dispatch(key('y'))).toEqual({ status: 'unhandled' });
    expect(calls).toEqual(['fallback']);
  });

  it('routes async command failures to the runtime error handler', async () => {
    const error = new Error('boom');
    const onCommandError = vi.fn();
    const runtime = createInteractionRuntime({ onCommandError });
    const command = { id: 'async', title: 'Async', run: async () => { throw error; } };
    runtime.registerCommand(command);
    runtime.bind({ command: 'async', keys: 'x' });

    runtime.dispatch(key('x'));
    await Promise.resolve();
    expect(onCommandError).toHaveBeenCalledWith(error, command);
  });

  it('executes a semantic command directly for discoverability surfaces', () => {
    const run = vi.fn();
    const runtime = createInteractionRuntime();
    runtime.registerCommand({ id: 'open', title: 'Open', run });

    expect(runtime.execute('open', { type: 'command', source: 'palette' }))
      .toEqual({ status: 'handled', command: 'open' });
    expect(run).toHaveBeenCalledWith(expect.objectContaining({
      event: { type: 'command', source: 'palette' },
      runtime,
    }));
    expect(runtime.execute('missing')).toEqual({ status: 'unhandled' });
  });

  it('notifies subscribers when the inspectable registry changes', () => {
    const runtime = createInteractionRuntime();
    const snapshots: string[][] = [];
    const unsubscribe = runtime.subscribe((snapshot) => {
      snapshots.push(snapshot.commands.map((command) => command.id));
    });

    const registration = runtime.registerCommand({ id: 'save', title: 'Save', run: () => {} });
    registration.update({ id: 'save', title: 'Save all', run: () => {} });
    registration.dispose();
    unsubscribe();
    runtime.registerCommand({ id: 'ignored', title: 'Ignored', run: () => {} });

    expect(snapshots).toEqual([['save'], ['save'], []]);
  });

  it('resolves ordered key sequences without leaking the leader', () => {
    const run = vi.fn();
    const runtime = createInteractionRuntime();
    runtime.registerCommand({ id: 'comment', title: 'Comment', run });
    runtime.bind({ command: 'comment', keys: ['ctrl+k', 'x'] });

    expect(runtime.dispatch(key('\x0b'))).toEqual({ status: 'handled' });
    expect(run).not.toHaveBeenCalled();
    expect(runtime.dispatch(key('x'))).toEqual({ status: 'handled', command: 'comment' });
    expect(run).toHaveBeenCalledOnce();
  });

  it('expires incomplete sequences and retries a mismatched chord normally', async () => {
    vi.useFakeTimers();
    try {
      const calls: string[] = [];
      const runtime = createInteractionRuntime({ sequenceTimeoutMs: 25 });
      runtime.registerCommand({ id: 'sequence', title: 'Sequence', run: () => { calls.push('sequence'); } });
      runtime.registerCommand({ id: 'plain', title: 'Plain', run: () => { calls.push('plain'); } });
      runtime.bind({ command: 'sequence', keys: ['g', 'g'] });
      runtime.bind({ command: 'plain', keys: 'x' });

      runtime.dispatch(key('g'));
      expect(runtime.dispatch(key('x'))).toEqual({ status: 'handled', command: 'plain' });
      runtime.dispatch(key('g'));
      await vi.advanceTimersByTimeAsync(26);
      expect(runtime.dispatch(key('g'))).toEqual({ status: 'handled' });
      expect(calls).toEqual(['plain']);
    } finally {
      vi.useRealTimers();
    }
  });
});
