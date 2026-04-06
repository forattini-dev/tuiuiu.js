/**
 * Tests for withSilentErrorBoundary
 *
 * Tests the silent error boundary from error-boundary.ts
 */

import { describe, it, expect } from 'vitest';
import { withSilentErrorBoundary } from '../../src/core/error-boundary.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import type { VNode } from '../../src/utils/types.js';

describe('withSilentErrorBoundary', () => {
  it('returns the render result when no error occurs', () => {
    const wrapped = withSilentErrorBoundary(() =>
      Text({}, 'Hello World')
    );

    const result = wrapped();
    expect(result).not.toBeNull();
    expect(result.type).toBe('text');
  });

  it('returns an empty Box when the render function throws', () => {
    const wrapped = withSilentErrorBoundary(() => {
      throw new Error('Component crashed');
    });

    const result = wrapped();
    expect(result).not.toBeNull();
    expect(result.type).toBe('box');
    expect(result.children).toEqual([]);
  });

  it('does not propagate the error', () => {
    const wrapped = withSilentErrorBoundary(() => {
      throw new Error('Should not propagate');
    });

    // Calling should not throw
    expect(() => wrapped()).not.toThrow();
  });

  it('returns correct VNode structure from successful render', () => {
    const wrapped = withSilentErrorBoundary(() =>
      Box({ flexDirection: 'column' },
        Text({ bold: true }, 'Title'),
        Text({}, 'Content')
      )
    );

    const result = wrapped();
    expect(result.type).toBe('box');
    expect(result.children).toHaveLength(2);
    expect(result.children[0].type).toBe('text');
    expect(result.children[1].type).toBe('text');
  });

  it('catches non-Error thrown values', () => {
    const wrapped = withSilentErrorBoundary(() => {
      throw 'string error';
    });

    const result = wrapped();
    expect(result).not.toBeNull();
    expect(result.type).toBe('box');
  });

  it('catches TypeError exceptions', () => {
    const wrapped = withSilentErrorBoundary(() => {
      const obj: any = null;
      return obj.nonExistentMethod();
    });

    const result = wrapped();
    expect(result.type).toBe('box');
  });

  it('can be called multiple times', () => {
    let callCount = 0;
    const wrapped = withSilentErrorBoundary(() => {
      callCount++;
      if (callCount === 1) {
        throw new Error('First call fails');
      }
      return Text({}, 'Second call succeeds');
    });

    // First call: error -> empty Box
    const result1 = wrapped();
    expect(result1.type).toBe('box');

    // Second call: success -> actual content
    const result2 = wrapped();
    expect(result2.type).toBe('text');
  });

  it('wraps the function and returns a new function', () => {
    const original = () => Text({}, 'test');
    const wrapped = withSilentErrorBoundary(original);

    expect(typeof wrapped).toBe('function');
    expect(wrapped).not.toBe(original);
  });
});
