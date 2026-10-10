import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTextInput, TextInput, renderTextInput } from '../../src/atoms/text-input.js';
import { TextView } from '../../src/atoms/text-view.js';
import { Box, Text, Static } from '../../src/primitives/nodes.js';
import { createTextDocument } from '../../src/interaction/text-document.js';
import { createTextSelection } from '../../src/interaction/text-selection.js';
import { createTestHarness } from '../../src/dev-tools/testing.js';
import { renderFrameToCellBuffer } from '../../src/core/delta-render.js';
import { ScrollList, createScrollList } from '../../src/organisms/scroll-list.js';
import { createInteractionKeyEvent } from '../../src/interaction/runtime.js';
import { parseKeypress } from '../../src/core/hotkeys.js';
import * as capabilities from '../../src/core/capabilities.js';

const apps: ReturnType<typeof createTestHarness>[] = [];
const inputs: ReturnType<typeof createTextInput>[] = [];
const selections: ReturnType<typeof createTextSelection>[] = [];
afterEach(() => {
  for (const app of apps.splice(0)) app.cleanup();
  for (const input of inputs.splice(0)) input.dispose();
  for (const selection of selections.splice(0)) selection.dispose();
  vi.restoreAllMocks();
});
function setup(initialValue: string, options: Parameters<typeof createTextInput>[0] = {}, delta = true) {
  const state = createTextInput({ initialValue, borderStyle: 'none', prompt: '>', ...options });
  const app = createTestHarness({ columns: 35, rows: 12, renderOptions: { useDeltaRenderer: delta } });
  inputs.push(state); apps.push(app);
  return { app, state };
}
function copyKey(app: ReturnType<typeof createTestHarness>, sequence = '\x1b[99;6u') {
  const parsed = parseKeypress(sequence);
  return app.app!.commands.dispatch({ type: 'key', key: createInteractionKeyEvent(parsed.input, parsed.key) }).status === 'handled';
}

