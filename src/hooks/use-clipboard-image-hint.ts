/**
 * useClipboardImageHint - Detect clipboard images after terminal focus returns.
 *
 * The hook debounces clipboard access and applies a cooldown so applications
 * can surface a hint without repeatedly invoking platform clipboard tools.
 */

import { hasClipboardImage } from '../core/clipboard-image.js';
import { onTerminalFocusChange } from '../core/terminal-focus.js';
import {
  getCurrentHookIndex,
  getHookState,
  getHookStateByIndex,
  registerHookCleanup,
  setHookState,
} from './context.js';

export interface UseClipboardImageHintOptions {
  /** Whether the hint is enabled (default: true). */
  enabled?: boolean;
  /** Custom hint message passed to onDetected. */
  message?: string;
  /** Callback when a clipboard image is detected. */
  onDetected?: (message: string) => void;
}

const CHECK_DEBOUNCE_MS = 500;
const COOLDOWN_MS = 30_000;
const DEFAULT_HINT_MESSAGE = 'Clipboard image detected';

interface ClipboardImageHintHookData {
  cleanup: (() => void) | null;
  lastHintTime: number;
  message: string;
  onDetected?: (message: string) => void;
  timeoutId: ReturnType<typeof setTimeout> | null;
}

function subscribeToClipboardImageFocus(hookIndex: number): () => void {
  return onTerminalFocusChange((focused) => {
    const stored = getHookStateByIndex(hookIndex) as ClipboardImageHintHookData | null;
    if (!stored || !focused) return;

    if (stored.timeoutId !== null) {
      clearTimeout(stored.timeoutId);
      stored.timeoutId = null;
    }

    stored.timeoutId = setTimeout(async () => {
      const current = getHookStateByIndex(hookIndex) as ClipboardImageHintHookData | null;
      if (!current) return;
      current.timeoutId = null;

      const now = Date.now();
      if (now - current.lastHintTime < COOLDOWN_MS) return;

      try {
        const hasImage = await hasClipboardImage();
        if (hasImage) {
          current.lastHintTime = Date.now();
          current.onDetected?.(current.message);
        }
      } catch {
        // Clipboard access is optional and must not break the render loop.
      }
    }, CHECK_DEBOUNCE_MS);
  });
}

/**
 * Check for clipboard images when terminal focus returns.
 *
 * @example
 * function App() {
 *   useClipboardImageHint({
 *     message: 'Press Ctrl+V to attach the image',
 *     onDetected: (message) => showHint(message),
 *   });
 * }
 */
export function useClipboardImageHint(
  options: UseClipboardImageHintOptions = {},
): void {
  const {
    enabled = true,
    message = DEFAULT_HINT_MESSAGE,
    onDetected,
  } = options;

  const { value: hookData, isNew } = getHookState<ClipboardImageHintHookData | null>(null);

  if (isNew || hookData === null) {
    const data: ClipboardImageHintHookData = {
      cleanup: null,
      lastHintTime: 0,
      message,
      onDetected,
      timeoutId: null,
    };

    const hookIndex = getCurrentHookIndex();
    setHookState(hookIndex, data);

    if (enabled) {
      data.cleanup = subscribeToClipboardImageFocus(hookIndex);
    }

    registerHookCleanup(() => {
      data.cleanup?.();
      data.cleanup = null;
      if (data.timeoutId !== null) {
        clearTimeout(data.timeoutId);
        data.timeoutId = null;
      }
    }, hookIndex);
    return;
  }

  hookData.message = message;
  hookData.onDetected = onDetected;

  if (!enabled && hookData.cleanup) {
    hookData.cleanup();
    hookData.cleanup = null;
    if (hookData.timeoutId !== null) {
      clearTimeout(hookData.timeoutId);
      hookData.timeoutId = null;
    }
  } else if (enabled && !hookData.cleanup) {
    hookData.cleanup = subscribeToClipboardImageFocus(getCurrentHookIndex());
  }
}
