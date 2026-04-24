/**
 * ActivityTrail Tests
 */

import { describe, expect, it } from 'vitest';
import { renderToString } from '../../src/core/renderer.js';
import { ActivityTrail } from '../../src/molecules/activity-trail.js';
import { stripAnsi } from '../../src/utils/text-utils.js';

describe('ActivityTrail', () => {
  it('renders compact rows for all statuses', () => {
    const node = ActivityTrail({
      showStatusLabel: true,
      items: [
        { id: 'pending', label: 'Pending step', status: 'pending' },
        { id: 'running', label: 'Running step', status: 'running' },
        { id: 'success', label: 'Success step', status: 'success' },
        { id: 'warning', label: 'Warning step', status: 'warning' },
        { id: 'error', label: 'Error step', status: 'error' },
        { id: 'skipped', label: 'Skipped step', status: 'skipped' },
        { id: 'cancelled', label: 'Cancelled step', status: 'cancelled' },
      ],
    });
    const output = stripAnsi(renderToString(node, 120));

    expect(output).toContain('[ ] pending Pending step');
    expect(output).toContain('[*] running Running step');
    expect(output).toContain('[ok] success Success step');
    expect(output).toContain('[!] warning Warning step');
    expect(output).toContain('[x] error Error step');
    expect(output).toContain('[-] skipped Skipped step');
    expect(output).toContain('[~] cancelled Cancelled step');
  });

  it('renders running metadata without full output expansion', () => {
    const node = ActivityTrail({
      previewLines: 1,
      items: [
        {
          id: 'test',
          label: 'Run tests',
          detail: 'pnpm vitest',
          status: 'running',
          progress: 0.42,
          durationMs: 1500,
          summary: 'executing',
          output: 'collecting\nrunning\nwaiting',
        },
      ],
    });
    const output = stripAnsi(renderToString(node, 120));

    expect(output).toContain('[*] Run tests pnpm vitest - 42% - 1.5s - executing');
    expect(output).toContain('collecting');
    expect(output).toContain('... 2 more lines');
    expect(output).not.toContain('running\n');
  });

  it('truncates collapsed output previews', () => {
    const node = ActivityTrail({
      previewLines: 2,
      items: [
        {
          id: 'logs',
          label: 'Read logs',
          status: 'success',
          output: ['line 1', 'line 2', 'line 3', 'line 4'],
        },
      ],
    });
    const output = stripAnsi(renderToString(node, 120));

    expect(output).toContain('line 1');
    expect(output).toContain('line 2');
    expect(output).toContain('... 2 more lines');
    expect(output).not.toContain('line 3');
    expect(output).not.toContain('line 4');
  });

  it('expands output for configured item ids', () => {
    const node = ActivityTrail({
      previewLines: 1,
      expandedIds: new Set(['logs']),
      items: [
        {
          id: 'logs',
          label: 'Read logs',
          status: 'success',
          output: ['line 1', 'line 2', 'line 3'],
        },
      ],
    });
    const output = stripAnsi(renderToString(node, 120));

    expect(output).toContain('line 1');
    expect(output).toContain('line 2');
    expect(output).toContain('line 3');
    expect(output).not.toContain('more lines');
  });

  it('honors expanded preview limits and line truncation', () => {
    const node = ActivityTrail({
      expandedIds: ['logs'],
      expandedPreviewLines: 2,
      maxOutputLineLength: 8,
      items: [
        {
          id: 'logs',
          label: 'Read logs',
          status: 'success',
          output: ['1234567890', 'abcdefghi', 'hidden'],
        },
      ],
    });
    const output = stripAnsi(renderToString(node, 120));

    expect(output).toContain('12345...');
    expect(output).toContain('abcde...');
    expect(output).toContain('... 1 more lines');
    expect(output).not.toContain('hidden');
  });

  it('renders a compact empty state', () => {
    const node = ActivityTrail({ items: [], emptyText: 'No tool calls' });
    const output = stripAnsi(renderToString(node, 80));

    expect(output).toContain('No tool calls');
  });
});
