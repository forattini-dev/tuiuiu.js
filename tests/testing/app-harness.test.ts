import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestHarness, stripAnsi, type TestHarness } from '../../src/testing/index.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import { createSignal } from '../../src/primitives/signal.js';
import { useConst } from '../../src/hooks/use-const.js';
import { useEffect } from '../../src/hooks/use-effect.js';
import { useInput } from '../../src/hooks/use-input.js';
import { useTerminalSize } from '../../src/hooks/use-terminal-size.js';
import { useMouse } from '../../src/hooks/use-mouse.js';
import { useCommand, useCommandBinding } from '../../src/hooks/use-command.js';
import { TextInput } from '../../src/atoms/text-input.js';
import { renderFrameToString } from '../../src/core/renderer.js';

const harnesses: TestHarness[] = [];
function harness(options: Parameters<typeof createTestHarness>[0] = {}) {
  const result = createTestHarness({ columns: 20, rows: 4, ...options });
  harnesses.push(result);
  return result;
}
afterEach(() => {
  for (const result of harnesses) result.cleanup();
  harnesses.length = 0;
  vi.useRealTimers();
});

describe('production app test harness', () => {
  it.each([true, false])('presents the physical cursor anchor (delta=%s)', (useDeltaRenderer) => {
    const result = harness({ renderOptions: { useDeltaRenderer, showHardwareCursor: true } });
    result.render(() => TextInput({ initialValue: '界' }));
    expect(result.getFrame()?.cursorAnchor).not.toBeNull();
    expect(result.terminal.getCursor()).toEqual(result.getFrame()?.cursorAnchor);
    expect(result.terminal.isCursorVisible()).toBe(true);
  });
  it.each([true, false])('captures the production frame and styles (delta=%s)', (useDeltaRenderer) => {
    const result = harness({ renderOptions: { useDeltaRenderer } });
    result.render(() => Box({ padding: 1 }, Text({ color: 'red', bold: true }, 'Hello e\u0301😀界')));
    expect(result.terminal.getCell(1, 1)).toMatchObject({ char: 'H', fg: 'red', bold: true });
    expect(result.terminal.getCell(7, 1)?.char).toBe('e\u0301');
    expect(result.terminal.getCell(8, 1)?.char).toBe('😀');
    expect(result.terminal.getCell(9, 1)?.char).toBe('');
    const frame = result.getFrame()!;
    const expected = stripAnsi(renderFrameToString(frame)).trimEnd();
    const actual = result.getScreen().map((line) => line.trimEnd()).join('\n').trimEnd();
    expect(actual).toBe(expected);
  });

  it('keeps owner state through input-driven rerenders', async () => {
    const result = harness();
    const factory = vi.fn(() => createSignal(0));
    result.render(() => {
      const [count, setCount] = useConst(factory);
      useInput((input) => { if (input === 'a') setCount(count() + 1); });
      return Text({}, `count: ${count()}`);
    });
    result.events.keyPress('a');
    const { flush } = result;
    await flush();
    result.events.keyPress('a');
    await flush();
    expect(result.getScreenString()).toContain('count: 2');
    expect(factory).toHaveBeenCalledOnce();
  });

  it('routes Unicode input and bracketed paste to the real TextInput', async () => {
    const result = harness({ enableBracketedPaste: true });
    const [value, setValue] = createSignal('');
    result.render(() => TextInput({ onChange: setValue }));
    await result.events.type('😀');
    await result.flush();
    expect(value()).toBe('😀');
    result.events.paste('界e\u0301');
    await result.flush();
    expect(value()).toBe('😀界e\u0301');
    expect(result.getScreenString()).toContain('😀界e\u0301');
  });

  it('delivers resize events through the production terminal-size hook', async () => {
    const result = harness();
    result.render(() => {
      const { columns, rows } = useTerminalSize();
      return Text({}, `${columns}x${rows}`);
    });
    for (const [columns, rows] of [[10, 2], [30, 6], [20, 4]]) {
      result.events.resize(columns!, rows!);
      await result.flush();
      expect(result.getScreen()[0]?.trim()).toBe(`${columns}x${rows}`);
      expect(result.getFrame()?.info.viewport).toEqual({ width: columns, height: rows });
    }
  });

  it('routes mouse input to mounted hooks', async () => {
    const result = harness({ enableMouse: true });
    const handler = vi.fn();
    result.render(() => {
      useMouse(handler);
      return Text({}, 'mouse');
    });
    result.events.click(3, 1);
    await result.flush();
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ x: 3, y: 1, action: 'click' }));
    result.events.resize(30, 6);
    await result.flush();
    result.events.click(4, 2);
    await result.flush();
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ x: 4, y: 2, action: 'release' }));
  });

  it('isolates input, frames and disposal across concurrent harnesses', async () => {
    const first = harness();
    const second = harness();
    const firstInput = vi.fn();
    const secondInput = vi.fn();
    first.render(() => { useInput(firstInput); return Text({}, 'first'); });
    second.render(() => { useInput(secondInput); return Text({}, 'second'); });
    first.events.keyPress('a');
    await first.flush();
    expect(firstInput).toHaveBeenCalledOnce();
    expect(secondInput).not.toHaveBeenCalled();
    expect(first.getFrame()?.root).not.toBe(second.getFrame()?.root);
    first.cleanup();
    second.events.keyPress('b');
    await second.flush();
    expect(secondInput).toHaveBeenCalledOnce();
    expect(second.getScreenString()).toContain('second');
    expect(first.getFrame()).toBeNull();
  });

  it('disposes owned effects on replacement, reset and repeated cleanup', () => {
    const result = harness();
    const dispose = vi.fn();
    const root = () => { useEffect(() => dispose); return Text({}, 'owned'); };
    result.render(root);
    result.render(root);
    expect(dispose).toHaveBeenCalledTimes(1);
    result.reset();
    expect(dispose).toHaveBeenCalledTimes(2);
    expect(result.app).toBeNull();
    result.render(root);
    result.cleanup();
    result.cleanup();
    expect(dispose).toHaveBeenCalledTimes(3);
    expect(result.getScreenString().trim()).toBe('');
  });

  it('recovers after a failed initial render and bounds flush attempts', async () => {
    const result = harness();
    expect(() => result.render(() => { throw new Error('broken'); })).toThrow('broken');
    expect(result.app).toBeNull();
    result.render(Text({}, 'recovered'));
    expect(result.getScreenString()).toContain('recovered');
    await expect(result.flush(1)).rejects.toThrow(RangeError);
  });

  it('resolves g/gg after a production rerender refreshes the command hooks', async () => {
    const result = harness();
    const calls: string[] = [];
    result.render(() => {
      useCommand({ id: 'short', title: 'Short', run: () => { calls.push('short'); } });
      useCommand({ id: 'long', title: 'Long', run: () => { calls.push('long'); } });
      useCommandBinding({ command: 'short', keys: 'g' });
      useCommandBinding({ command: 'long', keys: ['g', 'g'] });
      return Text({}, 'commands');
    });
    result.events.keyPress('g');
    await result.flush();
    expect(result.app?.commands.inspect().pendingSequence).toEqual(['g']);
    result.events.keyPress('g');
    await result.flush();
    expect(calls).toEqual(['long']);
  });

  it('applies the app-owned immediate sequence policy', () => {
    const result = harness({ renderOptions: { interaction: { sequenceResolution: 'immediate' } } });
    const run = vi.fn();
    result.render(() => {
      useCommand({ id: 'short', title: 'Short', run });
      useCommand({ id: 'long', title: 'Long', run: () => {} });
      useCommandBinding({ command: 'short', keys: 'g' });
      useCommandBinding({ command: 'long', keys: ['g', 'g'] });
      return Text({}, 'commands');
    });
    result.events.keyPress('g');
    expect(run).toHaveBeenCalledOnce();
  });

  it('allows fake timers to control deferred commands and cancels them on cleanup', async () => {
    vi.useFakeTimers();
    const result = harness({ renderOptions: { interaction: { sequenceTimeoutMs: 25 } } });
    const [value, setValue] = createSignal(0);
    result.render(() => {
      useCommand({ id: 'short', title: 'Short', run: () => setValue(value() + 1) });
      useCommand({ id: 'long', title: 'Long', run: () => setValue(value() + 2) });
      useCommandBinding({ command: 'short', keys: 'g' });
      useCommandBinding({ command: 'long', keys: ['g', 'g'] });
      return Text({}, `value: ${value()}`);
    });
    result.events.keyPress('g');
    await result.flush();
    expect(value()).toBe(0);
    await vi.advanceTimersByTimeAsync(26);
    await result.flush();
    expect(result.getScreenString()).toContain('value: 1');
    result.events.keyPress('g');
    result.cleanup();
    await vi.advanceTimersByTimeAsync(100);
    expect(value()).toBe(1);
  });
});
