/**
 * Clipboard Hook
 *
 * Provides clipboard write access via OSC 52 escape sequence.
 * Only works on terminals that support it (Kitty, WezTerm, iTerm2, Foot, etc.).
 *
 *
 */

import { getCapabilities } from '../core/capabilities.js';
import { getClipboardWriteSequence } from '../core/progressive.js';
import { getAppContext } from './context.js';

export interface UseClipboardResult {
  /** Copy text to system clipboard via OSC 52 */
  copy: (text: string) => void;
  /** Whether clipboard is supported by the terminal */
  supported: boolean;
}

/**
 * Hook for clipboard access via terminal escape sequences.
 *
 * @example
 * ```typescript
 * function App() {
 *   const { copy, supported } = useClipboard();
 *   useHotkeys('ctrl+c', () => copy('Hello!'));
 *   return Text({}, supported ? 'Ctrl+C to copy' : 'Clipboard not supported');
 * }
 * ```
 */
export function useClipboard(): UseClipboardResult {
  const caps = getCapabilities();
  const supported = !!caps.clipboard;

  function copy(text: string): void {
    const seq = getClipboardWriteSequence(text, caps);
    if (seq) {
      (getAppContext()?.stdout ?? process.stdout).write(seq);
    }
  }

  return { copy, supported };
}
