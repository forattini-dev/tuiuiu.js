import { describe, expect, it } from 'vitest';
import { Box, Text } from '../../src/primitives/nodes.js';

describe('VNode identity', () => {
  it('promotes visual keys to the structural VNode field', () => {
    expect(Box({ key: 'box' }).key).toBe('box');
    expect(Text({ key: 7 }, 'text').key).toBe(7);
  });
});
