/**
 * Reck Log Update - Incremental terminal rendering
 *
 * Provides efficient terminal updates by only redrawing changed lines
 */

import { Writable } from 'node:stream';
import { hideCursor, showCursor } from './cursor.js';

// ANSI escape sequences
const ESC = '\u001B[';
const cursorHome = `${ESC}H`; // Move cursor to home (0,0)
const clearFromCursor = `${ESC}J`; // Clear from cursor to end of screen

const eraseLines = (count: number): string => {
  let result = '';
  for (let i = 0; i < count; i++) {
    result += ESC + '2K'; // Erase line
    if (i < count - 1) {
      result += ESC + '1A'; // Move cursor up
    }
  }
  if (count > 0) {
    result += '\r'; // Return to start of line
  }
  return result;
};

const cursorUp = (count: number): string => count > 0 ? `${ESC}${count}A` : '';
const cursorNextLine = `${ESC}1E`;
const eraseLine = `${ESC}2K`;

export interface LogUpdateOptions {
  /** Show cursor during rendering (default: false) */
  showCursor?: boolean;
  /** Use incremental rendering for better performance (default: true) */
  incremental?: boolean;
}

export interface LogUpdate {
  /** Render new content, replacing previous output */
  (content: string): void;
  /** Clear all previous output */
  clear(): void;
  /** Finish rendering, restore cursor */
  done(): void;
  /** Sync internal state without rendering (for external writes) */
  sync(content: string): void;
}

/**
 * Create a standard log updater (full redraw)
 * Uses cursor home + clear to ensure no ghost lines accumulate
 */
function createStandard(stream: Writable, options: LogUpdateOptions = {}): LogUpdate {
  const { showCursor: showCursorOption = false } = options;
  let previousOutput = '';
  let hasHiddenCursor = false;

  const render = (content: string) => {
    if (!showCursorOption && !hasHiddenCursor) {
      hideCursor(stream);
      hasHiddenCursor = true;
    }

    const output = content + '\n';
    if (output === previousOutput) {
      return;
    }

    previousOutput = output;
    // Move cursor to home (0,0), write output, then clear any remaining content below
    stream.write(cursorHome + output + clearFromCursor);
  };

  render.clear = () => {
    stream.write(cursorHome + clearFromCursor);
    previousOutput = '';
  };

  render.done = () => {
    previousOutput = '';

    if (!showCursorOption && hasHiddenCursor) {
      showCursor(stream);
      hasHiddenCursor = false;
    }
  };

  render.sync = (content: string) => {
    previousOutput = content + '\n';
  };

  return render;
}

/**
 * Create an incremental log updater (only redraws changed lines)
 * This reduces flickering and improves performance
 */
function createIncremental(stream: Writable, options: LogUpdateOptions = {}): LogUpdate {
  const { showCursor: showCursorOption = false } = options;
  let previousLines: string[] = [];
  let previousOutput = '';
  let hasHiddenCursor = false;

  const render = (content: string) => {
    if (!showCursorOption && !hasHiddenCursor) {
      hideCursor(stream);
      hasHiddenCursor = true;
    }

    const output = content + '\n';
    if (output === previousOutput) {
      return;
    }

    const previousCount = previousLines.length;
    const nextLines = output.split('\n');
    const nextCount = nextLines.length;
    const visibleCount = nextCount - 1; // Last line is empty after split

    // Full redraw if first render or content was empty
    if (output === '\n' || previousOutput.length === 0) {
      stream.write(eraseLines(previousCount) + output);
      previousOutput = output;
      previousLines = nextLines;
      return;
    }

    // Build incremental update buffer
    const buffer: string[] = [];

    // Clear extra lines if new content is shorter
    if (nextCount < previousCount) {
      buffer.push(
        eraseLines(previousCount - nextCount + 1),
        cursorUp(visibleCount)
      );
    } else {
      buffer.push(cursorUp(previousCount - 1));
    }

    // Only redraw lines that changed
    for (let i = 0; i < visibleCount; i++) {
      if (nextLines[i] === previousLines[i]) {
        buffer.push(cursorNextLine);
        continue;
      }
      buffer.push(eraseLine + nextLines[i] + '\n');
    }

    stream.write(buffer.join(''));

    previousOutput = output;
    previousLines = nextLines;
  };

  render.clear = () => {
    stream.write(eraseLines(previousLines.length));
    previousOutput = '';
    previousLines = [];
  };

  render.done = () => {
    previousOutput = '';
    previousLines = [];

    if (!showCursorOption && hasHiddenCursor) {
      showCursor(stream);
      hasHiddenCursor = false;
    }
  };

  render.sync = (content: string) => {
    const output = content + '\n';
    previousOutput = output;
    previousLines = output.split('\n');
  };

  return render;
}

/**
 * Create a log updater
 */
export function createLogUpdate(
  stream: Writable = process.stdout,
  options: LogUpdateOptions = {}
): LogUpdate {
  const { incremental = true } = options;

  if (incremental) {
    return createIncremental(stream, options);
  }

  return createStandard(stream, options);
}

export default { create: createLogUpdate };
