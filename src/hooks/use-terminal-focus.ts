/**
 * useTerminalFocus - Reactive terminal focus state
 */

import { readTerminalFocus } from '../core/terminal-focus.js';

export interface TerminalFocusState {
  focused: boolean;
}

export function useTerminalFocus(): TerminalFocusState {
  return {
    focused: readTerminalFocus(),
  };
}
