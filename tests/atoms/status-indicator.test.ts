/**
 * Tests for StatusIndicator component.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { VNode } from '../../src/utils/types.js';
import { setRenderMode } from '../../src/core/capabilities.js';
import { resolveColor } from '../../src/core/theme.js';
import { beginRender, endRender, resetHookState } from '../../src/hooks/context.js';
import { StatusIndicator } from '../../src/atoms/status-indicator.js';

describe('StatusIndicator', () => {
  beforeEach(() => {
    setRenderMode('ascii');
    resetHookState();
  });

  afterEach(() => {
    setRenderMode('unicode');
    resetHookState();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders built-in status with label', () => {
    const node = StatusIndicator({ status: 'success', label: 'OK', size: 'sm' });
    const children = node.children as VNode[];

    expect(children).toHaveLength(2);
    expect(children[0]?.props.children).toBe('[ok]');
    expect(children[1]?.props.children).toBe('OK');
    expect(children[1]?.props.color).toBe('muted');
  });

  it('renders custom status with dot', () => {
    const node = StatusIndicator({
      status: { color: 'magenta', icon: 'X' },
      showIcon: false,
      showDot: true,
    });
    const children = node.children as VNode[];

    expect(children).toHaveLength(1);
    expect(children[0]?.props.children).toBe('*');
    expect(children[0]?.props.color).toBe(resolveColor('magenta'));
  });

  it('honors explicit pulse setting', () => {
    const node = StatusIndicator({ status: 'running', pulse: false });
    const children = node.children as VNode[];

    expect(children).toHaveLength(1);
    expect(children[0]?.props.children).toBe('[*]');
    expect(children[0]?.props.color).toBe(resolveColor('success'));
  });

  it('starts pulse animation for running status by default', () => {
    vi.useFakeTimers();

    beginRender();
    const node = StatusIndicator({ status: 'running' });
    endRender();

    const children = node.children as VNode[];
    expect(children[0]?.props.children).toBe('[*]');
  });
});
