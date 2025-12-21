/**
 * Hook types - Shared type definitions
 */

/** Key information from useInput */
export interface Key {
  upArrow: boolean;
  downArrow: boolean;
  leftArrow: boolean;
  rightArrow: boolean;
  pageUp: boolean;
  pageDown: boolean;
  home: boolean;
  end: boolean;
  insert: boolean;
  return: boolean;
  escape: boolean;
  tab: boolean;
  backspace: boolean;
  delete: boolean;
  clear: boolean;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
  option: boolean; // macOS Option key
  // Function keys
  f1: boolean;
  f2: boolean;
  f3: boolean;
  f4: boolean;
  f5: boolean;
  f6: boolean;
  f7: boolean;
  f8: boolean;
  f9: boolean;
  f10: boolean;
  f11: boolean;
  f12: boolean;
}

export type InputHandler = (input: string, key: Key) => void;

export interface AppContext {
  exit: (error?: Error) => void;
  stdin: NodeJS.ReadStream;
  stdout: NodeJS.WriteStream;
  onExit: (callback: () => void) => void;
  /** Whether automatic Tab/Shift+Tab navigation is enabled */
  autoTabNavigation: boolean;
  /** Set automatic Tab navigation enabled/disabled */
  setAutoTabNavigation: (enabled: boolean) => void;
  /** Enable/disable raw mode with reference counting */
  setRawMode: (enabled: boolean) => void;
  /** Current raw mode reference count */
  rawModeEnabledCount: number;
  /** Whether raw mode is currently active */
  isRawModeEnabled: () => boolean;
}

export interface FocusOptions {
  autoFocus?: boolean;
  isActive?: boolean;
  id?: string;
}

export interface FocusResult {
  isFocused: boolean;
  focus: () => void;
}

/** Focus manager interface */
export interface FocusManager {
  register(id: string, setFocused: (focused: boolean) => void): void;
  unregister(id: string): void;
  focus(id: string): void;
  focusNext(): void;
  focusPrevious(): void;
  /** Blur current focus (no component focused) */
  blur(): void;
  /** Get currently focused ID */
  getActiveId(): string | undefined;
}
