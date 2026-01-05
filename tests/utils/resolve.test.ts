/**
 * Tests for resolve utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  resolve,
  isReactive,
  resolveAll,
  createResolver,
  resolveProps,
} from '../../src/utils/resolve.js';

describe('resolve utilities', () => {
  it('resolves static and reactive values', () => {
    expect(resolve('ok')).toBe('ok');
    expect(resolve(() => 'ok')).toBe('ok');
  });

  it('detects reactive values', () => {
    expect(isReactive(() => 1)).toBe(true);
    expect(isReactive(1)).toBe(false);
  });

  it('resolves arrays and resolver helpers', () => {
    const resolved = resolveAll([() => 1, 'two'] as const);
    expect(resolved).toEqual([1, 'two']);

    const resolver = createResolver<number>();
    expect(resolver(() => 3)).toBe(3);
  });

  it('resolves props and ignores prototype keys', () => {
    const base = { hidden: () => 'hidden' };
    const props = Object.create(base) as { visible: () => string; hidden?: () => string };
    props.visible = () => 'shown';

    const resolved = resolveProps(props);
    expect(resolved).toEqual({ visible: 'shown' });
  });
});
