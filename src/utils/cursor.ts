/**
 * Tuiuiu Cursor Control - Hide/show terminal cursor
 */

import { Writable } from 'node:stream';
import { onTerminalPanic } from '../core/terminal-panic.js';

// ANSI escape codes for cursor control
const SHOW_CURSOR = '\u001B[?25h';
const HIDE_CURSOR = '\u001B[?25l';

let isHidden = false;
let panicRegistered = false;
let unregisterPanic: (() => void) | null = null;
let lastStream: Writable | null = null;

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
 * Register cursor restoration with the centralized panic handler
 */
function registerPanicCleanup(): void {
  if (panicRegistered) return;
  panicRegistered = true;
  unregisterPanic = onTerminalPanic(restoreCursor);
}

/**
 * Remove exit handlers (useful for tests).
 * Only unregisters this cursor module's cleanup hook.
 */
export function removeExitHandlers(): void {
  if (unregisterPanic) {
    unregisterPanic();
    unregisterPanic = null;
  }
  panicRegistered = false;
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
  registerPanicCleanup();
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
