import { beforeEach, describe, expect, it } from 'vitest';

import { Box, Text } from '../../src/primitives/nodes.js';
import {
  createFrameSnapshot,
  resetFrameSequenceForTesting,
} from '../../src/core/frame.js';

describe('FrameSnapshot performance modes', () => {
  beforeEach(() => {
    resetFrameSequenceForTesting();
  });

  it('keeps hit targets and duplicate warnings lazy when eager work is disabled', () => {
    const node = Box(
      { width: 30 },
      Box({ id: 'dup', onClick: () => {} } as any, Text({}, 'A')),
      Box({ id: 'dup', onClick: () => {} } as any, Text({}, 'B')),
    );

    const frame = createFrameSnapshot(
      node,
      { width: 30, height: 10 },
      {
        eagerHitTargets: false,
        eagerQueries: false,
        eagerWarnings: false,
      },
    );

    expect(frame.metrics.structural.hitTargetCount).toBe(0);
    expect(frame.metrics.structural.warningCount).toBe(0);
    expect(frame.metrics.phases.hitTargetRegistrationMs).toBeUndefined();

    expect(frame.hitTargets).toHaveLength(2);
    expect(frame.metrics.structural.hitTargetCount).toBe(2);
    expect(frame.metrics.phases.hitTargetRegistrationMs).toBeGreaterThanOrEqual(0);

    expect(frame.warnings).toContainEqual(
      expect.objectContaining({
        code: 'duplicate-id',
        id: 'dup',
      }),
    );
    expect(frame.metrics.structural.warningCount).toBe(1);
  });

  it('keeps committed-frame queries working when query indexes are built lazily', () => {
    const frame = createFrameSnapshot(
      Box({ id: 'root', width: 12, height: 3 } as any, Text({}, 'Lazy query')),
      { width: 20, height: 10, pointer: { x: 1, y: 1, buttonDown: false } },
      {
        eagerHitTargets: false,
        eagerQueries: false,
        eagerWarnings: false,
      },
    );

    expect(frame.queries.getElement('root')).toMatchObject({
      status: 'found',
      found: true,
      bounds: { x: 0, y: 0, width: 12, height: 3 },
    });
    expect(frame.queries.pointerOver('root')).toBe(true);
    expect(frame.queries.getElement('missing')).toMatchObject({
      status: 'missing',
      found: false,
    });
    expect(frame.metrics.structural.warningCount).toBe(1);
    expect(frame.warnings).toContainEqual(
      expect.objectContaining({
        code: 'query-missing',
        id: 'missing',
      }),
    );
  });
});
