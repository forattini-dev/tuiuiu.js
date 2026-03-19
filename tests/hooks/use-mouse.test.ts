import { describe, expect, it } from 'vitest';

import { parseMouseEvent } from '../../src/hooks/use-mouse.js';
import {
  generateSGRMouseSequence,
  generateX10MouseSequence,
} from '../../src/dev-tools/mouse-simulator.js';

describe('useMouse parser', () => {
  it('normalizes SGR mouse sequences to 0-based coordinates', () => {
    const result = parseMouseEvent(generateSGRMouseSequence(7, 4, 'left', 'click'));

    expect(result).not.toBeNull();
    expect(result!.event.x).toBe(7);
    expect(result!.event.y).toBe(4);
  });

  it('normalizes X10 mouse sequences to 0-based coordinates', () => {
    const result = parseMouseEvent(generateX10MouseSequence(3, 9, 'right', 'click'));

    expect(result).not.toBeNull();
    expect(result!.event.x).toBe(3);
    expect(result!.event.y).toBe(9);
    expect(result!.event.button).toBe('right');
  });
});
