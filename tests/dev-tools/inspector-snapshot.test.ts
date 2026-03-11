import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createDeltaRenderer, resetDeltaRenderer } from '../../src/core/delta-render.js';
import {
  clearCommittedFrameSnapshot,
  createFrameSnapshot,
  resetFrameSequenceForTesting,
  setCommittedFrameSnapshot,
} from '../../src/core/frame.js';
import { renderFrameToString } from '../../src/core/renderer.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import {
  createInspectorSnapshot,
  getDebugPanelData,
  getInspectorSnapshot,
  inspectLayout,
} from '../../src/dev-tools/index.js';

describe('InspectorSnapshot', () => {
  beforeEach(() => {
    resetFrameSequenceForTesting();
    clearCommittedFrameSnapshot();
    resetDeltaRenderer();
  });

  it('projects layout data from the committed frame instead of ad-hoc vnode traversal', () => {
    const frame = createFrameSnapshot(
      Box(
        { id: 'root', width: 20, padding: 1, borderStyle: 'single' },
        Box({ id: 'child', width: 5, height: 1 }),
      ),
      { width: 20, height: 10 },
    );

    const layout = inspectLayout(frame);

    expect(layout).toMatchObject({
      id: 'root',
      x: 0,
      y: 0,
      width: 20,
    });
    expect(layout.children[0]!).toMatchObject({
      id: 'child',
      x: 2,
      y: 2,
      width: 5,
      height: 1,
    });
  });

  it('surfaces committed-frame warnings and query diagnostics through the inspector snapshot', () => {
    const frame = createFrameSnapshot(
      Box(
        { id: 'root', width: 24 },
        Box({ id: 'dup' }, Text({}, 'A')),
        Box({ id: 'dup' }, Text({}, 'B')),
      ),
      { width: 24, height: 8 },
    );

    expect(frame.queries.getElement('dup').status).toBe('ambiguous');
    expect(frame.queries.getElement('missing').status).toBe('missing');
    expect(frame.queries.getScrollContainer('missing-scroll').status).toBe('missing');

    setCommittedFrameSnapshot(frame);

    const inspector = getInspectorSnapshot();

    expect(inspector).toBeDefined();
    expect(inspector!.frame).toBe(frame);
    expect(inspector!.tree[0]).toMatchObject({
      id: 'root',
      nodeType: 'box',
      bounds: {
        x: 0,
        y: 0,
        width: 24,
      },
    });
    expect(inspector!.warnings.map((warning) => warning.code)).toEqual(
      expect.arrayContaining([
        'duplicate-id',
        'query-ambiguous',
        'query-missing',
        'scroll-target-missing',
      ]),
    );
    expect(inspector!.metrics.structural.warningCount).toBe(inspector!.warnings.length);
  });

  it('aggregates debug panel data from the committed frame without ANSI parsing', () => {
    const frame = createFrameSnapshot(
      Box(
        { id: 'root', width: 20, padding: 1 },
        Text({}, 'debug'),
      ),
      { width: 20, height: 6 },
    );

    setCommittedFrameSnapshot(frame);

    const data = getDebugPanelData();

    expect(data.layout).toBeDefined();
    expect(data.layout!.id).toBe('root');
    expect(data.componentTree).toBeDefined();
    expect(data.componentTree!.type).toBe('box');
    expect(data.inspector).toBeDefined();
    expect(data.inspector!.frame).toBe(frame);
    expect(data.inspector!.tree[0]!.bounds.width).toBe(frame.layout.width);
  });

  it('exposes ansi and delta render phase metrics on the same committed frame snapshot', () => {
    const frame = createFrameSnapshot(
      Box(
        { id: 'root', width: 18, borderStyle: 'single' },
        Text({ color: 'cyan' }, 'metrics'),
      ),
      { width: 18, height: 6 },
    );

    const stdout = {
      columns: 18,
      rows: 6,
      write: vi.fn(),
    };
    const renderer = createDeltaRenderer({
      stdout: stdout as unknown as NodeJS.WriteStream,
      showCursor: true,
      useDelta: true,
    });

    expect(frame.metrics.phases.ansiRenderMs).toBeUndefined();
    expect(frame.metrics.phases.deltaRenderMs).toBeUndefined();

    renderFrameToString(frame);
    renderer.renderFrame(frame);

    const inspector = createInspectorSnapshot(frame);

    expect(inspector.metrics.phases.ansiRenderMs).toBeGreaterThanOrEqual(0);
    expect(inspector.metrics.phases.deltaRenderMs).toBeGreaterThanOrEqual(0);
  });
});
