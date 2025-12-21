/**
 * Tests for cursor control utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showCursor, hideCursor, toggleCursor, isCursorHidden, cursor } from '../../src/utils/cursor.js';
import { Writable } from 'node:stream';

// Create a mock TTY stream
function createMockTTYStream(): Writable & { isTTY: true; output: string } {
  let output = '';
  const stream = new Writable({
    write(chunk, encoding, callback) {
      output += chunk.toString();
      callback();
    },
  });
  (stream as any).isTTY = true;
  Object.defineProperty(stream, 'output', {
    get: () => output,
    set: (v: string) => { output = v; },
  });
  return stream as any;
}

// Create a non-TTY stream
function createMockNonTTYStream(): Writable & { output: string } {
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
  return stream as any;
}

describe('cursor utilities', () => {
  describe('showCursor', () => {
    it('writes show cursor ANSI code to TTY stream', () => {
      const stream = createMockTTYStream();
      showCursor(stream);
      expect(stream.output).toBe('\u001B[?25h');
    });

    it('does not write to non-TTY stream', () => {
      const stream = createMockNonTTYStream();
      showCursor(stream);
      expect(stream.output).toBe('');
    });
  });

  describe('hideCursor', () => {
    it('writes hide cursor ANSI code to TTY stream', () => {
      const stream = createMockTTYStream();
      hideCursor(stream);
      expect(stream.output).toBe('\u001B[?25l');
    });

    it('does not write to non-TTY stream', () => {
      const stream = createMockNonTTYStream();
      hideCursor(stream);
      expect(stream.output).toBe('');
    });
  });

  describe('toggleCursor', () => {
    it('toggles cursor visibility', () => {
      const stream = createMockTTYStream();

      // Start by showing (ensures cursor is in known state)
      showCursor(stream);
      stream.output = '';

      // Toggle should hide
      toggleCursor(undefined, stream);
      expect(stream.output).toContain('\u001B[?25l');
    });

    it('with force=true sets isHidden=false then hides', () => {
      const stream = createMockTTYStream();
      // force=true means "force visible state" -> isHidden=false -> toggles to hide
      toggleCursor(true, stream);
      expect(stream.output).toBe('\u001B[?25l');
    });

    it('with force=false sets isHidden=true then shows', () => {
      const stream = createMockTTYStream();

      // First hide to reset state
      hideCursor(stream);
      stream.output = '';

      // force=false means "force hidden state" -> isHidden=true -> toggles to show
      toggleCursor(false, stream);
      expect(stream.output).toBe('\u001B[?25h');
    });
  });

  describe('isCursorHidden', () => {
    it('returns current hidden state', () => {
      const stream = createMockTTYStream();
      showCursor(stream);
      expect(isCursorHidden()).toBe(false);

      hideCursor(stream);
      expect(isCursorHidden()).toBe(true);

      showCursor(stream);
      expect(isCursorHidden()).toBe(false);
    });
  });

  describe('cursor object', () => {
    it('exports cursor methods', () => {
      expect(cursor.show).toBe(showCursor);
      expect(cursor.hide).toBe(hideCursor);
      expect(cursor.toggle).toBe(toggleCursor);
      expect(cursor.isHidden).toBe(isCursorHidden);
    });
  });
});
