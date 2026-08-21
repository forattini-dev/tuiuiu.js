/**
 * Tests for DataRow component.
 */

import { describe, expect, it } from 'vitest';
import type { VNode } from '../../src/utils/types.js';
import { createSignal } from '../../src/primitives/signal.js';
import { DataRow as OwnedDataRow } from '../../src/atoms/data-row.js';
import { testComponent } from '../../src/testing/component.js';

const DataRow = testComponent(OwnedDataRow);

function collectText(node: VNode): string[] {
  if (node.type === 'text') {
    return [String(node.props.children ?? '')];
  }

  return node.children.flatMap((child) => collectText(child as VNode));
}

describe('DataRow', () => {
  it('renders label and value on the same row', () => {
    const node = DataRow({
      label: 'Host',
      value: 'api.example.com',
    });

    expect(node.type).toBe('box');
    expect(node.props.flexDirection).toBe('row');
    expect(collectText(node)).toEqual(['Host', 'api.example.com']);
  });

  it('supports reactive values', () => {
    const [host, setHost] = createSignal('api.example.com');

    const first = DataRow({
      label: 'Host',
      value: host,
    });

    setHost('internal.service');

    const second = DataRow({
      label: 'Host',
      value: host,
    });

    expect(collectText(first)).toContain('api.example.com');
    expect(collectText(second)).toContain('internal.service');
  });

  it('renders status indicator and truncates long values', () => {
    const node = DataRow({
      label: 'Status',
      value: 'abcdefghij',
      truncate: 6,
      status: 'success',
    });

    const texts = collectText(node);

    expect(texts).toContain('Status');
    expect(texts).toContain('abc...');
    expect(texts).toContain('●');
  });
});
