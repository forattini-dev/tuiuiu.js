/**
 * Terminal Panic Hooks - Centralized terminal state restoration on crash
 *
 * Ensures the terminal is restored to a usable state when the process
 * exits unexpectedly (uncaughtException, unhandledRejection, SIGINT, SIGTERM).
 *
 * Any module that modifies terminal state (raw mode, cursor, mouse tracking,
 * focus events, bracketed paste) should register a cleanup callback via
 * `onTerminalPanic()`.
 */

const cleanups: Array<() => void> = [];
let installed = false;
let restoring = false;

// Handler references for removal
let exitHandler: (() => void) | null = null;
let sigintHandler: (() => void) | null = null;
let sigtermHandler: (() => void) | null = null;
let uncaughtHandler: ((err: Error) => void) | null = null;
let unhandledHandler: ((reason: unknown) => void) | null = null;

/**
 * Execute all registered cleanup callbacks in reverse order (LIFO).
 * Each callback runs in its own try/catch so one failure doesn't block others.
 */
export function restoreTerminal(): void {
  if (restoring) return;
  restoring = true;

  for (let i = cleanups.length - 1; i >= 0; i--) {
    try {
      cleanups[i]();
    } catch {
      // Swallow — best-effort restoration
    }
  }

  restoring = false;
}

/**
 * Register a cleanup callback to run when the terminal needs restoration.
 * Returns a function to unregister the callback.
 */
export function onTerminalPanic(cleanup: () => void): () => void {
  cleanups.push(cleanup);

  return () => {
    const idx = cleanups.indexOf(cleanup);
    if (idx !== -1) {
      cleanups.splice(idx, 1);
    }
  };
}

/**
 * Install process-level signal and error handlers (idempotent).
 * Should be called once during render() setup.
 */
export function installPanicHooks(): void {
  if (installed) return;
  installed = true;

  exitHandler = () => {
    restoreTerminal();
  };

  sigintHandler = () => {
    restoreTerminal();
    process.exit(128 + 2);
  };

  sigtermHandler = () => {
    restoreTerminal();
    process.exit(128 + 15);
  };

  uncaughtHandler = (err: Error) => {
    restoreTerminal();
    console.error(err);
    process.exit(1);
  };

  unhandledHandler = (reason: unknown) => {
    restoreTerminal();
    console.error(reason);
    process.exit(1);
  };

  process.on('exit', exitHandler);
  process.on('SIGINT', sigintHandler);
  process.on('SIGTERM', sigtermHandler);
  process.on('uncaughtException', uncaughtHandler);
  process.on('unhandledRejection', unhandledHandler);
}

/**
 * Remove all process handlers and clear cleanup registry.
 * Useful for tests.
 */
export function removePanicHooks(): void {
  if (!installed) return;

  if (exitHandler) process.off('exit', exitHandler);
  if (sigintHandler) process.off('SIGINT', sigintHandler);
  if (sigtermHandler) process.off('SIGTERM', sigtermHandler);
  if (uncaughtHandler) process.off('uncaughtException', uncaughtHandler);
  if (unhandledHandler) process.off('unhandledRejection', unhandledHandler);

  exitHandler = null;
  sigintHandler = null;
  sigtermHandler = null;
  uncaughtHandler = null;
  unhandledHandler = null;
  installed = false;
  cleanups.length = 0;
}
