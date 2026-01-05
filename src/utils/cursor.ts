/**
 * Tuiuiu Cursor Control - Hide/show terminal cursor
 */

import { Writable } from 'node:stream';

// ANSI escape codes for cursor control
const SHOW_CURSOR = '\u001B[?25h';
const HIDE_CURSOR = '\u001B[?25l';

let isHidden = false;
let handlersRegistered = false;
let lastStream: Writable | null = null;

// Store handler references for potential cleanup
let exitHandler: (() => void) | null = null;
let sigintHandler: (() => void) | null = null;
let sigtermHandler: (() => void) | null = null;
let uncaughtHandler: ((err: Error) => void) | null = null;

/**
 * Restore cursor visibility
 */
function isTTYStream(stream: Writable): boolean {
  return 'isTTY' in stream && !!(stream as any).isTTY;
}

function restoreCursor(): void {
  const stream = lastStream ?? process.stdout;
  if (!isTTYStream(stream)) {
    return;
  }
  if (isHidden) {
    stream.write(SHOW_CURSOR);
    isHidden = false;
  }
}

/**
 * Ensure cursor is restored on process exit
 */
function setupExitHandler(): void {
  if (handlersRegistered) return;
  handlersRegistered = true;

  exitHandler = restoreCursor;
  sigintHandler = () => {
    restoreCursor();
    process.exit(128 + 2);
  };
  sigtermHandler = () => {
    restoreCursor();
    process.exit(128 + 15);
  };
  uncaughtHandler = (err: Error) => {
    restoreCursor();
    console.error(err);
    process.exit(1);
  };

  // Handle various exit scenarios
  process.on('exit', exitHandler);
  process.on('SIGINT', sigintHandler);
  process.on('SIGTERM', sigtermHandler);
  process.on('uncaughtException', uncaughtHandler);
}

/**
 * Remove exit handlers (useful for tests)
 */
export function removeExitHandlers(): void {
  if (!handlersRegistered) return;

  if (exitHandler) process.off('exit', exitHandler);
  if (sigintHandler) process.off('SIGINT', sigintHandler);
  if (sigtermHandler) process.off('SIGTERM', sigtermHandler);
  if (uncaughtHandler) process.off('uncaughtException', uncaughtHandler);

  exitHandler = null;
  sigintHandler = null;
  sigtermHandler = null;
  uncaughtHandler = null;
  handlersRegistered = false;
  lastStream = null;
}

/**
 * Show the terminal cursor
 */
export function showCursor(stream: Writable = process.stdout): void {
  if (!isTTYStream(stream)) {
    return;
  }
  lastStream = stream;
  isHidden = false;
  stream.write(SHOW_CURSOR);
}

/**
 * Hide the terminal cursor
 */
export function hideCursor(stream: Writable = process.stdout): void {
  if (!isTTYStream(stream)) {
    return;
  }
  lastStream = stream;
  setupExitHandler();
  isHidden = true;
  stream.write(HIDE_CURSOR);
}

/**
 * Toggle cursor visibility
 */
export function toggleCursor(force?: boolean, stream: Writable = process.stdout): void {
  if (force !== undefined) {
    isHidden = !force; // force=true means show, so isHidden=false
  }
  if (isHidden) {
    showCursor(stream);
  } else {
    hideCursor(stream);
  }
}

/**
 * Check if cursor is currently hidden
 */
export function isCursorHidden(): boolean {
  return isHidden;
}

export const cursor = {
  show: showCursor,
  hide: hideCursor,
  toggle: toggleCursor,
  isHidden: isCursorHidden,
  removeExitHandlers,
};

export default cursor;
