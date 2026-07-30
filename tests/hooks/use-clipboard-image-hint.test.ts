import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const clipboardHintMocks = vi.hoisted(() => ({
  hasClipboardImage: vi.fn(),
}));

vi.mock('../../src/core/clipboard-image.js', () => ({
  hasClipboardImage: clipboardHintMocks.hasClipboardImage,
}));

import {
  beginRender,
  endRender,
  resetHookState,
} from '../../src/hooks/context.js';
import {
  resetTerminalFocusState,
  setTerminalFocusState,
} from '../../src/core/terminal-focus.js';
import { useClipboardImageHint } from '../../src/hooks/use-clipboard-image-hint.js';

function renderHint(
  options: Parameters<typeof useClipboardImageHint>[0],
): void {
  beginRender();
  useClipboardImageHint(options);
  endRender();
}

async function regainFocus(): Promise<void> {
  setTerminalFocusState(false);
  setTerminalFocusState(true);
  await vi.advanceTimersByTimeAsync(500);
}

describe('useClipboardImageHint', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetHookState();
    resetTerminalFocusState();
    clipboardHintMocks.hasClipboardImage.mockResolvedValue(true);
  });

  afterEach(() => {
    resetHookState();
    resetTerminalFocusState();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('debounces focus checks and forwards the configured message', async () => {
    const onDetected = vi.fn();
    renderHint({
      message: 'Paste the screenshot',
      onDetected,
    });

    await regainFocus();

    expect(clipboardHintMocks.hasClipboardImage).toHaveBeenCalledTimes(1);
    expect(onDetected).toHaveBeenCalledWith('Paste the screenshot');
  });

  it('does not notify when the clipboard contains no image', async () => {
    clipboardHintMocks.hasClipboardImage.mockResolvedValue(false);
    const onDetected = vi.fn();
    renderHint({ onDetected });

    await regainFocus();

    expect(onDetected).not.toHaveBeenCalled();
  });

  it('uses the latest callback and message after a rerender', async () => {
    const previous = vi.fn();
    const current = vi.fn();
    renderHint({ message: 'old', onDetected: previous });
    renderHint({ message: 'new', onDetected: current });

    await regainFocus();

    expect(previous).not.toHaveBeenCalled();
    expect(current).toHaveBeenCalledWith('new');
  });

  it('can be disabled and enabled again', async () => {
    const onDetected = vi.fn();
    renderHint({ enabled: false, onDetected });
    await regainFocus();
    expect(clipboardHintMocks.hasClipboardImage).not.toHaveBeenCalled();

    renderHint({ enabled: true, onDetected });
    await regainFocus();

    expect(onDetected).toHaveBeenCalledTimes(1);
  });

  it('applies a cooldown between successful detections', async () => {
    const onDetected = vi.fn();
    renderHint({ onDetected });

    await regainFocus();
    await regainFocus();

    expect(clipboardHintMocks.hasClipboardImage).toHaveBeenCalledTimes(1);
    expect(onDetected).toHaveBeenCalledTimes(1);
  });

  it('cancels pending checks on cleanup and ignores clipboard errors', async () => {
    const onDetected = vi.fn();
    renderHint({ onDetected });
    setTerminalFocusState(false);
    setTerminalFocusState(true);
    resetHookState();
    await vi.advanceTimersByTimeAsync(500);
    expect(clipboardHintMocks.hasClipboardImage).not.toHaveBeenCalled();

    resetTerminalFocusState();
    clipboardHintMocks.hasClipboardImage.mockRejectedValue(new Error('clipboard unavailable'));
    renderHint({ onDetected });
    await regainFocus();
    expect(onDetected).not.toHaveBeenCalled();
  });
});
