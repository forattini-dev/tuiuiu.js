/**
 * Reck Cursor Control - Hide/show terminal cursor
 */

import { Writable } from 'node:stream';

// ANSI escape codes for cursor control
const SHOW_CURSOR = '\u001B[?25h';
const HIDE_CURSOR = '\u001B[?25l';

let isHidden = false;
let restoreOnExit = false;

/**
 * Ensure cursor is restored on process exit
 */
function setupExitHandler(): void {
  if (restoreOnExit) return;
  restoreOnExit = true;

  const restore = () => {
    if (isHidden) {
      process.stdout.write(SHOW_CURSOR);
      isHidden = false;
    }
  };

  // Handle various exit scenarios
  process.on('exit', restore);
  process.on('SIGINT', () => {
    restore();
    process.exit(128 + 2);
  });
  process.on('SIGTERM', () => {
    restore();
    process.exit(128 + 15);
  });
  process.on('uncaughtException', (err) => {
    restore();
    console.error(err);
    process.exit(1);
  });
}

/**
 * Show the terminal cursor
 */
export function showCursor(stream: Writable = process.stdout): void {
  if (!('isTTY' in stream) || !(stream as any).isTTY) {
    return;
  }
  isHidden = false;
  stream.write(SHOW_CURSOR);
}

/**
 * Hide the terminal cursor
 */
export function hideCursor(stream: Writable = process.stdout): void {
  if (!('isTTY' in stream) || !(stream as any).isTTY) {
    return;
  }
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
};

export default cursor;
