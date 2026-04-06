/**
 * useClipboardImageHint - Show notification when clipboard has an image
 *
 * When the terminal regains focus, checks if the system clipboard contains
 * an image and shows a hint notification.
 *
 * Uses debounce (500ms) and cooldown (30s) to avoid spamming.
 */

import { onTerminalFocusChange } from '../core/terminal-focus.js';
import { hasClipboardImage } from '../core/clipboard-image.js';
import { getHookState, getCurrentHookIndex, setHookState, getHookStateByIndex } from './context.js';

export interface UseClipboardImageHintOptions {
  /** Whether the hint is enabled (default: true) */
  enabled?: boolean;
  /** Custom hint message */
  message?: string;
  /** Callback when clipboard image is detected */
  onDetected?: () => void;
}

const CHECK_DEBOUNCE_MS = 500;
const COOLDOWN_MS = 30_000;

/**
 * Show a hint when the terminal regains focus and the clipboard has an image.
 *
 * @example
 * function App() {
 *   useClipboardImageHint({
 *     onDetected: () => {
 *       // Show your own UI hint
 *     },
 *   });
 *   // ...
 * }
 */
export function useClipboardImageHint(options: UseClipboardImageHintOptions = {}): void {
  const { enabled = true, onDetected } = options;

  const { value: hookData, isNew } = getHookState<{
    cleanup: (() => void) | null;
    lastHintTime: number;
    timeoutId: ReturnType<typeof setTimeout> | null;
  } | null>(null);

  if (isNew || hookData === null) {
    const data = {
      cleanup: null as (() => void) | null,
      lastHintTime: 0,
      timeoutId: null as ReturnType<typeof setTimeout> | null,
    };

    const hookIndex = getCurrentHookIndex();
    setHookState(hookIndex, data);

    function getStoredData() {
      return getHookStateByIndex(hookIndex) as typeof data | null;
    }

    if (enabled) {
      data.cleanup = onTerminalFocusChange((focused) => {
        const stored = getStoredData();
        if (!stored || !focused) return;

        // Clear any pending check
        if (stored.timeoutId !== null) {
          clearTimeout(stored.timeoutId);
          stored.timeoutId = null;
        }

        // Debounce the check
        stored.timeoutId = setTimeout(async () => {
          const s = getStoredData();
          if (!s) return;
          s.timeoutId = null;

          // Cooldown check
          const now = Date.now();
          if (now - s.lastHintTime < COOLDOWN_MS) return;

          try {
            const hasImage = await hasClipboardImage();
            if (hasImage) {
              s.lastHintTime = Date.now();
              onDetected?.();
            }
          } catch {
            // Silently ignore clipboard check errors
          }
        }, CHECK_DEBOUNCE_MS);
      });
    }
  } else {
    // Subsequent render — update enabled state
    if (!enabled && hookData.cleanup) {
      hookData.cleanup();
      hookData.cleanup = null;
      if (hookData.timeoutId !== null) {
        clearTimeout(hookData.timeoutId);
        hookData.timeoutId = null;
      }
    }
  }
}
