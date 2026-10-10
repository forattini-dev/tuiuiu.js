import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTextInput, TextInput, useTextInputState } from '../../src/atoms/text-input.js';
import type { Key } from '../../src/hooks/types.js';
import { createTestHarness } from '../../src/dev-tools/testing.js';
import { renderFrameToCellBuffer } from '../../src/core/delta-render.js';
import { renderTestComponent } from '../../src/testing/component.js';
import { createEffect } from '../../src/primitives/signal.js';
import { getCursorIndexFromColumn } from '../../src/atoms/text-input-model.js';
import type { BackgroundTaskHandle } from '../../src/utils/background-executor.js';

const inputs: ReturnType<typeof createTextInput>[] = [];
const apps: ReturnType<typeof createTestHarness>[] = [];
afterEach(() => {
  for (const app of apps.splice(0)) app.cleanup();
  for (const input of inputs.splice(0)) input.dispose();
});
function input(options: Parameters<typeof createTextInput>[0] = {}) {
  const state = createTextInput(options);
  inputs.push(state);
  return state;
}
function key(state: ReturnType<typeof createTextInput>, key: Partial<Key>, text = '') {
  state.handleInput(text, key as Key);
}

describe('TextInput editor integration', () => {
  it.each(['😀', 'é', '👩‍💻', '🇧🇷'])('selects, replaces and restores a backward %s selection', grapheme => {
    const state = input({ initialValue: `a${grapheme}b` });
    key(state, { leftArrow: true, shift: true });
    key(state, { leftArrow: true, shift: true });
    expect(state.selection()).toMatchObject({ anchor: state.value().length, head: 1, text: `${grapheme}b` });
    state.insertText('X');
    expect(state.value()).toBe('aX');
    expect(state.undo()).toBe(true);
    expect(state.selection()).toMatchObject({ head: 1, text: `${grapheme}b` });
    expect(state.redo()).toBe(true);
    expect(state.value()).toBe('aX');
  });

  it.each([{ backspace: true }, { delete: true }])('deletes a selection even at a document edge (%o)', deletion => {
    const state = input({ initialValue: 'abc' });
    state.setSelection(3, 0);
    key(state, deletion);
    expect(state.value()).toBe('');
    state.undo();
    expect(state.selection()).toMatchObject({ anchor: 3, head: 0 });
  });

  it('collapses selections to their directional edge and preserves legacy Ctrl+A/E', () => {
    const state = input({ initialValue: 'abcd' });
    state.setSelection(1, 3);
    key(state, { leftArrow: true });
    expect(state.selection()).toMatchObject({ anchor: 1, head: 1 });
    state.setSelection(1, 3);
    key(state, { rightArrow: true });
    expect(state.cursorPosition()).toBe(3);
    key(state, { ctrl: true }, 'a');
    expect(state.cursorPosition()).toBe(0);
    key(state, { ctrl: true, shift: true }, 'e');
    expect(state.selection().text).toBe('abcd');
    key(state, { escape: true });
    expect(state.selection().text).toBe('');
  });

  it('restores atomic segments and selection together, including text-identical metadata edits', () => {
    const state = input();
    const payload = { file: 'test.ts' };
    state.insertSegment({ id: 'file', kind: 'file', displayText: '@test', payload });
    const original = state.segments();
    state.setSelection(2, 2);
    expect(state.selection().text).toBe('');
    state.setSelection(2, 4);
    expect(state.selection()).toMatchObject({ start: 0, end: 5 });
    state.insertSegment({ id: 'other', kind: 'reference', displayText: '@test' });
    expect(state.value()).toBe('@test');
    expect(state.segments()[0]!.id).toBe('other');
    state.undo();
    expect(state.segments()).toEqual(original);
    expect(state.segments()[0]!.payload).toBe(payload);
    expect(state.selection().text).toBe('@test');
    state.redo();
    expect(state.segments()[0]!.id).toBe('other');
    key(state, { backspace: true });
    expect(state.value()).toBe('');
    state.undo();
    expect(state.segments()[0]!.id).toBe('other');
  });

  it('publishes atomic reactive snapshots and exactly one callback per edit or restore', () => {
    const onChange = vi.fn();
    const onSegmentsChange = vi.fn();
    const state = input({ onChange, onSegmentsChange });
    const observed: string[] = [];
    const release = createEffect(() => {
      observed.push(`${state.value()}:${state.segments().map(segment => segment.displayText).join(',')}`);
    });
    state.insertSegment({ kind: 'file', displayText: '@file' });
    state.undo(); state.redo();
    release();
    expect(observed).toEqual([':', '@file:@file', ':', '@file:@file']);
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onSegmentsChange).toHaveBeenCalledTimes(3);
  });

  it('bounds undo, invalidates redo on edits, and does not record no-ops', () => {
    const state = input({ undoLimit: 2 });
    state.insertText('a'); state.insertText('b'); state.insertText('c');
    state.undo(); state.undo();
    expect(state.value()).toBe('a');
    expect(state.undo()).toBe(false);
    expect(state.insertText('')).toBe(false);
    expect(state.canRedo()).toBe(true);
    state.insertText('X');
    expect(state.canRedo()).toBe(false);
    const disabled = input({ undoLimit: 0 });
    disabled.insertText('X');
    expect(disabled.undo()).toBe(false);
    state.updateOptions({ undoLimit: 0 });
    expect(state.canUndo()).toBe(false);
    expect(() => state.updateOptions({ undoLimit: -1 })).toThrow(RangeError);
  });

  it('keeps value-only consumers idle during cursor and selection changes', () => {
    const state = input({ initialValue: 'abc' });
    const observed: string[] = [];
    const release = createEffect(() => { observed.push(state.value()); });
    state.setCursorPosition(0);
    state.setSelection(0, 2);
    state.updateOptions({ undoLimit: 0 });
    expect(observed).toEqual(['abc']);
    state.insertText('X');
    expect(observed).toEqual(['abc', 'Xc']);
    release();
  });

  it('keeps submitted history separate and resets undo on setValue, clear and recall', () => {
    const state = input({ initialValue: 'draft', history: ['command'] });
    state.insertText('!');
    key(state, { home: true });
    key(state, { upArrow: true });
    expect(state.value()).toBe('command');
    expect(state.canUndo()).toBe(false);
    key(state, { downArrow: true });
    expect(state.value()).toBe('draft!');
    state.insertText('x'); state.setValue('reset');
    expect(state.canUndo()).toBe(false);
    state.insertText('x'); state.clear();
    expect(state.canUndo()).toBe(false);
  });

  it('maps undo and both redo shortcuts without recording cursor movements', () => {
    const state = input();
    key(state, {}, 'a');
    key(state, { leftArrow: true });
    key(state, { ctrl: true }, 'z');
    expect(state.value()).toBe('');
    key(state, { ctrl: true }, 'y');
    expect(state.value()).toBe('a');
    key(state, { ctrl: true }, 'z');
    key(state, { ctrl: true, shift: true }, 'Z');
    expect(state.value()).toBe('a');
  });

  it('replaces selections on paste and newline while exposing the selected paste range', () => {
    const transformPaste = vi.fn(context => context.text);
    const state = input({ initialValue: 'abcd', multiline: true, transformPaste });
    state.setSelection(1, 3); state.paste('X');
    expect(transformPaste.mock.calls[0]![0].range).toMatchObject({ start: 1, end: 3 });
    expect(state.value()).toBe('aXd');
    state.undo();
    key(state, { return: true, shift: true });
    expect(state.value()).toBe('a\nd');
  });

  it.each([0, 2, 4])('honors maxLength=%s without splitting pasted graphemes', maxLength => {
    const state = input({ maxLength });
    state.paste('a👩‍💻b');
    expect(state.value()).toBe(maxLength === 0 ? '' : 'a');
    expect(state.value()).not.toContain('�');
  });

  it('expands explicit replacement ranges to whole graphemes and validates before mutation', () => {
    const state = input({ initialValue: 'a😀b' });
    state.insertText('X', { start: 2, end: 3 });
    expect(state.value()).toBe('aXb');
    state.undo();
    state.insertText('Y', { start: 100, end: 101 });
    expect(state.value()).toBe('a😀bY');
    expect(() => state.insertText('!', { start: NaN, end: 2 })).toThrow(RangeError);
    expect(() => state.setSelection(0, Infinity)).toThrow(RangeError);
    expect(() => state.setCursorPosition(1.5)).toThrow(RangeError);
    expect(() => state.updateOptions({ maxLength: -1 })).toThrow(RangeError);
    expect(state.value()).toBe('a😀bY');
  });

  it('extends vertically without navigating submitted history and preserves the preferred column', () => {
    const state = input({ initialValue: 'abcd\nx\nabcd', width: 20, multiline: true, history: ['command'] });
    state.setCursorPosition(3);
    key(state, { downArrow: true, shift: true });
    expect(state.cursorPosition()).toBe(6);
    key(state, { downArrow: true, shift: true });
    expect(state.cursorPosition()).toBe(10);
    key(state, { home: true }); key(state, { upArrow: true, shift: true });
    expect(state.value()).toBe('abcd\nx\nabcd');
  });

  it('releases owned state on unmount and leaves caller-owned controllers alive', () => {
    const owned = renderTestComponent(() => useTextInputState());
    expect(owned.disposed).toBe(true);
    const external = input();
    renderTestComponent(() => TextInput({ state: external }));
    expect(external.disposed).toBe(false);
    external.insertText('still alive');
    external.dispose(); external.dispose();
    expect(() => external.insertText('!')).toThrow('disposed');
  });

  it('ignores stale asynchronous completion results after disposal', async () => {
    let resolve!: (items: { id: string; label: string }[]) => void;
    const state = input({ completion: {
      resolveAnchor: () => ({ start: 0, end: 0, query: '', trigger: '/' }),
      getItems: () => new Promise(done => { resolve = done; }),
    } });
    state.dispose();
    resolve([{ id: 'late', label: 'late' }]);
    await Promise.resolve(); await Promise.resolve();
    expect(state.completion()).toBeNull();
  });

  it('cancels task-backed completions and releases their event subscription exactly once', () => {
    const cancel = vi.fn();
    const release = vi.fn();
    const task: BackgroundTaskHandle<readonly { id: string; label: string }[]> = {
      id: 'task', result: new Promise(() => {}), cancel, subscribe: () => release,
    };
    const state = input({ completion: {
      resolveAnchor: () => ({ start: 0, end: 0, query: '', trigger: '/' }),
      getItems: () => task,
    } });
    state.dispose(); state.dispose();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('rebinds completions after undo and ignores late results from the undone value', async () => {
    const pending: { query: string; resolve: (items: { id: string; label: string }[]) => void }[] = [];
    const state = input({ initialValue: '@a', completion: {
      resolveAnchor: ({ value }) => ({ start: 0, end: value.length, query: value.slice(1), trigger: '@' }),
      getItems: ({ anchor }) => new Promise(resolve => { pending.push({ query: anchor.query, resolve }); }),
    } });
    state.insertText('b');
    state.undo();
    expect(pending.map(request => request.query)).toEqual(['a', 'ab', 'a']);
    pending[1]!.resolve([{ id: 'stale', label: 'stale' }]);
    pending[0]!.resolve([{ id: 'also-stale', label: 'also-stale' }]);
    await Promise.resolve();
    expect(state.completion()).toMatchObject({ query: 'a', status: 'loading' });
    pending[2]!.resolve([{ id: 'fresh', label: 'fresh' }]);
    await Promise.resolve();
    expect(state.completion()?.items[0]!.id).toBe('fresh');
  });

  it('switches between owned and external state without losing hook slots or the internal draft', async () => {
    const external = input({ initialValue: 'external', borderStyle: 'none' });
    let current: ReturnType<typeof createTextInput> | undefined;
    const app = createTestHarness({ columns: 30, rows: 5 }); apps.push(app);
    app.render(() => TextInput({ state: current, initialValue: 'internal', borderStyle: 'none' }));
    app.events.keyPress('!');
    current = external; await app.flush();
    expect(app.getScreen()[0]).toContain('external');
    app.events.keyPress('?');
    expect(external.value()).toBe('external?');
    current = undefined; await app.flush();
    expect(app.getScreen()[0]).toContain('internal!');
    app.cleanup();
    expect(external.disposed).toBe(false);
  });

  it.each([true, false])('paints selected graphemes in both renderers without changing geometry (delta=%s)', async delta => {
    const state = input({ initialValue: 'a👩‍💻bc', borderStyle: 'none', prompt: '>' });
    const app = createTestHarness({ columns: 25, rows: 5, renderOptions: { useDeltaRenderer: delta } });
    apps.push(app);
    app.render(() => TextInput({ state }));
    const before = app.getScreen();
    state.setSelection(1, 6);
    await app.flush();
    expect(app.getScreen()).toEqual(before);
    const cells = renderFrameToCellBuffer(app.getFrame()!);
    expect(cells.get(3, 0)).toMatchObject({ char: '👩‍💻', attrs: { inverse: true } });
    expect(cells.get(4, 0)!.isWide).toBe(true);
    expect(cells.get(2, 0)!.attrs.inverse).not.toBe(true);
  });

  it('preserves masking and selection styling in password mode', async () => {
    const state = input({ initialValue: 'a👩‍💻b', password: true, borderStyle: 'none', prompt: '>' });
    const app = createTestHarness({ columns: 20, rows: 5 }); apps.push(app);
    app.render(() => TextInput({ state }));
    state.setSelection(1, 6); await app.flush();
    expect(app.getScreen().join('')).not.toContain('👩');
    expect(renderFrameToCellBuffer(app.getFrame()!).get(3, 0)).toMatchObject({ char: '*', attrs: { inverse: true } });
  });

  it('allows Shift-click extension and ignores paste in inactive inputs', async () => {
    const state = input({ initialValue: 'abcd', borderStyle: 'none', prompt: '>' });
    const app = createTestHarness({ columns: 20, rows: 5 }); apps.push(app);
    app.render(() => TextInput({ state }));
    state.setCursorPosition(1);
    app.terminal.sendMouse({ x: 5, y: 0, button: 'left', action: 'press', shift: true });
    app.terminal.sendMouse({ x: 5, y: 0, button: 'left', action: 'release', shift: true });
    expect(state.selection().text).toBe('bc');
    state.updateOptions({ isActive: () => false }); await app.flush();
    app.events.paste('UNWANTED');
    expect(state.value()).toBe('abcd');
  });

  it('maps columns across full grapheme clusters', () => {
    expect(getCursorIndexFromColumn('a👩‍💻b', 3)).toBe(6);
    expect(getCursorIndexFromColumn('a👩‍💻b', 2)).toBe(1);
    expect(getCursorIndexFromColumn('éx', 1)).toBe(2);
  });

  it('projects selection across soft wraps and anchors the cursor on the next row', async () => {
    const state = input({ initialValue: 'abcdef', width: 6, wordWrap: true, borderStyle: 'none', prompt: '>' });
    const app = createTestHarness({ columns: 20, rows: 5 }); apps.push(app);
    app.render(() => TextInput({ state }));
    state.setSelection(1, 4); await app.flush();
    const cells = renderFrameToCellBuffer(app.getFrame()!);
    expect(cells.get(3, 0)).toMatchObject({ char: 'b', attrs: { inverse: true } });
    expect(cells.get(5, 0)).toMatchObject({ char: 'd', attrs: { inverse: true } });
    expect(cells.get(2, 1)!.attrs.inverse).not.toBe(true);
    expect(app.getFrame()!.cursorAnchor).toMatchObject({ x: 2, y: 1 });
  });
});
