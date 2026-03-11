import { describe, expect, it } from 'vitest';
import { fingerprintValue } from '../../src/core/structural-fingerprint.js';

describe('structural fingerprint', () => {
  it('is stable for objects with different key order', () => {
    const a = fingerprintValue({ b: 2, a: 1, nested: { y: true, x: false } });
    const b = fingerprintValue({ nested: { x: false, y: true }, a: 1, b: 2 });

    expect(a).toBe(b);
  });

  it('ignores function values by default', () => {
    const a = fingerprintValue({ padding: 1, onClick: () => 'a' });
    const b = fingerprintValue({ padding: 1, onClick: () => 'b' });

    expect(a).toBe(b);
  });

  it('respects ignored keys', () => {
    const ignored = new Set(['layoutRef']);
    const a = fingerprintValue({ width: 10, layoutRef: { current: 1 } }, { ignoreKeys: ignored });
    const b = fingerprintValue({ width: 10, layoutRef: { current: 2 } }, { ignoreKeys: ignored });

    expect(a).toBe(b);
  });

  it('changes when structural values change', () => {
    const a = fingerprintValue({ padding: 1, borderStyle: 'single' });
    const b = fingerprintValue({ padding: 3, borderStyle: 'single' });

    expect(a).not.toBe(b);
  });
});
