/**
 * Tests for Update Batcher utilities
 *
 * Tests for createUpdateBatcher, createDebounced, createThrottled
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createUpdateBatcher,
  createDebounced,
  createThrottled,
} from '../../src/utils/batcher.js';

describe('createUpdateBatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should batch multiple rapid calls into one', () => {
    const flush = vi.fn();
    const batcher = createUpdateBatcher(flush, 200);

    // Schedule multiple times rapidly
    batcher.schedule();
    batcher.schedule();
    batcher.schedule();

    // Should not have flushed yet
    expect(flush).not.toHaveBeenCalled();

    // Advance time past interval
    vi.advanceTimersByTime(200);

    // Should flush exactly once
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('should flush immediately when flush() is called', () => {
    const flush = vi.fn();
    const batcher = createUpdateBatcher(flush, 200);

    batcher.schedule();
    expect(flush).not.toHaveBeenCalled();

    batcher.flush();
    expect(flush).toHaveBeenCalledTimes(1);

    // Original timeout should be canceled
    vi.advanceTimersByTime(200);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('should cancel pending updates without flushing', () => {
    const flush = vi.fn();
    const batcher = createUpdateBatcher(flush, 200);

    batcher.schedule();
    batcher.cancel();

    vi.advanceTimersByTime(200);
    expect(flush).not.toHaveBeenCalled();
  });

  it('should report pending status correctly', () => {
    const flush = vi.fn();
    const batcher = createUpdateBatcher(flush, 200);

    expect(batcher.isPending()).toBe(false);

    batcher.schedule();
    expect(batcher.isPending()).toBe(true);

    vi.advanceTimersByTime(200);
    expect(batcher.isPending()).toBe(false);
  });

  it('should respect custom interval', () => {
    const flush = vi.fn();
    const batcher = createUpdateBatcher(flush, 500);

    batcher.schedule();

    vi.advanceTimersByTime(200);
    expect(flush).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('should allow scheduling after flush', () => {
    const flush = vi.fn();
    const batcher = createUpdateBatcher(flush, 200);

    batcher.schedule();
    vi.advanceTimersByTime(200);
    expect(flush).toHaveBeenCalledTimes(1);

    batcher.schedule();
    vi.advanceTimersByTime(200);
    expect(flush).toHaveBeenCalledTimes(2);
  });
});

describe('createDebounced', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should delay execution until activity stops', () => {
    const fn = vi.fn();
    const debounced = createDebounced(fn, 300);

    debounced('a');
    debounced('b');
    debounced('c');

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('should reset timer on each call', () => {
    const fn = vi.fn();
    const debounced = createDebounced(fn, 300);

    debounced('a');
    vi.advanceTimersByTime(200);
    debounced('b');
    vi.advanceTimersByTime(200);
    debounced('c');

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('should cancel pending execution', () => {
    const fn = vi.fn();
    const debounced = createDebounced(fn, 300);

    debounced('test');
    debounced.cancel();

    vi.advanceTimersByTime(300);
    expect(fn).not.toHaveBeenCalled();
  });

  it('should flush immediately', () => {
    const fn = vi.fn();
    const debounced = createDebounced(fn, 300);

    debounced('test');
    debounced.flush();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('test');

    // Original timer should be cancelled
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('createThrottled', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute immediately on first call', () => {
    const fn = vi.fn();
    const throttled = createThrottled(fn, 100);

    throttled('first');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('first');
  });

  it('should throttle subsequent calls', () => {
    const fn = vi.fn();
    const throttled = createThrottled(fn, 100);

    throttled('a');
    throttled('b');
    throttled('c');

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('c');
  });

  it('should allow calls after interval passes', () => {
    const fn = vi.fn();
    const throttled = createThrottled(fn, 100);

    throttled('first');
    vi.advanceTimersByTime(100);

    throttled('second');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('second');
  });

  it('should cancel trailing call', () => {
    const fn = vi.fn();
    const throttled = createThrottled(fn, 100);

    throttled('first');
    throttled('second');

    expect(fn).toHaveBeenCalledTimes(1);

    throttled.cancel();
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
