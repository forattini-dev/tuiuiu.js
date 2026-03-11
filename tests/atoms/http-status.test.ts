/**
 * Tests for HttpStatus component.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { VNode } from '../../src/utils/types.js';
import { setRenderMode } from '../../src/core/capabilities.js';
import { resolveColor } from '../../src/core/theme.js';
import {
  HttpStatus,
  httpError,
  httpNotFound,
  httpOk,
} from '../../src/atoms/http-status.js';

describe('HttpStatus', () => {
  beforeEach(() => {
    setRenderMode('ascii');
  });

  afterEach(() => {
    setRenderMode('unicode');
  });

  it('renders 4xx codes with warning color', () => {
    const node = HttpStatus({ code: 404 });

    expect(node.type).toBe('text');
    expect(node.props.backgroundColor).toBe(resolveColor('warning'));
    expect(node.props.children).toBe(' 404 ');
  });

  it('renders status text when requested', () => {
    const node = HttpStatus({
      code: 404,
      showText: true,
      variant: 'text',
    });

    expect(node.type).toBe('text');
    expect(node.props.color).toBe(resolveColor('warning'));
    expect(node.props.children).toBe('404 Not Found');
  });

  it('renders dot variant and exposes convenience presets', () => {
    const dot = HttpStatus({
      code: 200,
      showText: true,
      variant: 'dot',
    });

    expect(dot.type).toBe('box');
    expect((dot.children[0] as VNode).props.children).toBe('*');
    expect((dot.children[1] as VNode).props.children).toBe('200 OK');

    expect((httpOk() as VNode).props.children).toBe(' 200 ');
    expect((httpNotFound(true) as VNode).props.children).toBe(' 404 Not Found ');
    expect((httpError(503, true) as VNode).props.children).toBe(' 503 Service Unavailable ');
  });
});
