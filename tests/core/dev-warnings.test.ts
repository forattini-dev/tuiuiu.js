import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { render } from '../../src/app/render-loop.js';
import {
  __resetDevWarningsForTesting,
  warnIfCreateSignalDuringComponentRender,
} from '../../src/core/dev-warnings.js';
import { clearCommittedFrameSnapshot } from '../../src/core/frame.js';
import { resetTerminalFocusState } from '../../src/core/terminal-focus.js';
import { darkTheme, lightTheme, setTheme } from '../../src/core/theme.js';
import { beginRender, clearInputHandlers, endRender, resetHookState, setAppContext, __resetHookWarningsForTesting } from '../../src/hooks/context.js';
import { useState } from '../../src/hooks/use-state.js';
import { cleanupApp } from '../../src/hooks/use-app.js';
import { Accordion } from '../../src/molecules/collapsible.js';
import { Tabs } from '../../src/molecules/tabs.js';
import { Modal } from '../../src/organisms/modal.js';
import { ScrollList } from '../../src/organisms/scroll-list.js';
import { Box, Static, Text } from '../../src/primitives/nodes.js';
import { createSignal } from '../../src/primitives/signal.js';
import { AppShell, Page } from '../../src/templates/app.js';

function createMockStdin(): NodeJS.ReadStream {
  const emitter = new EventEmitter();
  const stdin = Object.assign(emitter, {
    isTTY: true,
    setRawMode: vi.fn(),
    resume: vi.fn(),
    pause: vi.fn(),
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    emit: emitter.emit.bind(emitter),
  });

  return stdin as unknown as NodeJS.ReadStream;
}

function createMockStdout(): NodeJS.WriteStream & { output: string } {
  let output = '';
  const emitter = new EventEmitter();
  const stream = Object.assign(emitter, {
    columns: 80,
    rows: 24,
    isTTY: true,
    write: vi.fn((chunk: string | Buffer) => {
      output += chunk.toString();
      return true;
    }),
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    once: emitter.once.bind(emitter),
    emit: emitter.emit.bind(emitter),
  });

  Object.defineProperty(stream, 'output', {
    get: () => output,
    set: (value: string) => {
      output = value;
    },
  });

  return stream as unknown as NodeJS.WriteStream & { output: string };
}

describe('developer warnings', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    __resetDevWarningsForTesting();
    __resetHookWarningsForTesting();
    resetHookState();
    clearInputHandlers();
    setAppContext(null);
    clearCommittedFrameSnapshot();
    cleanupApp();
    resetTerminalFocusState();
    setTheme(darkTheme);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    __resetDevWarningsForTesting();
    __resetHookWarningsForTesting();
    resetHookState();
    clearInputHandlers();
    setAppContext(null);
    clearCommittedFrameSnapshot();
    cleanupApp();
    resetTerminalFocusState();
  });

  describe('createSignal guardrail', () => {
    it('warns when createSignal is called during component render from external code', () => {
      const App = () => {
        createSignal(0);
        return Box({}, Text({}, 'warning'));
      };

      beginRender('component');
      try {
        App();
      } finally {
        endRender();
      }

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0]?.[0]).toContain('createSignal() was called during component render');
      expect(warnSpy.mock.calls[0]?.[0]).toContain('useState()');
      expect(warnSpy.mock.calls[0]?.[0]).toContain('docs/resources/common-mistakes.md#signals-inside-component-render');
    });

    it('deduplicates the same createSignal warning by callsite', () => {
      const App = () => {
        createSignal(0);
        return Text({}, 'duplicate');
      };

      for (let index = 0; index < 2; index++) {
        beginRender('component');
        try {
          App();
        } finally {
          endRender();
        }
      }

      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('does not warn for useState during component render', () => {
      const App = () => {
        const [count] = useState(1);
        return Text({}, String(count()));
      };

      beginRender('component');
      try {
        App();
      } finally {
        endRender();
      }

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('preserves Windows drive letters when parsing callsites', () => {
      beginRender('component');
      try {
        warnIfCreateSignalDuringComponentRender(
          'Error\n    at App (C:\\consumer\\src\\app.ts:17:9)',
          import.meta.url,
        );
      } finally {
        endRender();
      }

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0]?.[0]).toContain(
        'C:\\consumer\\src\\app.ts:17',
      );
    });
  });

  describe('runtime theme switching', () => {
    it('allows setTheme after render() has started', () => {
      const instance = render(() => Text({}, 'hello'), {
        stdin: createMockStdin(),
        stdout: createMockStdout(),
        clearOnStart: false,
      });

      setTheme(lightTheme);

      expect(warnSpy).not.toHaveBeenCalled();

      instance.unmount();
    });

    it('does not warn when setTheme is called before render()', () => {
      setTheme(lightTheme);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('API pattern guardrails', () => {
    it('warns when props-pattern components are used with variadic children', () => {
      (Page as (...args: any[]) => unknown)(
        { title: 'Settings', children: Text({}, 'Correct child') } as any,
        Text({}, 'Wrong extra child') as any,
      );
      (AppShell as (...args: any[]) => unknown)(
        { header: Text({}, 'Header'), children: Text({}, 'Main') } as any,
        Text({}, 'Wrong extra child') as any,
      );

      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(warnSpy.mock.calls[0]?.[0]).toContain('Page does not accept variadic children');
      expect(warnSpy.mock.calls[1]?.[0]).toContain('AppShell does not accept variadic children');
      expect(warnSpy.mock.calls[0]?.[0]).toContain('docs/resources/common-mistakes.md#api-pattern-mismatch');
    });

    it('warns when render-function components receive a vnode instead of a function', () => {
      ScrollList({
        items: [],
        height: 4,
        children: Text({}, 'Wrong') as any,
      });

      Static({
        items: [],
        children: Text({}, 'Wrong') as any,
      });

      // Filter to only API-pattern warnings (ignore hook-outside-render noise)
      const apiWarnings = warnSpy.mock.calls.filter(
        (args: unknown[]) => typeof args[0] === 'string' && args[0].includes('expects `children` to be a render function')
      );
      expect(apiWarnings).toHaveLength(2);
      expect(apiWarnings[0]?.[0]).toContain('ScrollList expects `children` to be a render function');
      expect(apiWarnings[1]?.[0]).toContain('Static expects `children` to be a render function');
    });

    it('warns when data-driven components receive top-level content props', () => {
      Tabs({
        tabs: [{ key: 'home', label: 'Home', content: Text({}, 'Home') }],
        children: Text({}, 'Wrong'),
      } as any);

      Accordion({
        sections: [{ key: 'general', title: 'General', content: Text({}, 'Section') }],
        children: Text({}, 'Wrong'),
      } as any);

      // Filter to only data-driven warnings (ignore hook-outside-render noise)
      const dataWarnings = warnSpy.mock.calls.filter(
        (args: unknown[]) => typeof args[0] === 'string' && args[0].includes('is data-driven')
      );
      expect(dataWarnings).toHaveLength(2);
      expect(dataWarnings[0]?.[0]).toContain('Tabs is data-driven');
      expect(dataWarnings[1]?.[0]).toContain('Accordion is data-driven');
    });

    it('warns when Modal receives children instead of content', () => {
      Modal({
        title: 'Confirm',
        content: Text({}, 'Correct'),
        children: Text({}, 'Wrong'),
      } as any);

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0]?.[0]).toContain('Modal expects `content`, not `children`');
      expect(warnSpy.mock.calls[0]?.[0]).toContain('docs/resources/common-mistakes.md#api-pattern-mismatch');
    });
  });
});
