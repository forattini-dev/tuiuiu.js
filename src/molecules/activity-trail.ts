/**
 * ActivityTrail - Compact agent/tool activity renderer
 *
 * @layer Molecule
 * @description Renders status-aware tool/action rows with bounded output previews
 */

import { Box, Text } from '../primitives/nodes.js';
import type { ColorValue, VNode } from '../utils/types.js';

export type ActivityStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'warning'
  | 'error'
  | 'skipped'
  | 'cancelled';

export interface ActivityTrailItem {
  /** Stable item id */
  id: string;
  /** Primary row label */
  label: string;
  /** Current item status */
  status?: ActivityStatus;
  /** Secondary row detail, often a command or tool name */
  detail?: string;
  /** Short human-readable summary */
  summary?: string;
  /** Completion progress, either 0-1 or 0-100 */
  progress?: number;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Start timestamp in milliseconds */
  startedAt?: number;
  /** End timestamp in milliseconds */
  endedAt?: number;
  /** Output text or lines to preview */
  output?: string | string[];
}

export interface ActivityTrailStatusStyle {
  /** Marker shown at row start */
  marker: string;
  /** Human label for the status */
  label: string;
  /** Color used for marker and status label */
  color: ColorValue;
}

export interface ActivityTrailOptions {
  /** Activity items to render */
  items: readonly ActivityTrailItem[];
  /** Item ids whose output preview should be expanded */
  expandedIds?: readonly string[] | Set<string>;
  /** Number of output lines shown for collapsed items (default: 2) */
  previewLines?: number;
  /** Number of output lines shown for expanded items (default: Infinity) */
  expandedPreviewLines?: number;
  /** Maximum output line width before truncation */
  maxOutputLineLength?: number;
  /** Show output previews (default: true) */
  showOutput?: boolean;
  /** Show progress metadata (default: true) */
  showProgress?: boolean;
  /** Show duration metadata (default: true) */
  showDuration?: boolean;
  /** Show textual status labels after markers (default: false) */
  showStatusLabel?: boolean;
  /** Empty state text */
  emptyText?: string;
  /** Show empty state when there are no items (default: true) */
  showEmpty?: boolean;
  /** Optional current time used to calculate running duration */
  now?: () => number;
  /** Per-status style overrides */
  statusStyles?: Partial<Record<ActivityStatus, Partial<ActivityTrailStatusStyle>>>;
}

const DEFAULT_STATUS_STYLES: Record<ActivityStatus, ActivityTrailStatusStyle> = {
  pending: { marker: '[ ]', label: 'pending', color: 'mutedForeground' },
  running: { marker: '[*]', label: 'running', color: 'primary' },
  success: { marker: '[ok]', label: 'success', color: 'success' },
  warning: { marker: '[!]', label: 'warning', color: 'warning' },
  error: { marker: '[x]', label: 'error', color: 'destructive' },
  skipped: { marker: '[-]', label: 'skipped', color: 'mutedForeground' },
  cancelled: { marker: '[~]', label: 'cancelled', color: 'mutedForeground' },
};

function resolveStatusStyle(
  status: ActivityStatus,
  overrides?: ActivityTrailOptions['statusStyles'],
): ActivityTrailStatusStyle {
  const base = DEFAULT_STATUS_STYLES[status];
  const override = overrides?.[status] ?? {};

  return {
    marker: override.marker ?? base.marker,
    label: override.label ?? base.label,
    color: override.color ?? base.color,
  };
}

function normalizeOutput(output: ActivityTrailItem['output']): string[] {
  if (!output) return [];
  const lines = Array.isArray(output) ? output : [output];
  return lines.flatMap((line) => String(line).split(/\r\n|\r|\n/));
}

function truncateLine(line: string, maxLength?: number): string {
  if (!maxLength || maxLength <= 0 || line.length <= maxLength) return line;
  if (maxLength <= 3) return line.slice(0, maxLength);
  return `${line.slice(0, maxLength - 3)}...`;
}

