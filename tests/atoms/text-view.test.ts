import { afterEach, describe, expect, it, vi } from 'vitest';
import { TextView } from '../../src/atoms/text-view.js';
import { Box } from '../../src/primitives/nodes.js';
import { createTextDocument } from '../../src/interaction/text-document.js';
import { createTextSelection } from '../../src/interaction/text-selection.js';
import { createInteractionKeyEvent } from '../../src/interaction/runtime.js';
import { parseKeypress } from '../../src/core/hotkeys.js';
import { createTestHarness } from '../../src/dev-tools/testing.js';
import { renderFrameToCellBuffer } from '../../src/core/delta-render.js';
import { ScrollList, createScrollList } from '../../src/organisms/scroll-list.js';

const apps: ReturnType<typeof createTestHarness>[] = [];
const selections: ReturnType<typeof createTextSelection>[] = [];
afterEach(() => {
  for (const app of apps.splice(0)) app.cleanup();
  for (const selection of selections.splice(0)) selection.dispose();
});
function setup(value: string, useDeltaRenderer = true) {
  const app = createTestHarness({ columns: 25, rows: 10, renderOptions: { useDeltaRenderer } });
  const document = createTextDocument({ initialValue: value });
  const selection = createTextSelection(document);
  apps.push(app); selections.push(selection);
  return { app, document, selection };
}
function key(app: ReturnType<typeof createTestHarness>, sequence: string) {
  const parsed = parseKeypress(sequence);
  return app.app!.commands.dispatch({ type: 'key', key: createInteractionKeyEvent(parsed.input, parsed.key) });
}

