/**
 * Terminal Panic Hooks - Centralized terminal state restoration on crash
 *
 * Ensures the terminal is restored to a usable state when the process exits.
 *
 * The hooks deliberately observe fatal errors without handling them. A library
 * must not replace Node.js signal/error semantics or force process termination.
 *
 * Any module that modifies terminal state (raw mode, cursor, mouse tracking,
 * focus events, bracketed paste) should register a cleanup callback via
 * `onTerminalPanic()`.
 */

const cleanups: Array<() => void> = [];
let installed = false;
let restoring = false;
let installReferences = 0;

// Handler references for removal
let exitHandler: (() => void) | null = null;
let uncaughtMonitorHandler: ((error: Error, origin: NodeJS.UncaughtExceptionOrigin) => void) | null = null;

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
 * Install non-owning process hooks. Calls are reference counted and the
 * returned function releases one installation reference.
 */
export function installPanicHooks(): () => void {
  installReferences++;

  if (!installed) {
    installed = true;
    exitHandler = () => {
      restoreTerminal();
    };
    uncaughtMonitorHandler = () => {
      restoreTerminal();
    };
    process.on('exit', exitHandler);
    process.on('uncaughtExceptionMonitor', uncaughtMonitorHandler);
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    installReferences = Math.max(0, installReferences - 1);
    if (installReferences === 0) {
      uninstallProcessHooks();
    }
  };
}

function uninstallProcessHooks(): void {
  if (!installed) return;
  if (exitHandler) process.off('exit', exitHandler);
  if (uncaughtMonitorHandler) {
    process.off('uncaughtExceptionMonitor', uncaughtMonitorHandler);
  }
  exitHandler = null;
  uncaughtMonitorHandler = null;
  installed = false;
}

/**
 * Remove all process handlers and clear cleanup registry.
 * Useful for tests.
 */
export function removePanicHooks(): void {
  installReferences = 0;
  uninstallProcessHooks();
  cleanups.length = 0;
}
