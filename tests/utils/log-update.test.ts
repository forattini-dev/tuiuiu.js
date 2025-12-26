/**
 * Tests for log-update utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLogUpdate } from '../../src/utils/log-update.js';
import { Writable } from 'node:stream';

// Create a mock stream that captures output
function createMockStream(): Writable & { output: string; isTTY: boolean } {
  let output = '';
  const stream = new Writable({
    write(chunk, encoding, callback) {
      output += chunk.toString();
      callback();
    },
  });
  Object.defineProperty(stream, 'output', {
    get: () => output,
    set: (v: string) => { output = v; },
  });
  (stream as any).isTTY = false; // Not TTY to avoid cursor operations
  return stream as any;
}

describe('createLogUpdate', () => {
  describe('standard mode', () => {
    it('renders content to stream', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: false, showCursor: true });

      log('Hello World');
      expect(stream.output).toContain('Hello World');
    });

    it('clears previous output', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: false, showCursor: true });

      log('First');
      stream.output = '';

      log('Second');
      // Should contain erase codes and new content
      expect(stream.output).toContain('Second');
    });

    it('does not re-render same content', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: false, showCursor: true });

      log('Same');
      stream.output = '';

      log('Same');
      expect(stream.output).toBe(''); // Nothing written
    });

    it('has clear method', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: false, showCursor: true });

      log('Content');
      stream.output = '';

      log.clear();
      // Should write erase sequences
      expect(stream.output.length).toBeGreaterThan(0);
    });

    it('has done method', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: false, showCursor: true });

      log('Content');
      log.done();
      // Should complete without error
    });

    it('has sync method', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: false, showCursor: true });

      // Sync without render
      log.sync('Synced content');

      // Now render different content - should erase synced lines
      log('New content');
      expect(stream.output).toContain('New content');
    });
  });

  describe('incremental mode', () => {
    it('renders content to stream', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: true, showCursor: true });

      log('Hello World');
      expect(stream.output).toContain('Hello World');
    });

    it('does not re-render same content', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: true, showCursor: true });

      log('Same');
      stream.output = '';

      log('Same');
      expect(stream.output).toBe(''); // Nothing written
    });

    it('only redraws changed lines', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: true, showCursor: true });

      log('Line 1\nLine 2\nLine 3');
      stream.output = '';

      log('Line 1\nChanged\nLine 3');
      // Should contain only the changed line
      expect(stream.output).toContain('Changed');
    });

    it('handles shorter content', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: true, showCursor: true });

      log('Line 1\nLine 2\nLine 3');
      stream.output = '';

      log('Line 1');
      // Should handle removing extra lines
      expect(stream.output.length).toBeGreaterThan(0);
    });

    it('handles longer content', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: true, showCursor: true });

      log('Line 1');
      stream.output = '';

      log('Line 1\nLine 2\nLine 3');
      // Should add new lines
      expect(stream.output).toContain('Line 2');
      expect(stream.output).toContain('Line 3');
    });

    it('handles empty content', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: true, showCursor: true });

      log('Content');
      stream.output = '';

      log('');
      // Should clear and show empty
      expect(stream.output.length).toBeGreaterThan(0);
    });

    it('has clear method', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: true, showCursor: true });

      log('Content');
      stream.output = '';

      log.clear();
      expect(stream.output.length).toBeGreaterThan(0);
    });

    it('has done method', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: true, showCursor: true });

      log('Content');
      log.done();
      // Should complete without error
    });

    it('has sync method', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: true, showCursor: true });

      log.sync('Synced content');
      log('New content');
      expect(stream.output).toContain('New content');
    });
  });

  describe('default options', () => {
    it('uses incremental mode by default', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { showCursor: true });

      log('Line 1\nLine 2');
      stream.output = '';

      // Change only second line
      log('Line 1\nLine 2 modified');

      // Should use incremental (only changed line in output, not Line 1)
      expect(stream.output).toContain('Line 2 modified');
    });
  });

  describe('multiline content', () => {
    it('handles multiline content', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { showCursor: true });

      const content = `Line 1
Line 2
Line 3`;

      log(content);
      expect(stream.output).toContain('Line 1');
      expect(stream.output).toContain('Line 2');
      expect(stream.output).toContain('Line 3');
    });
  });

  describe('delta clearing (ghosting prevention)', () => {
    const clearToEndOfLine = '\u001B[K';
    const clearFromCursor = '\u001B[J';
    const cursorHome = '\u001B[H';

    /**
     * Simulates a terminal buffer and applies ANSI escape sequences
     * to verify the final visible content after rendering.
     * This proves that ghosting is actually prevented.
     */
    function simulateTerminal(ansiOutput: string, width = 80, height = 24): string[] {
      const buffer: string[][] = [];
      for (let y = 0; y < height; y++) {
        buffer.push(new Array(width).fill(' '));
      }

      let cursorX = 0;
      let cursorY = 0;
      let i = 0;

      while (i < ansiOutput.length) {
        // Check for ESC sequence
        if (ansiOutput[i] === '\u001B' && ansiOutput[i + 1] === '[') {
          // Find end of sequence
          let j = i + 2;
          while (j < ansiOutput.length && !/[A-Za-z]/.test(ansiOutput[j])) {
            j++;
          }
          const seq = ansiOutput.slice(i + 2, j);
          const cmd = ansiOutput[j];

          if (cmd === 'H' && seq === '') {
            // Cursor home
            cursorX = 0;
            cursorY = 0;
          } else if (cmd === 'K') {
            // Clear to end of line
            for (let x = cursorX; x < width; x++) {
              buffer[cursorY][x] = ' ';
            }
          } else if (cmd === 'J') {
            // Clear from cursor to end of screen
            // Clear rest of current line
            for (let x = cursorX; x < width; x++) {
              buffer[cursorY][x] = ' ';
            }
            // Clear all lines below
            for (let y = cursorY + 1; y < height; y++) {
              for (let x = 0; x < width; x++) {
                buffer[y][x] = ' ';
              }
            }
          } else if (cmd === 'm') {
            // SGR (color) - ignore for visibility test
          }

          i = j + 1;
          continue;
        }

        // Newline
        if (ansiOutput[i] === '\n') {
          cursorX = 0;
          cursorY++;
          i++;
          continue;
        }

        // Regular character
        if (cursorY < height && cursorX < width) {
          buffer[cursorY][cursorX] = ansiOutput[i];
          cursorX++;
        }
        i++;
      }

      // Convert buffer to lines, trimming trailing spaces
      return buffer.map(row => row.join('').trimEnd());
    }

    it('clears to end of line when content shrinks horizontally', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: false, showCursor: true });

      // First render: long line
      log('Hello World!');
      stream.output = '';

      // Second render: shorter line
      log('Hi');

      // Should contain clear-to-end-of-line escape code
      expect(stream.output).toContain(clearToEndOfLine);
      expect(stream.output).toContain('Hi');
    });

    it('does not add clear code when content grows', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: false, showCursor: true });

      // First render: short line
      log('Hi');
      stream.output = '';

      // Second render: longer line
      log('Hello World!');

      // Should NOT contain clear-to-end-of-line after the content
      // (it may still have clearFromCursor at the end for height changes)
      const contentPart = stream.output.split('\n')[0];
      expect(contentPart).not.toContain(clearToEndOfLine);
    });

    it('clears only lines that shrank', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: false, showCursor: true });

      // First render
      log('Long line one\nShort\nLong line three');
      stream.output = '';

      // Second render: first line shrinks, second grows, third same
      log('Short\nLonger now\nLong line three');

      // First line (shrank) should have clear
      // Second line (grew) should NOT have clear
      // Third line (same) should NOT have clear
      const lines = stream.output.split('\n');
      expect(lines[0]).toContain(clearToEndOfLine); // First line shrank
    });

    it('handles wide characters (emoji) correctly', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: false, showCursor: true });

      // Emoji are 2-wide
      log('Hello 👋 World');
      stream.output = '';

      log('Hi');

      // Should clear the wider content
      expect(stream.output).toContain(clearToEndOfLine);
    });

    it('sync method updates line widths tracking', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: false, showCursor: true });

      // Sync with long content (no actual write)
      log.sync('Very long content here');

      // Render shorter content - should trigger clear
      log('Short');

      expect(stream.output).toContain(clearToEndOfLine);
    });

    it('clear method resets line width tracking', () => {
      const stream = createMockStream();
      const log = createLogUpdate(stream, { incremental: false, showCursor: true });

      // First render with long content
      log('Very long content');
      stream.output = '';

      // Clear resets tracking
      log.clear();
      stream.output = '';

      // Short content after clear - should NOT have clear code
      // because there's no previous width to compare to
      log('Short');

      // The first render after clear doesn't know about previous widths
      // so it won't add ESC[K (except potentially at end for clearFromCursor)
      const firstLine = stream.output.split('\n')[0];
      // After clear, previousLineWidths is [], so prevWidth defaults to 0
      // newWidth > 0, so no ESC[K should be added
      expect(firstLine).toBe('\u001B[HShort');
    });

    // =========================================================================
    // Terminal simulation tests - prove ghosting is actually prevented
    // =========================================================================

    describe('terminal simulation (proves no ghosting)', () => {
      it('proves shrinking content leaves no ghost characters', () => {
        const stream = createMockStream();
        const log = createLogUpdate(stream, { incremental: false, showCursor: true });

        // First render: "Hello World!" on line 0
        log('Hello World!');

        // Second render: "Hi" - should not leave "llo World!" visible
        log('Hi');

        // Simulate what the terminal would show
        const terminalLines = simulateTerminal(stream.output);

        // Line 0 should be exactly "Hi", no ghost characters
        expect(terminalLines[0]).toBe('Hi');
        // Should NOT contain any remnants of "Hello World!"
        expect(terminalLines[0]).not.toContain('llo');
        expect(terminalLines[0]).not.toContain('World');
      });

      it('proves multiline shrinking leaves no ghost content', () => {
        const stream = createMockStream();
        const log = createLogUpdate(stream, { incremental: false, showCursor: true });

        // First render: 3 lines, varying lengths
        log('First line is very long\nSecond line\nThird');

        // Second render: all lines shorter
        log('Short\nTiny\nX');

        const terminalLines = simulateTerminal(stream.output);

        expect(terminalLines[0]).toBe('Short');
        expect(terminalLines[1]).toBe('Tiny');
        expect(terminalLines[2]).toBe('X');

        // No ghost content from previous render
        expect(terminalLines[0]).not.toContain('line');
        expect(terminalLines[1]).not.toContain('Second');
      });

      it('proves height reduction clears ghost lines', () => {
        const stream = createMockStream();
        const log = createLogUpdate(stream, { incremental: false, showCursor: true });

        // First render: 5 lines
        log('Line 1\nLine 2\nLine 3\nLine 4\nLine 5');

        // Second render: only 2 lines
        log('Line A\nLine B');

        const terminalLines = simulateTerminal(stream.output);

        expect(terminalLines[0]).toBe('Line A');
        expect(terminalLines[1]).toBe('Line B');
        // Lines 3-5 should be cleared (empty)
        expect(terminalLines[2]).toBe('');
        expect(terminalLines[3]).toBe('');
        expect(terminalLines[4]).toBe('');
      });

      it('proves mixed shrink/grow scenario works correctly', () => {
        const stream = createMockStream();
        const log = createLogUpdate(stream, { incremental: false, showCursor: true });

        // First render
        log('AAAAAAAAAA\nBB\nCCCCCCCCCC');

        // Second render: line 1 shrinks, line 2 grows, line 3 same length
        log('AAA\nBBBBBBBBBB\nCCCCCCCCCC');

        const terminalLines = simulateTerminal(stream.output);

        expect(terminalLines[0]).toBe('AAA'); // Shrank - no ghost A's
        expect(terminalLines[1]).toBe('BBBBBBBBBB'); // Grew
        expect(terminalLines[2]).toBe('CCCCCCCCCC'); // Same
      });

      it('proves rapid successive renders maintain correctness', () => {
        const stream = createMockStream();
        const log = createLogUpdate(stream, { incremental: false, showCursor: true });

        // Simulate rapid updates like a progress bar
        log('Progress: ##########');
        log('Progress: ####');
        log('Progress: ########');
        log('Progress: ##');
        log('Done!');

        const terminalLines = simulateTerminal(stream.output);

        // Final state should be just "Done!" with no progress remnants
        expect(terminalLines[0]).toBe('Done!');
        expect(terminalLines[0]).not.toContain('#');
        expect(terminalLines[0]).not.toContain('Progress');
      });

      it('proves empty line transition works', () => {
        const stream = createMockStream();
        const log = createLogUpdate(stream, { incremental: false, showCursor: true });

        log('Some content here');
        log(''); // Empty content

        const terminalLines = simulateTerminal(stream.output);

        // Should be completely empty, no ghost content
        expect(terminalLines[0]).toBe('');
        expect(terminalLines.slice(0, 5).every(l => l === '')).toBe(true);
      });

      it('proves ANSI colored text shrinking clears properly', () => {
        const stream = createMockStream();
        const log = createLogUpdate(stream, { incremental: false, showCursor: true });

        // First render with ANSI colors
        log('\u001B[31mRed text here\u001B[0m');

        // Second render shorter
        log('\u001B[32mHi\u001B[0m');

        const terminalLines = simulateTerminal(stream.output);

        // Should only have "Hi", no ghost "text here"
        expect(terminalLines[0]).toBe('Hi');
        expect(terminalLines[0]).not.toContain('text');
        expect(terminalLines[0]).not.toContain('here');
      });

      it('proves box-drawing characters are cleared properly', () => {
        const stream = createMockStream();
        const log = createLogUpdate(stream, { incremental: false, showCursor: true });

        // First render: a box
        log('┌──────────┐\n│ Content  │\n└──────────┘');

        // Second render: smaller content
        log('Hi');

        const terminalLines = simulateTerminal(stream.output);

        expect(terminalLines[0]).toBe('Hi');
        expect(terminalLines[1]).toBe('');
        expect(terminalLines[2]).toBe('');
        // No box remnants
        expect(terminalLines.join('')).not.toContain('┌');
        expect(terminalLines.join('')).not.toContain('─');
        expect(terminalLines.join('')).not.toContain('│');
      });
    });
  });
});
