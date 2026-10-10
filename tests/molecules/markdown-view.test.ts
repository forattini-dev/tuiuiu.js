import { afterEach, describe, expect, it, vi } from 'vitest';
import { MarkdownView, createMarkdownSelection } from '../../src/molecules/markdown-view.js';
import { Box } from '../../src/primitives/nodes.js';
import { createTestHarness } from '../../src/dev-tools/testing.js';
import { renderFrameToCellBuffer } from '../../src/core/delta-render.js';
import { createInteractionKeyEvent } from '../../src/interaction/runtime.js';
import { parseKeypress } from '../../src/core/hotkeys.js';

const apps: ReturnType<typeof createTestHarness>[] = [];
const controllers: ReturnType<typeof createMarkdownSelection>[] = [];
afterEach(() => {
  for (const app of apps.splice(0)) app.cleanup();
  for (const controller of controllers.splice(0)) controller.dispose();
});
function setup(source: string, useDeltaRenderer = true) {
  const app = createTestHarness({ columns: 30, rows: 12, renderOptions: { useDeltaRenderer } });
  const controller = createMarkdownSelection(source);
  apps.push(app); controllers.push(controller);
  return { app, controller };
}
function key(app: ReturnType<typeof createTestHarness>, sequence: string) {
  const parsed = parseKeypress(sequence);
  return app.app!.commands.dispatch({ type: 'key', key: createInteractionKeyEvent(parsed.input, parsed.key) });
}

describe('MarkdownView', () => {
  it.each([true, false])('selects across style runs and paragraphs with real mouse geometry (delta=%s)', async delta => {
    const { app, controller } = setup('**hello**\n\n*world*', delta);
    app.render(() => MarkdownView({ selection: controller, width: 12, height: 4 }));
    app.terminal.sendMouse({ x: 1, y: 0, button: 'left', action: 'press' });
    await app.flush();
    app.terminal.sendMouse({ x: 3, y: 2, button: 'left', action: 'move' });
    await app.flush();
    app.terminal.sendMouse({ x: 3, y: 2, button: 'left', action: 'release' });
    expect(controller.copyText()).toBe('ello\n\nwor');
    expect(controller.copyText('source')).toBe('ello**\n\n*wor');
    const cells = renderFrameToCellBuffer(app.getFrame()!);
    expect(cells.get(1, 0)!.attrs).toMatchObject({ bold: true, inverse: true });
    expect(cells.get(1, 2)!.attrs).toMatchObject({ italic: true, inverse: true });
  });
  it.each([true, false])('retains styles and source selection through wrapping and resize (delta=%s)', async delta => {
    const { app, controller } = setup('**👩‍💻界é** again', delta);
    let width = 4;
    controller.selection.set(0, '👩‍💻界é'.length);
    app.render(() => MarkdownView({ selection: controller, width, height: 5, wrap: 'grapheme' }));
    const cells = renderFrameToCellBuffer(app.getFrame()!);
    expect(cells.get(0, 0)!.attrs).toMatchObject({ bold: true, inverse: true });
    expect(cells.get(2, 0)!.char).toBe('界');
    expect(cells.get(0, 1)!.char).toBe('é');
    width = 10;
    await app.flush();
    expect(controller.copyText()).toBe('👩‍💻界é');
    expect(controller.copyText('source')).toBe('👩‍💻界é');
  });
  it('uses explicit copy policy with normalized keyboard input', async () => {
    const { app, controller } = setup('**hello**');
    const copied = vi.fn();
    let copyMode: 'display' | 'source' = 'display';
    app.render(() => MarkdownView({ selection: controller, width: 12, height: 3, isActive: true, copyMode, onCopy: copied }));
    key(app, '\x01');
    key(app, '\x1b[99;6u');
    expect(copied).toHaveBeenLastCalledWith('hello');
    copyMode = 'source';
    await app.flush();
    key(app, '\x1b[99;6u');
    expect(copied).toHaveBeenLastCalledWith('**hello**');
    key(app, '\x1b');
    key(app, '\x1b[99;6u');
    expect(copied).toHaveBeenCalledTimes(2);
  });
  it('updates styles even when presented text does not change, and releases subscriptions on rebind', async () => {
    const { app, controller } = setup('**same**');
    const second = createMarkdownSelection('*next*');
    controllers.push(second);
    const release = vi.fn();
    const original = controller.subscribe.bind(controller);
    vi.spyOn(controller, 'subscribe').mockImplementation(listener => {
      const unsubscribe = original(listener);
      return () => { release(); unsubscribe(); };
    });
    let current = controller;
    app.render(() => MarkdownView({ selection: current, width: 12, height: 3 }));
    controller.update('*same*');
    await vi.waitFor(() => expect(renderFrameToCellBuffer(app.getFrame()!).get(0, 0)!.attrs.italic).toBe(true));
    expect(renderFrameToCellBuffer(app.getFrame()!).get(0, 0)!.attrs.bold).not.toBe(true);
    current = second;
    await app.flush();
    expect(release).toHaveBeenCalledOnce();
    expect(app.getScreen()[0]!.trim()).toBe('next');
    app.cleanup();
    expect(second.disposed).toBe(false);
    second.update('still active');
  });
  it('cancels a captured drag when streaming edits replace its geometry', async () => {
    const { app, controller } = setup('**first**\n\nlast');
    app.render(() => MarkdownView({ selection: controller, width: 12, height: 4 }));
    app.terminal.sendMouse({ x: 0, y: 0, button: 'left', action: 'press' });
    controller.update('replacement');
    await app.flush();
    const before = controller.selection.snapshot();
    app.terminal.sendMouse({ x: 4, y: 0, button: 'left', action: 'release' });
    expect(controller.selection.snapshot()).toEqual(before);
  });
  it('keeps two views independent and routes the active keyboard only', () => {
    const { app, controller } = setup('**one**');
    const second = createMarkdownSelection('*two*');
    controllers.push(second);
    app.render(() => Box({ flexDirection: 'row' },
      MarkdownView({ key: 'one', selection: controller, width: 8, height: 3 }),
      MarkdownView({ key: 'two', selection: second, width: 8, height: 3, isActive: true })));
    key(app, '\x01');
    expect(controller.copyText()).toBe('');
    expect(second.copyText()).toBe('two');
  });
});
