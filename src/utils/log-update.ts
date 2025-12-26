/**
 * Reck Log Update - Incremental terminal rendering
 *
 * Provides efficient terminal updates by only redrawing changed lines
 */

import { Writable } from 'node:stream';
import { hideCursor, showCursor } from './cursor.js';
import { stringWidth } from './text-utils.js';

// ANSI escape sequences
const ESC = '\u001B[';
const cursorHome = `${ESC}H`; // Move cursor to home (0,0)
const clearFromCursor = `${ESC}J`; // Clear from cursor to end of screen
const clearToEndOfLine = `${ESC}K`; // Clear from cursor to end of line

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
 * Create a standard log updater with delta clearing
 * Tracks line widths and clears only what's necessary when content shrinks
 */
function createStandard(stream: Writable, options: LogUpdateOptions = {}): LogUpdate {
  const { showCursor: showCursorOption = false } = options;
  let previousOutput = '';
  let previousLineCount = 0;
  let previousLineWidths: number[] = [];
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

    // Split into lines and calculate widths
    const lines = content.split('\n');
    const lineWidths = lines.map((line) => stringWidth(line));
    const newLineCount = lines.length;

    // Build output with delta clearing
    // For each line, if the new line is shorter than the previous,
    // append ESC[K to clear to end of line
    const outputLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const newWidth = lineWidths[i];
      const prevWidth = previousLineWidths[i] ?? 0;

      // Clear to end of line only if new content is shorter than previous
      if (newWidth < prevWidth) {
        outputLines.push(line + clearToEndOfLine);
      } else {
        outputLines.push(line);
      }
    }

    // If previous content had more lines, explicitly clear them
    // This ensures ghost content is removed even if clearFromCursor doesn't work properly
    const extraLinesToClear = previousLineCount - newLineCount;
    let clearExtraLines = '';
    if (extraLinesToClear > 0) {
      for (let i = 0; i < extraLinesToClear; i++) {
        clearExtraLines += '\n' + clearToEndOfLine;
      }
    }

    // Store for next frame
    previousOutput = output;
    previousLineCount = newLineCount;
    previousLineWidths = lineWidths;

    // Move cursor to home, write output with line clears, clear extra lines, then clear remaining
    stream.write(cursorHome + outputLines.join('\n') + clearExtraLines + '\n' + clearFromCursor);
  };

  render.clear = () => {
    stream.write(cursorHome + clearFromCursor);
    previousOutput = '';
    previousLineCount = 0;
    previousLineWidths = [];
  };

  render.done = () => {
    previousOutput = '';
    previousLineCount = 0;
    previousLineWidths = [];

    if (!showCursorOption && hasHiddenCursor) {
      showCursor(stream);
      hasHiddenCursor = false;
    }
  };

  render.sync = (content: string) => {
    const lines = content.split('\n');
    previousOutput = content + '\n';
    previousLineCount = lines.length;
    previousLineWidths = lines.map((line) => stringWidth(line));
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
