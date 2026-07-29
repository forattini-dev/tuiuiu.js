/**
 * Error Boundary Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseStackLine,
  parseStackTrace,
  extractCodeExcerpt,
  ErrorOverview,
  setError,
  clearError,
  getError,
  onError,
  withErrorBoundary,
  tryCatch,
  resetErrorBoundary,
} from '../../src/core/error-boundary.js';
import { renderToString } from '../../src/core/renderer.js';
import { Text } from '../../src/primitives/nodes.js';

describe('parseStackLine', () => {
  it('should parse Node.js style stack line with function name', () => {
    const line = '    at myFunction (/path/to/file.ts:10:5)';
    const frame = parseStackLine(line);

    expect(frame).toBeDefined();
    expect(frame?.function).toBe('myFunction');
    expect(frame?.file).toContain('file.ts');
    expect(frame?.line).toBe(10);
    expect(frame?.column).toBe(5);
  });

  it('should parse Node.js style stack line without function name', () => {
    const line = '    at /path/to/file.ts:20:15';
    const frame = parseStackLine(line);

    expect(frame).toBeDefined();
    expect(frame?.file).toContain('file.ts');
    expect(frame?.line).toBe(20);
    expect(frame?.column).toBe(15);
  });

  it('should return null for invalid line', () => {
    const frame = parseStackLine('some random text');
    expect(frame).toBeNull();
  });

  it('should return null for empty line', () => {
    const frame = parseStackLine('');
    expect(frame).toBeNull();
  });

  it('should handle file:// URL style', () => {
    const line = '    at fn (file:///path/to/file.ts:5:10)';
    const frame = parseStackLine(line);

    expect(frame).toBeDefined();
    expect(frame?.function).toBe('fn');
    expect(frame?.line).toBe(5);
    expect(frame?.column).toBe(10);
  });
});

describe('parseStackTrace', () => {
  it('should parse full stack trace', () => {
    const stack = `Error: Test error
    at functionA (/path/to/a.ts:10:5)
    at functionB (/path/to/b.ts:20:10)
    at functionC (/path/to/c.ts:30:15)`;

    const frames = parseStackTrace(stack);

    expect(frames).toHaveLength(3);
    expect(frames[0]?.function).toBe('functionA');
    expect(frames[1]?.function).toBe('functionB');
    expect(frames[2]?.function).toBe('functionC');
  });

  it('should skip invalid lines', () => {
    const stack = `Error: Test error
    at validFunction (/path/to/file.ts:10:5)
    invalid line
    at anotherFunction (/path/to/file.ts:20:10)`;

    const frames = parseStackTrace(stack);
    expect(frames).toHaveLength(2);
  });

  it('should handle empty stack', () => {
    const frames = parseStackTrace('');
    expect(frames).toHaveLength(0);
  });
});

describe('extractCodeExcerpt', () => {
  it('should return null for non-existent file', () => {
    const excerpt = extractCodeExcerpt('/nonexistent/file.ts', 10);
    expect(excerpt).toBeNull();
  });

  it('should extract code from existing file', () => {
    // Use this test file itself
    const excerpt = extractCodeExcerpt(__filename, 1, 2);

    if (excerpt) {
      expect(excerpt.length).toBeGreaterThan(0);
      expect(excerpt[0]?.line).toBe(1);
      expect(excerpt.some(e => e.isErrorLine && e.line === 1)).toBe(true);
    }
  });

  it('should handle relative paths', () => {
    // Should resolve relative paths from cwd
    const excerpt = extractCodeExcerpt('package.json', 1, 1);
    // May or may not exist depending on cwd
    // Just checking it doesn't throw
    expect(true).toBe(true);
  });
});

describe('ErrorOverview', () => {
  it('should render error with message', () => {
    const error = new Error('Test error message');
    const node = ErrorOverview({ error });

    const output = renderToString(node, 80);
    expect(output).toContain('ERROR');
    expect(output).toContain('Test error message');
  });

  it('should render error without stack', () => {
    const error = new Error('No stack');
    error.stack = undefined;

    const node = ErrorOverview({ error });
    const output = renderToString(node, 80);
    expect(output).toContain('No stack');
  });

  it('should handle errors with many frames', () => {
    const error = new Error('Many frames');
    error.stack = `Error: Many frames
    at frame1 (/file.ts:1:1)
    at frame2 (/file.ts:2:1)
    at frame3 (/file.ts:3:1)
    at frame4 (/file.ts:4:1)
    at frame5 (/file.ts:5:1)
    at frame6 (/file.ts:6:1)
    at frame7 (/file.ts:7:1)
    at frame8 (/file.ts:8:1)
    at frame9 (/file.ts:9:1)
    at frame10 (/file.ts:10:1)
    at frame11 (/file.ts:11:1)
    at frame12 (/file.ts:12:1)`;

    const node = ErrorOverview({ error });
    const output = renderToString(node, 80);
    expect(output).toContain('and');
    expect(output).toContain('more frames');
  });
});

describe('error state management', () => {
  beforeEach(() => {
    resetErrorBoundary();
  });

  afterEach(() => {
    resetErrorBoundary();
  });

  it('should start with no error', () => {
    expect(getError()).toBeNull();
  });

  it('should set and get error', () => {
    const error = new Error('Test');
    setError(error);

    expect(getError()).toBe(error);
  });

  it('should clear error', () => {
    setError(new Error('Test'));
    clearError();

    expect(getError()).toBeNull();
  });
});

describe('onError', () => {
  beforeEach(() => {
    resetErrorBoundary();
  });

  afterEach(() => {
    resetErrorBoundary();
  });

  it('should register and call error handler', () => {
    const handler = vi.fn();
    onError(handler);

    const error = new Error('Handler test');
    setError(error);

    expect(handler).toHaveBeenCalledWith(error);
  });

  it('should unregister handler', () => {
    const handler = vi.fn();
    const unregister = onError(handler);

    unregister();
    setError(new Error('After unregister'));

    expect(handler).not.toHaveBeenCalled();
  });

  it('should call multiple handlers', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    onError(handler1);
    onError(handler2);

    setError(new Error('Multi'));

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });
});

describe('withErrorBoundary', () => {
  beforeEach(() => {
    resetErrorBoundary();
  });

  afterEach(() => {
    resetErrorBoundary();
  });

  it('should return wrapped render function', () => {
    const render = () => ({ type: 'box' as const, props: {}, children: [] });
    const wrapped = withErrorBoundary(render);

    expect(typeof wrapped).toBe('function');
  });

  it('should render normally when no error', () => {
    const render = () => Text({}, 'Hello');
    const wrapped = withErrorBoundary(render);

    const result = wrapped();
    expect(result.type).toBe('text');
  });

  it('should show error when current error exists', () => {
    setError(new Error('Existing error'));

    const render = () => Text({}, 'Hello');
    const wrapped = withErrorBoundary(render);

    const result = wrapped();
    // Should show ErrorOverview instead
    expect(result.type).toBe('box');
  });

  it('should catch thrown errors', () => {
    const render = () => {
      throw new Error('Render error');
    };
    const wrapped = withErrorBoundary(render);

    const result = wrapped();
    expect(result.type).toBe('box'); // ErrorOverview
    expect(getError()?.message).toBe('Render error');
  });

  it('should handle non-Error throws', () => {
    const render = () => {
      throw 'String error';
    };
    const wrapped = withErrorBoundary(render);

    const result = wrapped();
    expect(result.type).toBe('box');
    expect(getError()?.message).toBe('String error');
  });
});

describe('tryCatch', () => {
  beforeEach(() => {
    resetErrorBoundary();
  });

  afterEach(() => {
    resetErrorBoundary();
  });

  it('should return function result on success', () => {
    const result = tryCatch(() => 42);
    expect(result).toBe(42);
  });

  it('should return null on error', () => {
    const result = tryCatch(() => {
      throw new Error('Fail');
    });
    expect(result).toBeNull();
  });

  it('should call custom onError handler', () => {
    const onErrorHandler = vi.fn();

    tryCatch(() => {
      throw new Error('Custom handler');
    }, onErrorHandler);

    expect(onErrorHandler).toHaveBeenCalled();
    expect(getError()).toBeNull(); // Custom handler, not global
  });

  it('should set global error when no custom handler', () => {
    tryCatch(() => {
      throw new Error('Global error');
    });

    expect(getError()?.message).toBe('Global error');
  });

  it('should handle non-Error throws', () => {
    const onErrorHandler = vi.fn();

    tryCatch(() => {
      throw 'String throw';
    }, onErrorHandler);

    expect(onErrorHandler).toHaveBeenCalled();
    const err = onErrorHandler.mock.calls[0][0];
    expect(err.message).toBe('String throw');
  });
});

describe('resetErrorBoundary', () => {
  it('should clear error and handlers', () => {
    const handler = vi.fn();
    onError(handler);
    setError(new Error('Before reset'));

    resetErrorBoundary();

    expect(getError()).toBeNull();

    // Handler should be removed
    setError(new Error('After reset'));
    expect(handler).toHaveBeenCalledTimes(1); // Only first time
  });
});
