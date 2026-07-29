import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getCommandRegistry,
  registerCommand,
} from '../../src/core/command-palette.js';
import {
  getDeltaRenderer,
} from '../../src/core/delta-render.js';
import {
  clearError,
  getError,
  onError,
  setError,
} from '../../src/core/error-boundary.js';
import { getEventBus } from '../../src/core/events.js';
import { getFocusZoneManager } from '../../src/core/focus.js';
import {
  getKeyBindingRegistry,
  handleKeyEvent,
} from '../../src/core/keybindings.js';
import {
  createRouter,
  getRouter,
  setRouter,
} from '../../src/core/router.js';
import {
  createRuntimeScope,
  destroyRuntimeScope,
  resetDefaultRuntimeScope,
  runInRuntimeScope,
  type RuntimeScope,
} from '../../src/core/runtime-scope.js';
import {
  createScreen,
  getScreenManager,
} from '../../src/core/screen.js';
import { getTransitionManager } from '../../src/core/transitions.js';

function createOutput(): NodeJS.WriteStream {
  const output = new EventEmitter() as EventEmitter & {
    columns: number;
    rows: number;
    isTTY: boolean;
    write: () => boolean;
  };
  output.columns = 80;
  output.rows = 24;
  output.isTTY = true;
  output.write = () => true;
  return output as unknown as NodeJS.WriteStream;
}

describe('per-runtime convenience services', () => {
  const scopes: RuntimeScope[] = [];

  function createScope(): RuntimeScope {
    const scope = createRuntimeScope();
    scopes.push(scope);
    return scope;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    resetDefaultRuntimeScope();
  });

  afterEach(() => {
    for (const scope of scopes.splice(0)) {
      destroyRuntimeScope(scope);
    }
    resetDefaultRuntimeScope();
    vi.useRealTimers();
  });

  it('inherits declarative defaults without sharing mutable service state', async () => {
    const action = vi.fn();
    registerCommand({
      id: 'shared-command',
      label: 'Shared command',
      keybinding: 'ctrl+s',
      action,
    });

    const defaultRouter = createRouter({
      routes: [
        { path: '/', component: () => null },
        { path: '/first', component: () => null },
      ],
    });
    await defaultRouter.push('/');
    setRouter(defaultRouter);

    const defaultScreen = createScreen(() => null, { title: 'Default' });
    await getScreenManager().push(defaultScreen, { animate: false });
    const inheritedError = new Error('inherited default');
    setError(inheritedError);

    const first = createScope();
    const second = createScope();

    const firstServices = runInRuntimeScope(first, () => ({
      commands: getCommandRegistry(),
      keys: getKeyBindingRegistry(),
      router: getRouter(),
      screens: getScreenManager(),
      transitions: getTransitionManager(),
      events: getEventBus(),
      focus: getFocusZoneManager(),
      renderer: getDeltaRenderer({ stdout: createOutput() }),
    }));
    const secondServices = runInRuntimeScope(second, () => ({
      commands: getCommandRegistry(),
      keys: getKeyBindingRegistry(),
      router: getRouter(),
      screens: getScreenManager(),
      transitions: getTransitionManager(),
      events: getEventBus(),
      focus: getFocusZoneManager(),
      renderer: getDeltaRenderer({ stdout: createOutput() }),
    }));

    expect(firstServices.commands).not.toBe(secondServices.commands);
    expect(firstServices.keys).not.toBe(secondServices.keys);
    expect(firstServices.router).not.toBe(secondServices.router);
    expect(firstServices.screens).not.toBe(secondServices.screens);
    expect(firstServices.transitions).not.toBe(secondServices.transitions);
    expect(firstServices.events).not.toBe(secondServices.events);
    expect(firstServices.focus).not.toBe(secondServices.focus);
    expect(firstServices.renderer).not.toBe(secondServices.renderer);

    for (const services of [firstServices, secondServices]) {
      expect(services.commands.get('shared-command')).toBeDefined();
      expect(
        services.keys.getAll().some(binding => binding.commandId === 'shared-command'),
      ).toBe(true);
      expect(services.router?.currentRoute?.path).toBe('/');
      expect(services.screens.stackSize).toBe(1);
    }
    runInRuntimeScope(first, () => expect(getError()).toBe(inheritedError));
    runInRuntimeScope(second, () => expect(getError()).toBe(inheritedError));

    await runInRuntimeScope(first, async () => {
      expect(await handleKeyEvent('s', { ctrl: true })).toBe(true);
      expect(getCommandRegistry().getRecent().map(command => command.id))
        .toEqual(['shared-command']);
      getCommandRegistry().setEnabled('shared-command', false);
      await getRouter()?.push('/first');
      await getScreenManager().push(
        createScreen(() => null, { title: 'First only' }),
        { animate: false },
      );
      setError(new Error('first only'));
      getFocusZoneManager().createZone({ id: 'first-zone' });
    });

    expect(action).toHaveBeenCalledTimes(1);
    runInRuntimeScope(second, () => {
      expect(getCommandRegistry().getRecent()).toEqual([]);
      expect(getCommandRegistry().get('shared-command')?.enabled).toBe(true);
      expect(getRouter()?.currentRoute?.path).toBe('/');
      expect(getScreenManager().stackSize).toBe(1);
      expect(getError()).toBe(inheritedError);
      expect(getFocusZoneManager().getZone('first-zone')).toBeNull();
    });
  });

  it('keeps listeners local and clears them when a runtime is destroyed', () => {
    clearError();
    const first = createScope();
    const second = createScope();
    const firstEvent = vi.fn();
    const secondEvent = vi.fn();
    const firstError = vi.fn();
    const secondError = vi.fn();

    runInRuntimeScope(first, () => {
      getEventBus().on('refresh', firstEvent);
      onError(firstError);
    });
    runInRuntimeScope(second, () => {
      getEventBus().on('refresh', secondEvent);
      onError(secondError);
    });

    runInRuntimeScope(first, () => {
      getEventBus().broadcast('refresh');
      setError(new Error('first'));
    });

    expect(firstEvent).toHaveBeenCalledTimes(1);
    expect(secondEvent).not.toHaveBeenCalled();
    expect(firstError).toHaveBeenCalledTimes(1);
    expect(secondError).not.toHaveBeenCalled();

    const ownedBus = runInRuntimeScope(first, () => getEventBus());
    destroyRuntimeScope(first);
    ownedBus.broadcast('refresh');

    expect(firstEvent).toHaveBeenCalledTimes(1);
  });
});
