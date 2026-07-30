/**
 * Internal production-frame lifecycle.
 *
 * All presentation adapters use this seam so frame policy, activation,
 * runtime finalization, and performance recording cannot drift independently.
 */

import type { VNode } from '../utils/types.js';
import {
  createFrameSnapshot,
  finalizeFrameRuntimeMetrics,
  setCommittedFrameSnapshot,
  type FrameInput,
  type FrameSnapshot,
} from './frame.js';
import { recordCommittedFrame } from './perf-inspector.js';

const PRODUCTION_FRAME_OPTIONS = {
  eagerHitTargets: false,
  eagerQueries: false,
  eagerWarnings: false,
} as const;

export type FramePresentationAdapter = 'ansi' | 'delta';

export function createProductionFrameSnapshot(
  node: VNode,
  input: FrameInput,
): FrameSnapshot {
  return createFrameSnapshot(node, input, PRODUCTION_FRAME_OPTIONS);
}

export function activateProductionFrame(frame: FrameSnapshot): void {
  setCommittedFrameSnapshot(frame);
}

export function commitProductionFrame(
  frame: FrameSnapshot,
  options: {
    renderer: FramePresentationAdapter;
    runtimeStartAt?: number;
  },
): void {
  finalizeFrameRuntimeMetrics(
    frame,
    options.runtimeStartAt
      ?? frame.metrics.runtimeStartAt
      ?? frame.metrics.frameStartAt,
  );
  recordCommittedFrame(frame, { renderer: options.renderer });
}
