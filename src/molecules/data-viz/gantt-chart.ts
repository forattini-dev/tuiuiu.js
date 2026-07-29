/**
 * GanttChart - Project timeline visualization
 *
 * Features:
 * - Task timeline with start/end dates
 * - Progress percentage
 * - Status color coding
 * - Milestone markers
 */

import type { VNode, ColorValue } from '../../utils/types.js';
import { Box, Text } from '../../primitives/nodes.js';
import { padTextToWidth } from '../../utils/text-utils.js';

// =============================================================================
// Types
// =============================================================================

export type TaskStatus = 'pending' | 'in-progress' | 'complete' | 'blocked';

export interface GanttTask {
  /** Task ID */
  id: string;
  /** Task name */
  name: string;
  /** Start date (ISO 8601 or Date) */
  startDate: Date | string;
  /** End date (ISO 8601 or Date) */
  endDate: Date | string;
  /** Completion percentage (0-100) */
  progress?: number;
  /** Task status */
  status?: TaskStatus;
  /** Is milestone */
  isMilestone?: boolean;
  /** Optional dependency on other task ID */
  dependsOn?: string;
}

export interface GanttChartOptions {
  /** Tasks to display */
  tasks: GanttTask[];
  /** Chart width */
  width?: number;
  /** Title */
  title?: string;
  /** Show legend */
  showLegend?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse date
 */
function parseDate(date: Date | string, taskId: string, field: 'startDate' | 'endDate'): Date {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  if (!Number.isFinite(parsed.getTime())) {
    throw new RangeError(`GanttChart task "${taskId}" has an invalid ${field}`);
  }
  return parsed;
}

/**
 * Get status color
 */
function getStatusColor(status?: TaskStatus): ColorValue {
  switch (status) {
    case 'pending':
      return 'yellow';
    case 'in-progress':
      return 'blue';
    case 'complete':
      return 'green';
    case 'blocked':
      return 'red';
    default:
      return 'cyan';
  }
}

// =============================================================================
// Component
// =============================================================================

/**
 * GanttChart - Project timeline
 *
 * @example
 * GanttChart({
 *   tasks: [
 *     {
 *       id: '1',
 *       name: 'Design',
 *       startDate: '2024-01-01',
 *       endDate: '2024-01-15',
 *       progress: 100,
 *       status: 'complete',
 *     },
 *     {
 *       id: '2',
 *       name: 'Development',
 *       startDate: '2024-01-15',
 *       endDate: '2024-02-15',
 *       progress: 60,
 *       status: 'in-progress',
 *     },
 *   ],
 * })
 */
export function GanttChart(props: GanttChartOptions): VNode {
  const {
    tasks,
    width = 80,
    title,
    showLegend = true,
  } = props;

  if (tasks.length === 0) {
    return Text({ color: 'gray', dim: true }, 'No tasks');
  }
  if (!Number.isSafeInteger(width) || width < 3) {
    throw new RangeError('GanttChart width must be a safe integer of at least 3');
  }

  // Calculate date range
  let minDate = new Date(8640000000000000);
  let maxDate = new Date(-8640000000000000);

  for (const task of tasks) {
    const start = parseDate(task.startDate, task.id, 'startDate');
    const end = parseDate(task.endDate, task.id, 'endDate');
    if (end < start) {
      throw new RangeError(`GanttChart task "${task.id}" ends before it starts`);
    }
    if (start < minDate) minDate = start;
    if (end > maxDate) maxDate = end;
  }

  const dateRange = Math.max(1, maxDate.getTime() - minDate.getTime());
  const nameWidth = Math.min(20, width - 2);
  const barWidth = Math.max(1, width - nameWidth - 1);

  // Build rows
  const displayLines: VNode[] = [];

  // Title
  if (title) {
    displayLines.push(
      Box(
        { marginBottom: 1 },
        Text({ color: 'white', bold: true }, title)
      )
    );
  }

  // Task rows
  const taskRows: VNode[] = [];
  for (const task of tasks) {
    const startDate = parseDate(task.startDate, task.id, 'startDate');
    const endDate = parseDate(task.endDate, task.id, 'endDate');
    const duration = endDate.getTime() - startDate.getTime();
    const offset = Math.round(((startDate.getTime() - minDate.getTime()) / dateRange) * barWidth);
    const barLength = Math.max(1, Math.round((duration / dateRange) * barWidth));
    const requestedProgress = task.progress ?? 0;
    const progress = Number.isFinite(requestedProgress)
      ? Math.max(0, Math.min(100, requestedProgress))
      : 0;
    const fillLength = Math.round((progress / 100) * barLength);

    // Task name
    const nameCell = Text(
      { color: 'gray' },
      padTextToWidth(task.name, nameWidth)
    );

    // Build bar
    const bar: string[] = [];
    bar.push(' '.repeat(offset));

    if (task.isMilestone) {
      bar.push('◆');
    } else {
      // Filled portion
      if (fillLength > 0) {
        bar.push('█'.repeat(fillLength));
      }
      // Empty portion
      if (fillLength < barLength) {
        bar.push('░'.repeat(barLength - fillLength));
      }
    }

    const barStr = bar.join('');
    const statusColor = getStatusColor(task.status);
    const barCell = Text({ color: statusColor }, barStr);

    const rowContent = Box(
      { flexDirection: 'row', gap: 1 },
      nameCell,
      barCell
    );

    taskRows.push(rowContent);
  }

  displayLines.push(Box({ flexDirection: 'column' }, ...taskRows));

  // Legend
  if (showLegend) {
    const statuses: TaskStatus[] = ['pending', 'in-progress', 'complete', 'blocked'];
    const legendItems = statuses.map((status) => {
      const color = getStatusColor(status);
      const label = status.replace('-', ' ');
      return Box(
        { flexDirection: 'row', gap: 1 },
        Text({ color }, '■'),
        Text({ color: 'gray' }, label)
      );
    });

    displayLines.push(
      Box(
        { flexDirection: 'row', gap: 2, marginTop: 1 },
        ...legendItems
      )
    );
  }

  return Box({ flexDirection: 'column' }, ...displayLines);
}
