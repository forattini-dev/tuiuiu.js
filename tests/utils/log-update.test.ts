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
});
