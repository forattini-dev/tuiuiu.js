/**
 * Tests for MetricDisplay component and createMetric state.
 */

import { describe, it, expect } from 'vitest';
import type { VNode } from '../../src/utils/types.js';
import { resolveColor } from '../../src/core/theme.js';
import { createMetric, MetricDisplay } from '../../src/atoms/metric-display.js';

function collectText(node: VNode): string[] {
  if (node.type === 'text') {
    return [String(node.props.children ?? '')];
  }
  const children = (node.children || []) as VNode[];
  return children.flatMap(collectText);
}

describe('createMetric', () => {
  it('tracks history, delta, and threshold color', () => {
    const metric = createMetric({
      label: 'CPU',
      unit: '%',
      initial: 0,
      historySize: 2,
      thresholds: {
        success: [0, 50],
        error: [51, 100],
      },
    });

    metric.set(10);
    metric.set(60);

    expect(metric.history()).toEqual([10, 60]);
    expect(metric.delta()).toBe(500);
    expect(metric.color()).toBe(resolveColor('error'));
  });

  it('handles zero baseline for delta', () => {
    const metric = createMetric({ label: 'Req/s', initial: 0 });
    metric.set(5);
    expect(metric.delta()).toBe(100);
  });
});

describe('MetricDisplay', () => {
  it('renders horizontal layout with trend', () => {
    const node = MetricDisplay({
      label: 'CPU',
      value: 1.5,
      unit: '%',
      delta: 2.5,
      trend: [1, 2, 3],
      showTrend: true,
      layout: 'horizontal',
      size: 'large',
    });

    expect(node.type).toBe('box');
    expect(node.props.flexDirection).toBe('row');

    const texts = collectText(node);
    expect(texts).toContain('CPU:');
    expect(texts).toContain('1.5%');
    expect(texts).toContain('+2.5%');
  });

  it('renders vertical layout with thresholds and hides delta', () => {
    const node = MetricDisplay({
      label: 'Memory',
      value: 42,
      unit: 'MB',
      delta: 0,
      layout: 'vertical',
      size: 'compact',
      thresholds: {
        success: [0, 50],
        error: [51, 100],
      },
      showTrend: false,
      showDelta: false,
    });

    expect(node.type).toBe('box');
    expect(node.props.flexDirection).toBe('column');

    const children = node.children as VNode[];
    const valueNode = children[1]?.children?.[0] as VNode;
    expect(valueNode.props.color).toBe(resolveColor('success'));

    const texts = collectText(node);
    expect(texts).toContain('Memory');
    expect(texts).toContain('42MB');
    expect(texts).not.toContain('0%');
  });

  it('renders metric state and delta color', () => {
    const metric = createMetric({ label: 'Latency', unit: 'ms', initial: 100 });
    metric.set(50);

    const node = MetricDisplay({
      metric,
      showTrend: false,
      layout: 'horizontal',
    });

    const children = node.children as VNode[];
    const deltaNode = children[2] as VNode;
    expect(deltaNode.props.color).toBe(resolveColor('error'));

    const texts = collectText(node);
    expect(texts).toContain('Latency:');
    expect(texts).toContain('50ms');
  });
});
