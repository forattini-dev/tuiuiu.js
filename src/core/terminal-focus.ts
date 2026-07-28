import { createSignal } from '../primitives/signal.js';
import {
  getRuntimeResource,
  type RuntimeScope,
} from './runtime-scope.js';

type TerminalFocusListener = (focused: boolean) => void;

interface TerminalFocusRuntimeState {
  read: () => boolean;
  write: (focused: boolean) => void;
  listeners: Set<TerminalFocusListener>;
}

const TERMINAL_FOCUS_STATE = Symbol('tuiuiu.terminal-focus-state');

function createTerminalFocusRuntimeState(): TerminalFocusRuntimeState {
  const [read, write] = createSignal(true);
  return {
    read,
    write,
    listeners: new Set(),
  };
}

function getTerminalFocusRuntimeState(scope?: RuntimeScope): TerminalFocusRuntimeState {
  return getRuntimeResource(
    TERMINAL_FOCUS_STATE,
    createTerminalFocusRuntimeState,
    scope,
  );
}

export function readTerminalFocus(scope?: RuntimeScope): boolean {
  return getTerminalFocusRuntimeState(scope).read();
}

export function setTerminalFocusState(
  focused: boolean,
  scope?: RuntimeScope,
): void {
  const state = getTerminalFocusRuntimeState(scope);
  if (state.read() === focused) {
    return;
  }

  state.write(focused);
  for (const listener of state.listeners) {
    listener(focused);
  }
}

export function onTerminalFocusChange(
  listener: TerminalFocusListener,
  scope?: RuntimeScope,
): () => void {
  const state = getTerminalFocusRuntimeState(scope);
  state.listeners.add(listener);
  return () => {
    state.listeners.delete(listener);
  };
}

export function resetTerminalFocusState(scope?: RuntimeScope): void {
  setTerminalFocusState(true, scope);
}
