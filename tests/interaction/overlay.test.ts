import { describe, expect, it, vi } from 'vitest';
import { createOverlayHost, type OverlayFocusAdapter } from '../../src/interaction/overlay.js';
import { createInteractionKeyEvent, createInteractionRuntime } from '../../src/interaction/runtime.js';
import { parseKeypress } from '../../src/core/hotkeys.js';

function keyEscape() {
  const parsed = parseKeypress('\u001b');
  return {
    type: 'key' as const,
    key: createInteractionKeyEvent(parsed.input, parsed.key),
  };
}

function fakeFocus(): OverlayFocusAdapter {
  return {
    mount: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
    unmount: vi.fn(),
    dispose: vi.fn(),
  };
}

describe('OverlayHost', () => {
  it('owns exclusive input and closes the active overlay through Escape', async () => {
    const runtime = createInteractionRuntime();
    const host = createOverlayHost<string>({ runtime, focus: fakeFocus() });
    const first = host.open({ id: 'first', content: 'one', blocking: true, captureFocus: true });
    const second = host.open({ id: 'second', content: 'two', blocking: true, captureFocus: true });

    expect(runtime.inspect()).toMatchObject({ mode: 'overlay', target: 'second', exclusive: true });
    expect(runtime.dispatch(keyEscape())).toEqual({ status: 'handled', command: 'overlay.close:second' });
    await expect(second.closed).resolves.toEqual({ reason: 'escape', value: undefined });
    expect(first.isOpen).toBe(true);
    expect(runtime.inspect().target).toBe('first');
  });

  it('keeps a blocking modal active when a non-blocking toast is above it', () => {
    const runtime = createInteractionRuntime();
    const host = createOverlayHost<string>({ runtime, focus: fakeFocus() });
    host.open({ id: 'modal', content: 'modal', blocking: true, captureFocus: true });
    host.open({ id: 'toast', content: 'toast', blocking: false, backdrop: false });

    expect(host.snapshot()).toMatchObject({ activeId: 'modal', backdropId: 'modal' });
    expect(runtime.inspect()).toMatchObject({ target: 'modal', exclusive: true });
  });

  it('uses priority for authority and safely closes sessions out of order', async () => {
    const runtime = createInteractionRuntime();
    const focus = fakeFocus();
    const host = createOverlayHost<string>({ runtime, focus });
    const critical = host.open({ id: 'critical', content: 'critical', priority: 'critical', blocking: true, captureFocus: true });
    const normal = host.open({ id: 'normal', content: 'normal', blocking: true, captureFocus: true });

    expect(host.snapshot().activeId).toBe('critical');
    await normal.close();
    expect(host.snapshot().activeId).toBe('critical');
    expect(focus.deactivate).not.toHaveBeenCalledWith('critical');
    await critical.close();
    expect(host.snapshot().activeId).toBeNull();
  });

  it('coalesces duplicate closes and respects an asynchronous veto', async () => {
    const beforeClose = vi.fn(async () => false);
    const onClose = vi.fn();
    const host = createOverlayHost<string>({
      runtime: createInteractionRuntime(),
      focus: fakeFocus(),
    });
    const session = host.open({ id: 'guarded', content: 'x', beforeClose, onClose });

    const [left, right] = await Promise.all([session.close(), session.close()]);
    expect([left, right]).toEqual([false, false]);
    expect(beforeClose).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    expect(session.isOpen).toBe(true);
  });

  it('rearms timers on update without allowing a stale timer to close', async () => {
    vi.useFakeTimers();
    try {
      const host = createOverlayHost<string>({
        runtime: createInteractionRuntime(),
        focus: fakeFocus(),
      });
      const session = host.open({ id: 'timer', content: 'x', timeoutMs: 10 });
      session.update({ timeoutMs: 30 });
      await vi.advanceTimersByTimeAsync(11);
      expect(session.isOpen).toBe(true);
      await vi.advanceTimersByTimeAsync(19);
      await expect(session.closed).resolves.toEqual({ reason: 'timeout', value: undefined });
    } finally {
      vi.useRealTimers();
    }
  });

  it('requires press and release on the same active backdrop', async () => {
    const host = createOverlayHost<string>({
      runtime: createInteractionRuntime(),
      focus: fakeFocus(),
    });
    const session = host.open({ id: 'modal', content: 'x', blocking: true, closeOnBackdrop: true });

    expect(host.pointerDownBackdrop('modal')).toBe(true);
    expect(host.pointerUpBackdrop('somewhere-else')).toBe(false);
    expect(session.isOpen).toBe(true);
    host.pointerDownBackdrop('modal');
    expect(host.pointerUpBackdrop('modal')).toBe(true);
    await session.closed;
    expect(session.isOpen).toBe(false);
  });

  it('settles every session exactly once during disposal', async () => {
    const focus = fakeFocus();
    const host = createOverlayHost<string>({
      runtime: createInteractionRuntime(),
      focus,
    });
    const first = host.open({ content: 'one' });
    const second = host.open({ content: 'two' });
    host.dispose();
    host.dispose();

    await expect(first.closed).resolves.toEqual({ reason: 'dispose' });
    await expect(second.closed).resolves.toEqual({ reason: 'dispose' });
    expect(focus.dispose).toHaveBeenCalledOnce();
    expect(() => host.open({ content: 'three' })).toThrow(/disposed/);
  });

  it('does not give focus or input authority to a lone toast', () => {
    const runtime = createInteractionRuntime();
    const focus = fakeFocus();
    const host = createOverlayHost<string>({ runtime, focus });
    host.open({ id: 'toast', content: 'saved' });

    expect(host.snapshot()).toMatchObject({ activeId: null, backdropId: null });
    expect(runtime.inspect().mode).toBe('global');
    expect(focus.mount).not.toHaveBeenCalled();
  });

  it('supports explicit focus, hide/show and responsive visibility', () => {
    const runtime = createInteractionRuntime();
    const host = createOverlayHost<string>({ runtime, focus: fakeFocus() });
    const session = host.open({
      id: 'responsive',
      content: 'panel',
      visibleWhen: ({ width }) => width >= 60,
    });

    host.setViewport(40, 20);
    expect(host.snapshot().entries[0]?.hidden).toBe(true);
    host.setViewport(80, 20);
    expect(host.snapshot().entries[0]?.hidden).toBe(false);
    expect(session.focus()).toBe(true);
    expect(runtime.inspect().target).toBe('responsive');
    expect(session.hide()).toBe(true);
    expect(runtime.inspect().mode).toBe('global');
    expect(session.show()).toBe(true);
    expect(session.unfocus()).toBe(true);
  });

  it('does not dismiss a backdrop while terminal text selection is active', () => {
    const host = createOverlayHost<string>({
      runtime: createInteractionRuntime(),
      focus: fakeFocus(),
      isTextSelecting: () => true,
    });
    const session = host.open({
      id: 'modal',
      content: 'x',
      blocking: true,
      closeOnBackdrop: true,
    });
    host.pointerDownBackdrop('modal');
    expect(host.pointerUpBackdrop('modal')).toBe(true);
    expect(session.isOpen).toBe(true);
  });
});
