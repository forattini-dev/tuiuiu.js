/**
 * Symmetric ownership of terminal modes used by an interactive app.
 *
 * TerminalSession records host-owned state before changing stdin/stdout and
 * restores exactly that state on dispose. Input parsing and application
 * policy stay outside this class.
 */

import {
  disableBracketedPaste,
  disableFocusEvents,
  enableBracketedPaste,
  enableFocusEvents,
} from './input.js';

export interface TerminalSessionOptions {
  stdin: NodeJS.ReadStream;
  stdout: NodeJS.WriteStream;
  /** Whether focus reporting is supported and should be enabled. */
  focusEvents?: boolean;
  /** Whether bracketed paste should be enabled (default: true). */
  bracketedPaste?: boolean;
}

export interface TerminalSession {
  readonly stdin: NodeJS.ReadStream;
  readonly stdout: NodeJS.WriteStream;
  readonly rawModeEnabledCount: number;
  readonly disposed: boolean;
  start(): void;
  setRawMode(enabled: boolean): void;
  isRawModeEnabled(): boolean;
  dispose(): void;
}

export function createTerminalSession(
  options: TerminalSessionOptions,
): TerminalSession {
  const {
    stdin,
    stdout,
    focusEvents = false,
    bracketedPaste = true,
  } = options;
  const initialRawMode = Boolean(stdin.isRaw);
  const inputWasPaused =
    typeof stdin.isPaused === 'function' && stdin.isPaused();
  const outputSupportsTerminalModes = Boolean(stdout.isTTY);

  let started = false;
  let isDisposed = false;
  let rawModeEnabledCount = 0;

  const write = (sequence: string): void => {
    if (typeof stdout.write === 'function') stdout.write(sequence);
  };

  const setRawMode = (enabled: boolean): void => {
    if (isDisposed || !stdin.isTTY || !stdin.setRawMode) return;

    if (enabled) {
      rawModeEnabledCount++;
      if (rawModeEnabledCount === 1 && !initialRawMode) {
        stdin.setRawMode(true);
      }
      return;
    }

    if (rawModeEnabledCount === 0) return;
    rawModeEnabledCount--;
    if (rawModeEnabledCount === 0) {
      stdin.setRawMode(initialRawMode);
    }
  };

  const start = (): void => {
    if (isDisposed) {
      throw new Error('[tuiuiu] Cannot restart a disposed TerminalSession');
    }
    if (started) return;
    started = true;

    setRawMode(true);
    stdin.resume();
    if (outputSupportsTerminalModes && focusEvents) write(enableFocusEvents());
    if (outputSupportsTerminalModes && bracketedPaste) write(enableBracketedPaste());
  };

  const dispose = (): void => {
    if (isDisposed) return;
    isDisposed = true;
    if (!started) return;

    let firstError: unknown;
    const attempt = (operation: () => void): void => {
      try {
        operation();
      } catch (error) {
        firstError ??= error;
      }
    };

    rawModeEnabledCount = 0;
    attempt(() => {
      if (stdin.isTTY && stdin.setRawMode) {
        stdin.setRawMode(initialRawMode);
      }
    });
    attempt(() => {
      if (inputWasPaused && typeof stdin.pause === 'function') {
        stdin.pause();
      }
    });
    if (outputSupportsTerminalModes && focusEvents) {
      attempt(() => write(disableFocusEvents()));
    }
    if (outputSupportsTerminalModes && bracketedPaste) {
      attempt(() => write(disableBracketedPaste()));
    }

    if (firstError) {
      throw firstError;
    }
  };

  return {
    stdin,
    stdout,
    get rawModeEnabledCount() {
      return rawModeEnabledCount;
    },
    get disposed() {
      return isDisposed;
    },
    start,
    setRawMode,
    isRawModeEnabled: () => rawModeEnabledCount > 0,
    dispose,
  };
}
