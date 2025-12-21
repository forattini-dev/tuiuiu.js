/**
 * useTerminalSize - Reactive terminal dimensions
 */

import { createSignal } from '../primitives/signal.js';
import { getTerminalSize, onResize } from '../core/capabilities.js';
import { useEffect } from './use-effect.js';

export interface TerminalSize {
  columns: number;
  rows: number;
}

/**
 * Get reactive terminal size
 */
export function useTerminalSize(): TerminalSize {
  const [size, setSize] = createSignal(getTerminalSize());

  useEffect(() => {
    const cleanup = onResize((newSize) => {
      setSize(newSize);
    });
    return cleanup;
  });

  return size();
}
