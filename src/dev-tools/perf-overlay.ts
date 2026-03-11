import { Box, Text } from '../primitives/index.js';
import { getPerfInspectorSummary, getPerfInspectorConfig } from '../core/perf-inspector.js';
import type { VNode } from '../utils/types.js';

export interface PerfOverlayProps {
  title?: string;
  compact?: boolean;
  showPhases?: boolean;
  showStructural?: boolean;
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

function formatPhaseLines(): string[] {
  const summary = getPerfInspectorSummary();
  const entries = Object.entries(summary.phaseAverages)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);

  return entries.map(([phase, value]) => `${phase}: ${formatNumber(value)}ms`);
}

export function PerfOverlay(props: PerfOverlayProps = {}): VNode {
  const {
    title = 'Perf Inspector',
    compact = false,
    showPhases = true,
    showStructural = !compact,
  } = props;

  const summary = getPerfInspectorSummary();
  const config = getPerfInspectorConfig();
  const lastFrame = summary.lastFrame;
  const lines: VNode[] = [
    Text({ bold: true, color: summary.overBudgetCount > 0 ? 'yellow' : 'cyan' }, title),
  ];

  if (!lastFrame) {
    lines.push(Text({ dim: true }, 'No committed frames recorded yet.'));
    return Box({ flexDirection: 'column', padding: 1, borderStyle: 'single' }, ...lines);
  }

  lines.push(
    Text(
      { color: lastFrame.slow ? 'red' : 'green' },
      `last ${formatNumber(lastFrame.totalMs)}ms`,
    ),
    Text(
      { dim: true },
      `avg ${formatNumber(summary.averageFrameMs)}ms · p95 ${formatNumber(summary.p95FrameMs)}ms · budget ${formatNumber(config.budget.frameMs)}ms`,
    ),
    Text(
      { dim: true },
      `${summary.frameCount} frames · ${summary.slowFrameCount} slow · ${summary.overBudgetCount} over budget · ${lastFrame.renderer}`,
    ),
  );

  if (showStructural) {
    lines.push(
      Text(
        { dim: true },
        `bytes ${lastFrame.structural.outputByteCount} · patches ${lastFrame.structural.patchCount} · dirty ${lastFrame.structural.dirtyRectCount}`,
      ),
    );
  }

  if (showPhases) {
    for (const line of formatPhaseLines()) {
      lines.push(Text({ dim: true }, line));
    }
  }

  return Box({ flexDirection: 'column', padding: 1, borderStyle: 'single' }, ...lines);
}