describe('TextView', () => {
  it.each([true, false])('paints selections without changing document geometry (delta=%s)', async delta => {
    const { app, selection } = setup('a\t界é\nnext', delta);
    app.render(() => TextView({ selection, width: 6, height: 4, wrap: 'grapheme', style: { color: 'red' } }));
    const before = app.getScreen();
    selection.set(1, 5);
    await app.flush();
    expect(app.getScreen()).toEqual(before);
    const cells = renderFrameToCellBuffer(app.getFrame()!);
    expect(cells.get(1, 0)!.attrs.inverse).toBe(true);
    expect(cells.get(4, 0)).toMatchObject({ char: '界', fg: 'red', attrs: { inverse: true } });
    expect(cells.get(5, 0)!.isWide).toBe(true);
    expect(cells.get(0, 1)).toMatchObject({ char: 'é', attrs: { inverse: true } });
    expect(cells.get(0, 2)!.attrs.inverse).not.toBe(true);
    expect(selection.copyText()).toBe('\t界é');
  });
  it('captures a drag outside its bounds and finishes on release', async () => {
    const { app, selection } = setup('hello\nworld');
    app.render(() => Box({ paddingLeft: 2, paddingTop: 1 }, TextView({ selection, width: 5, height: 2 })));
    app.events.drag(3, 1, 15, 5);
    await app.flush();
    expect(selection.snapshot()).toMatchObject({ anchor: 1, head: 11, text: 'ello\nworld' });
    app.terminal.sendMouse({ x: 2, y: 1, button: 'left', action: 'move' });
    expect(selection.snapshot().head).toBe(11);
  });
  it('uses scrolled visual rows for hits and only paints visible rows', async () => {
    const { app, selection } = setup('zero\none\ntwo\nthree\nfour');
    app.render(() => TextView({ selection, width: 8, height: 2, scrollTop: 2 }));
    expect(app.getScreen()[0]!.trim()).toBe('two');
    app.events.drag(0, 0, 3, 1);
    await app.flush();
    expect(selection.copyText()).toBe('two\nthr');
    expect(app.getFrame()!.drawCommands.filter(command => command.type === 'text')).toHaveLength(2);
  });
  it('routes opt-in keyboard selection/copy without consuming plain Ctrl+C', async () => {
    const { app, selection } = setup('a👩‍💻bc');
    const copy = vi.fn();
    app.render(() => TextView({ selection, width: 12, height: 2, isActive: true, onCopy: copy }));
    key(app, '\x1b[1;2C'); key(app, '\x1b[1;2C');
    expect(selection.snapshot().text).toBe('a👩‍💻');
    key(app, '\x1b[99;6u');
    expect(copy).toHaveBeenCalledWith('a👩‍💻');
    key(app, '\x03');
    expect(copy).toHaveBeenCalledTimes(1);
    key(app, '\x01');
    expect(selection.copyText()).toBe('a👩‍💻bc');
    key(app, '\x1b');
    expect(selection.snapshot().text).toBe('');
    await app.flush();
  });
  it('keeps the desired vertical column over short lines and scrolls the head into view', async () => {
    const { app, selection } = setup('abcd\nx\nabcd');
    selection.set(3, 3);
    app.render(() => TextView({ selection, width: 8, height: 2, isActive: true }));
    key(app, '\x1b[1;2B');
    expect(selection.snapshot().head).toBe(6);
    key(app, '\x1b[1;2B');
    expect(selection.snapshot().head).toBe(10);
    await app.flush();
    expect(app.getScreen()[0]!.trim()).toBe('x');
    expect(app.getScreen()[1]!.trim()).toBe('abcd');
  });
  it('releases view subscriptions on unmount without disposing caller-owned controllers', async () => {
    const { app, document, selection } = setup('first');
    const unsubscribe = vi.fn();
    const original = selection.subscribe.bind(selection);
    vi.spyOn(selection, 'subscribe').mockImplementation(listener => {
      const release = original(listener);
      return () => { unsubscribe(); release(); };
    });
    app.render(() => TextView({ selection, width: 10, height: 2 }));
    app.cleanup();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(selection.disposed).toBe(false);
    document.setValue('later');
    selection.selectAll();
    expect(selection.copyText()).toBe('later');
  });
  it('rebinds changed controllers, preserves source selection on resize and repaints external edits', async () => {
    const { app, document, selection } = setup('abcdef');
    const other = createTextSelection(createTextDocument({ initialValue: 'other' }));
    selections.push(other);
    let current = selection;
    let width = 3;
    app.render(() => TextView({ selection: current, width, height: 3 }));
    selection.set(1, 5);
    width = 6;
    await app.flush();
    expect(selection.copyText()).toBe('bcde');
    expect(app.getScreen()[0]!.trim()).toBe('abcdef');
    document.replace(2, 3, 'X');
    await app.flush();
    expect(app.getScreen()[0]!.trim()).toBe('abXdef');
    current = other;
    await app.flush();
    other.selectAll();
    await app.flush();
    expect(app.getScreen()[0]!.trim()).toBe('other');
    expect(renderFrameToCellBuffer(app.getFrame()!).get(0, 0)!.attrs.inverse).toBe(true);
  });
  it('renders control placeholders, clips nowrap content, and leaves inactive keyboards alone', async () => {
    const { app, selection } = setup('a\x1b[31mb\nlast');
    app.render(() => TextView({ selection, width: 3, height: 2, wrap: 'none' }));
    expect(app.getScreen()[0]!.trim()).toBe('a�[');
    key(app, '\x01');
    expect(selection.snapshot().text).toBe('');
    app.events.scroll(0, 0, 'down', 1);
    await app.flush();
    expect(app.getScreen()[0]!.trim()).toBe('a�[');
  });
  it('does not leak mouse or keyboard selections between mounted panels', async () => {
    const { app, selection } = setup('first');
    const second = createTextSelection(createTextDocument({ initialValue: 'second' }));
    selections.push(second);
    app.render(() => Box({ flexDirection: 'row' },
      TextView({ key: 'first', selection, width: 8, height: 2 }),
      TextView({ key: 'second', selection: second, width: 8, height: 2, isActive: true })));
    app.terminal.sendMouse({ x: 0, y: 0, button: 'left', action: 'press' });
    app.terminal.sendMouse({ x: 8, y: 0, button: 'left', action: 'press' });
    app.terminal.sendMouse({ x: 11, y: 0, button: 'left', action: 'move' });
    app.terminal.sendMouse({ x: 11, y: 0, button: 'left', action: 'release' });
    expect(selection.copyText()).toBe('');
    expect(second.copyText()).toBe('sec');
    key(app, '\x01');
    expect(selection.copyText()).toBe('');
    expect(second.copyText()).toBe('second');
    await app.flush();
  });
  it('retains document-relative hits through a partially clipped parent viewport', async () => {
    const { app, selection } = setup('zero\none\ntwo');
    const scroll = createScrollList();
    app.render(() => ScrollList({ state: scroll, width: 8, height: 2,
      items: [0], itemHeight: 3, showScrollbar: false,
      children: () => TextView({ selection, width: 8, height: 3 }) }));
    scroll.scrollTo(1);
    await app.flush();
    expect(app.getScreen()[0]!.trim()).toBe('one');
    app.events.drag(0, 0, 2, 1);
    await app.flush();
    expect(selection.copyText()).toBe('one\ntw');
  });
  it('repaints reactive changes without explicit invalidation', async () => {
    const { app, document, selection } = setup('old');
    app.render(() => TextView({ selection, width: 8, height: 2 }));
    document.setValue('new');
    await vi.waitFor(() => expect(app.getScreen()[0]!.trim()).toBe('new'));
    selection.selectAll();
    await vi.waitFor(() => expect(renderFrameToCellBuffer(app.getFrame()!).get(0, 0)!.attrs.inverse).toBe(true));
  });
  it('reconciles local scrolling after content shrink and supports controlled scrolling', async () => {
    const { app, document, selection } = setup('0\n1\n2\n3\n4');
    app.render(() => TextView({ selection, width: 8, height: 2 }));
    app.events.scroll(0, 0, 'down', 1);
    await app.flush();
    expect(app.getScreen()[0]!.trim()).toBe('3');
    document.setValue('short');
    await app.flush();
    document.setValue('0\n1\n2\n3\n4');
    await app.flush();
    expect(app.getScreen()[0]!.trim()).toBe('0');
    const change = vi.fn();
    let scrollTop = 0;
    app.render(() => TextView({ selection, width: 8, height: 2, scrollTop, onScrollTopChange: change }));
    app.events.scroll(0, 0, 'down', 1);
    expect(change).toHaveBeenCalledWith(3);
    await app.flush();
    expect(app.getScreen()[0]!.trim()).toBe('0');
    scrollTop = 3;
    await app.flush();
    expect(app.getScreen()[0]!.trim()).toBe('3');
  });
  it('keeps capture through reactive presentation and Shift-click extends its anchor', async () => {
    const { app, selection } = setup('hello\nworld');
    app.render(() => TextView({ selection, width: 8, height: 2 }));
    app.terminal.sendMouse({ x: 1, y: 0, button: 'left', action: 'press' });
    await app.flush();
    app.terminal.sendMouse({ x: 2, y: 1, button: 'left', action: 'move' });
    await app.flush();
    app.terminal.sendMouse({ x: 3, y: 1, button: 'left', action: 'release' });
    expect(selection.copyText()).toBe('ello\nwor');
    app.terminal.sendMouse({ x: 4, y: 1, button: 'left', action: 'press', shift: true });
    app.terminal.sendMouse({ x: 4, y: 1, button: 'left', action: 'release', shift: true });
    expect(selection.snapshot()).toMatchObject({ anchor: 1, head: 10, text: 'ello\nworl' });
  });
  it('resets the vertical goal column after external selection changes', () => {
    const { app, selection } = setup('abcd\nx\nabcd');
    selection.set(3, 3);
    app.render(() => TextView({ selection, width: 8, height: 3, isActive: true }));
    key(app, '\x1b[1;2B');
    selection.set(0, 0);
    key(app, '\x1b[1;2B');
    expect(selection.snapshot().head).toBe(5);
  });
});
