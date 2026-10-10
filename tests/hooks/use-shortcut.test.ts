import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestHarness } from '../../src/testing/index.js';
import { Text } from '../../src/primitives/nodes.js';
import { createSignal } from '../../src/primitives/signal.js';
import { useShortcut, useCommand } from '../../src/hooks/use-command.js';
import { useApp } from '../../src/hooks/use-app.js';

const apps: ReturnType<typeof createTestHarness>[] = [];
afterEach(() => {
  for (const app of apps.splice(0)) app.cleanup();
  vi.restoreAllMocks();
});
function harness() {
  const app = createTestHarness();
  apps.push(app);
  return app;
}

describe('no-argument shortcut callbacks', () => {
  it('does not leak command context through keyboard dispatch or execute', () => {
    const app = harness();
    const handler = vi.fn();
    app.render(() => {
      useShortcut('q', handler, { id: 'test.action' });
      return Text({}, 'ready');
    });
    app.events.keyPress('q');
    app.app!.commands.execute('test.action');
    expect(handler.mock.calls).toEqual([[], []]);
  });

  it('updates callbacks after rerender and supports asynchronous actions', async () => {
    const app = harness();
    const [revision, setRevision] = createSignal(0);
    const first = vi.fn();
    const completed = vi.fn();
    const second = vi.fn(async () => { await Promise.resolve(); completed(); });
    app.render(() => {
      useShortcut('q', revision() === 0 ? first : second, { id: 'test.action' });
      return Text({}, String(revision()));
    });
    app.events.keyPress('q');
    setRevision(1);
    await app.flush();
    const result = app.app!.commands.execute('test.action');
    expect(result.status).toBe('handled');
    expect(first.mock.calls).toEqual([[]]);
    expect(second.mock.calls).toEqual([[]]);
    await second.mock.results[0]!.value;
    expect(completed).toHaveBeenCalledOnce();
  });

  it('allows app.exit to be passed directly without rejecting waitUntilExit', async () => {
    const app = harness();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    app.render(() => {
      useShortcut('q', useApp().exit);
      return Text({}, 'ready');
    });
    const exited = app.app!.waitUntilExit();
    app.events.keyPress('q');
    await expect(exited).resolves.toBeUndefined();
    expect(errors).not.toHaveBeenCalled();
  });

  it('still supplies context to explicit semantic command handlers', () => {
    const app = harness();
    const handler = vi.fn();
    app.render(() => {
      useCommand({ id: 'test.command', title: 'test', run: handler });
      return Text({}, 'ready');
    });
    app.app!.commands.execute('test.command');
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ mode: 'global', runtime: expect.any(Object) }));
  });
});