function formatProgress(progress: number): string {
  const percent = progress <= 1 ? progress * 100 : progress;
  const clamped = Math.max(0, Math.min(100, percent));
  return `${Math.round(clamped)}%`;
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1000) return `${Math.max(0, Math.round(durationMs))}ms`;
  if (durationMs < 10000) return `${(durationMs / 1000).toFixed(1)}s`;
  if (durationMs < 60000) return `${Math.round(durationMs / 1000)}s`;

  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.round((durationMs % 60000) / 1000);
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function resolveDuration(item: ActivityTrailItem, now: () => number): number | undefined {
  if (item.durationMs !== undefined) return item.durationMs;
  if (item.startedAt === undefined) return undefined;
  const end = item.endedAt ?? (item.status === 'running' ? now() : undefined);
  if (end === undefined) return undefined;
  return Math.max(0, end - item.startedAt);
}

function isExpanded(id: string, expandedIds?: readonly string[] | Set<string>): boolean {
  if (!expandedIds) return false;
  return expandedIds instanceof Set
    ? expandedIds.has(id)
    : expandedIds.includes(id);
}

function renderOutputPreview(
  item: ActivityTrailItem,
  options: Required<Pick<ActivityTrailOptions, 'previewLines' | 'showOutput'>> & ActivityTrailOptions,
): VNode | null {
  if (!options.showOutput) return null;

  const outputLines = normalizeOutput(item.output);
  if (outputLines.length === 0) return null;

  const expanded = isExpanded(item.id, options.expandedIds);
  const limit = expanded
    ? options.expandedPreviewLines ?? Number.POSITIVE_INFINITY
    : options.previewLines;
  const visibleLines = outputLines.slice(0, limit);
  const hiddenCount = outputLines.length - visibleLines.length;

  return Box(
    { flexDirection: 'column' },
    ...visibleLines.map((line) =>
      Box(
        { flexDirection: 'row' },
        Text({ color: 'mutedForeground', dim: true }, '  | '),
        Text({ color: 'mutedForeground' }, truncateLine(line, options.maxOutputLineLength))
      )
    ),
    hiddenCount > 0
      ? Box(
        { flexDirection: 'row' },
        Text({ color: 'mutedForeground', dim: true }, '  | '),
        Text({ color: 'mutedForeground', dim: true }, `... ${hiddenCount} more lines`)
      )
      : null
  );
}

function renderItem(item: ActivityTrailItem, options: ActivityTrailOptions): VNode {
  const status = item.status ?? 'pending';
  const style = resolveStatusStyle(status, options.statusStyles);
  const now = options.now ?? (() => Date.now());
  const duration = options.showDuration !== false ? resolveDuration(item, now) : undefined;
  const metadata: string[] = [];

  if (options.showProgress !== false && item.progress !== undefined) {
    metadata.push(formatProgress(item.progress));
  }
  if (duration !== undefined) {
    metadata.push(formatDuration(duration));
  }
  if (item.summary) {
    metadata.push(item.summary);
  }

  return Box(
    { flexDirection: 'column' },
    Box(
      { flexDirection: 'row', width: '100%' },
      Text({ color: style.color, bold: status === 'running' }, style.marker),
      options.showStatusLabel
        ? Text({ color: style.color, dim: true }, ` ${style.label}`)
        : null,
      Text({}, ' '),
      Text({ bold: true }, item.label),
      item.detail ? Text({ color: 'mutedForeground', dim: true }, ` ${item.detail}`) : null,
      metadata.length > 0
        ? Text({ color: 'mutedForeground', dim: true }, ` - ${metadata.join(' - ')}`)
        : null
    ),
    renderOutputPreview(item, {
      ...options,
      previewLines: options.previewLines ?? 2,
      showOutput: options.showOutput ?? true,
    })
  );
}

/**
 * ActivityTrail - Render compact tool/action activity rows.
 *
 * @example
 * ActivityTrail({
 *   items: [
 *     { id: 'read', label: 'Read file', status: 'success', durationMs: 42 },
 *     { id: 'test', label: 'Run tests', status: 'running', progress: 0.4 },
 *   ],
 * })
 */
export function ActivityTrail(options: ActivityTrailOptions): VNode {
  const {
    items,
    emptyText = 'No activity',
    showEmpty = true,
  } = options;

  if (items.length === 0) {
    return Box(
      { flexDirection: 'column', width: '100%' },
      showEmpty ? Text({ color: 'mutedForeground', dim: true }, emptyText) : null
    );
  }

  return Box(
    { flexDirection: 'column', width: '100%' },
    ...items.map((item) => renderItem(item, options))
  );
}
