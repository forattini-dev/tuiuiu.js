import { createSignal } from '../primitives/signal.js';

type TerminalFocusListener = (focused: boolean) => void;

const [terminalFocusedSignal, setTerminalFocusedSignal] = createSignal(true);
const terminalFocusListeners = new Set<TerminalFocusListener>();

export function readTerminalFocus(): boolean {
  return terminalFocusedSignal();
}

export function setTerminalFocusState(focused: boolean): void {
  if (terminalFocusedSignal() === focused) {
    return;
  }

  setTerminalFocusedSignal(focused);
  for (const listener of terminalFocusListeners) {
    listener(focused);
  }
}

export function onTerminalFocusChange(listener: TerminalFocusListener): () => void {
  terminalFocusListeners.add(listener);
  return () => {
    terminalFocusListeners.delete(listener);
  };
}

export function resetTerminalFocusState(): void {
  setTerminalFocusState(true);
}