describe('TextInput pointer selection and clipboard', () => {
  it.each([true, false])('captures Unicode drag outside the node and releases it (delta=%s)', async delta => {
    const { app, state } = setup('a👩‍💻bc', {}, delta);
    app.render(() => Box({ paddingLeft: 2, paddingTop: 1 }, TextInput({ state })));
    const before = app.getScreen();
    app.terminal.sendMouse({ x: 5, y: 1, button: 'left', action: 'press' });
    await app.flush();
    app.terminal.sendMouse({ x: 30, y: 9, button: 'left', action: 'move' });
    await app.flush();
    app.terminal.sendMouse({ x: 30, y: 9, button: 'left', action: 'release' });
    expect(state.selection()).toMatchObject({ anchor: 1, head: 8, text: '👩‍💻bc' });
    expect(state.canUndo()).toBe(false);
    expect(app.getScreen()).toEqual(before);
    expect(renderFrameToCellBuffer(app.getFrame()!).get(5, 1)).toMatchObject({ char: '👩‍💻', attrs: { inverse: true } });
    app.terminal.sendMouse({ x: 4, y: 1, button: 'left', action: 'move' });
    expect(state.selection().head).toBe(8);
    state.insertText('X'); state.undo();
    expect(state.selection().text).toBe('👩‍💻bc');
  });

  it('retains the source anchor during backwards and Shift-extended drags', async () => {
    const { app, state } = setup('abcdef');
    app.render(() => TextInput({ state }));
    app.events.drag(7, 0, 3, 0);
    expect(state.selection()).toMatchObject({ anchor: 5, head: 1, text: 'bcde' });
    await app.flush();
    app.terminal.sendMouse({ x: 4, y: 0, button: 'left', action: 'press', shift: true });
    app.terminal.sendMouse({ x: 2, y: 0, button: 'left', action: 'move', shift: true });
    app.terminal.sendMouse({ x: 2, y: 0, button: 'left', action: 'release', shift: true });
    expect(state.selection()).toMatchObject({ anchor: 5, head: 0, text: 'abcde' });
  });

  it('retains pointer-node identity after extracting static siblings in the ANSI renderer', async () => {
    const { app, state } = setup('abcdef', {}, false);
    app.render(() => Box({ flexDirection: 'column' },
      Static({ items: ['permanent header'], children: item => Text({}, item) }),
      TextInput({ state })));
    app.terminal.sendMouse({ x: 3, y: 1, button: 'left', action: 'press' });
    await app.flush();
    app.terminal.sendMouse({ x: 6, y: 1, button: 'left', action: 'move' });
    await app.flush();
    app.terminal.sendMouse({ x: 7, y: 1, button: 'left', action: 'release' });
    expect(state.copyText()).toBe('bcde');
  });

  it('keeps semantic segments atomic during dragging', () => {
    const { app, state } = setup('a');
    state.insertSegment({ kind: 'file', displayText: '@file' });
    state.insertText('z');
    app.render(() => TextInput({ state }));
    app.events.drag(3, 0, 5, 0);
    expect(state.selection().text).toBe('@file');
    state.insertText('X');
    expect(state.value()).toBe('aXz');
    state.undo();
    expect(state.segments()[0]!.displayText).toBe('@file');
  });

  it('uses borders, prompt widths, soft wraps and source offsets rather than screen text', async () => {
    const { app, state } = setup('abcdefghijkl', { borderStyle: 'single', prompt: '>>', width: 12, wordWrap: true });
    app.render(() => Box({ paddingLeft: 2, paddingTop: 1 }, TextInput({ state })));
    app.terminal.sendMouse({ x: 8, y: 2, button: 'left', action: 'press' });
    await app.flush();
    // The continuation prompt is a one-cell vertical border plus a space.
    app.terminal.sendMouse({ x: 8, y: 3, button: 'left', action: 'move' });
    app.terminal.sendMouse({ x: 8, y: 3, button: 'left', action: 'release' });
    expect(state.copyText()).toBe('bcdefgh');
    expect(state.copyText()).not.toContain('\n');
  });

  it('advances the viewport while dragging past its visible rows', async () => {
    const { app, state } = setup('zero\none\ntwo\nthree', { multiline: true, maxLines: 2 });
    app.render(() => TextInput({ state }));
    app.terminal.sendMouse({ x: 2, y: 0, button: 'left', action: 'press' });
    app.terminal.sendMouse({ x: 4, y: 9, button: 'left', action: 'move' });
    expect(state.selection().text).toBe('zero\none\ntw');
    expect(state.viewportOffset()).toBe(1);
    await app.flush();
    app.terminal.sendMouse({ x: 5, y: 9, button: 'left', action: 'release' });
    expect(state.selection().text).toBe('zero\none\ntwo\nthr');
    expect(state.viewportOffset()).toBe(2);
  });

  it('preserves logical hits through a partially clipped parent viewport', async () => {
    const { app, state } = setup('zero\none\ntwo', { multiline: true });
    const scroll = createScrollList();
    app.render(() => ScrollList({ state: scroll, width: 12, height: 2,
      items: [0], itemHeight: 3, showScrollbar: false, children: () => TextInput({ state }) }));
    scroll.scrollTo(1); await app.flush();
    expect(app.getScreen()[0]).toContain('one');
    app.events.drag(2, 0, 4, 1);
    expect(state.copyText()).toBe('one\ntw');
  });

  it('does not capture inactive inputs, right clicks or the character-count row', async () => {
    const { app, state } = setup('abc', { showCharCount: true, isActive: false });
    app.render(() => TextInput({ state }));
    app.events.drag(2, 0, 4, 0);
    expect(state.selection().text).toBe('');
    state.updateOptions({ isActive: true }); await app.flush();
    app.events.drag(2, 1, 4, 0);
    expect(state.selection().text).toBe('');
    app.terminal.sendMouse({ x: 2, y: 0, button: 'right', action: 'press' });
    app.terminal.sendMouse({ x: 4, y: 0, button: 'left', action: 'move' });
    expect(state.selection().text).toBe('');
  });

  it('cancels capture when content, geometry, controller or activation changes', async () => {
    const { app, state } = setup('abcdef');
    let current = state;
    let width = 20;
    app.render(() => TextInput({ state: current, width }));
    app.terminal.sendMouse({ x: 2, y: 0, button: 'left', action: 'press' });
    state.insertText('X');
    app.terminal.sendMouse({ x: 5, y: 0, button: 'left', action: 'move' });
    expect(state.selection().text).toBe('');
    await app.flush();
    app.terminal.sendMouse({ x: 2, y: 0, button: 'left', action: 'press' });
    width = 10; await app.flush();
    app.terminal.sendMouse({ x: 5, y: 0, button: 'left', action: 'move' });
    expect(state.selection().text).toBe('');
    app.terminal.sendMouse({ x: 2, y: 0, button: 'left', action: 'press' });
    state.updateOptions({ isActive: false });
    app.terminal.sendMouse({ x: 5, y: 0, button: 'left', action: 'move' });
    expect(state.selection().text).toBe('');
    const replacement = createTextInput({ initialValue: 'other', borderStyle: 'none' }); inputs.push(replacement);
    current = replacement; await app.flush();
    app.terminal.sendMouse({ x: 5, y: 0, button: 'left', action: 'move' });
    expect(replacement.selection().text).toBe('');
  });

  it('cancels one panel capture when another editable or read-only panel is pressed', () => {
    const { app, state } = setup('first');
    const selection = createTextSelection(createTextDocument({ initialValue: 'second' })); selections.push(selection);
    app.render(() => Box({ flexDirection: 'column' }, TextInput({ state }), TextView({ selection, width: 8, height: 1 })));
    app.terminal.sendMouse({ x: 2, y: 0, button: 'left', action: 'press' });
    app.terminal.sendMouse({ x: 0, y: 1, button: 'left', action: 'press' });
    app.terminal.sendMouse({ x: 3, y: 1, button: 'left', action: 'move' });
    app.terminal.sendMouse({ x: 3, y: 1, button: 'left', action: 'release' });
    expect(state.selection().text).toBe('');
    expect(selection.copyText()).toBe('sec');
  });

  it('maps password drags through masked graphemes without exposing secret text to copy', () => {
    const onCopy = vi.fn();
    const { app, state } = setup('a👩‍💻b', { password: true, onCopy });
    app.render(() => TextInput({ state }));
    app.events.drag(3, 0, 4, 0);
    expect(state.selection().text).toBe('👩‍💻');
    expect(state.copyText()).toBe('');
    expect(copyKey(app)).toBe(false);
    expect(onCopy).not.toHaveBeenCalled();
  });

  it('copies sanitized selected source once without consuming plain Ctrl+C or altering undo', () => {
    const onCopy = vi.fn();
    const { app, state } = setup('a\x1b[31mb\x1b[0m\r\nc\x07', { onCopy, multiline: true });
    app.render(() => TextInput({ state }));
    state.selectAll();
    expect(copyKey(app)).toBe(true);
    expect(onCopy).toHaveBeenCalledExactlyOnceWith('ab\nc');
    expect(state.canUndo()).toBe(false);
    expect(copyKey(app, '\x03')).toBe(false);
    expect(onCopy).toHaveBeenCalledTimes(1);
    state.setCursorPosition(0);
    expect(copyKey(app)).toBe(false);
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it.each([true, false])('writes OSC52 only when supported (supported=%s)', supported => {
    const original = capabilities.getCapabilities();
    vi.spyOn(capabilities, 'getCapabilities').mockReturnValue({ ...original, clipboard: supported });
    const { app, state } = setup('copy me');
    app.render(() => TextInput({ state }));
    state.selectAll();
    app.terminal.clearOutput();
    expect(copyKey(app)).toBe(supported);
    const osc52 = app.terminal.getOutputString();
    if (supported) expect(osc52).toContain('\x1b]52;c;Y29weSBtZQ==');
    else expect(osc52).not.toContain('\x1b]52;');
  });

  it('lets a callback override OSC52 and blocks copying immediately after deactivation', () => {
    const original = capabilities.getCapabilities();
    vi.spyOn(capabilities, 'getCapabilities').mockReturnValue({ ...original, clipboard: true });
    const onCopy = vi.fn();
    const { app, state } = setup('copy me', { onCopy });
    app.render(() => TextInput({ state })); state.selectAll();
    app.terminal.clearOutput(); copyKey(app);
    expect(onCopy).toHaveBeenCalledExactlyOnceWith('copy me');
    expect(app.terminal.getOutputString()).not.toContain('\x1b]52;');
    state.updateOptions({ isActive: false });
    expect(copyKey(app)).toBe(false);
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('blocks copy even when masking is supplied only to the low-level renderer', () => {
    const onCopy = vi.fn();
    const { app, state } = setup('secret');
    app.render(() => renderTextInput(state, { password: true, onCopy }));
    state.selectAll(); copyKey(app);
    expect(onCopy).not.toHaveBeenCalled();
  });

  it('does not write to another application output stream or retain capture after unmount', () => {
    const original = capabilities.getCapabilities();
    vi.spyOn(capabilities, 'getCapabilities').mockReturnValue({ ...original, clipboard: true });
    const first = setup('first'); const second = setup('second');
    first.app.render(() => TextInput({ state: first.state }));
    second.app.render(() => TextInput({ state: second.state }));
    first.state.selectAll(); second.state.selectAll();
    first.app.terminal.clearOutput(); second.app.terminal.clearOutput();
    copyKey(first.app);
    expect(first.app.terminal.getOutputString()).toContain('\x1b]52;');
    expect(second.app.terminal.getOutputString()).not.toContain('\x1b]52;');
    first.app.terminal.sendMouse({ x: 2, y: 0, button: 'left', action: 'press' });
    first.app.cleanup();
    expect(first.state.disposed).toBe(false);
    first.state.setCursorPosition(0);
    first.app.terminal.sendMouse({ x: 5, y: 0, button: 'left', action: 'move' });
    expect(first.state.selection().text).toBe('');
  });
});
