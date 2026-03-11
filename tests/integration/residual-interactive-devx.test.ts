import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderToString } from '../../src/core/renderer.js';
import {
  beginRender,
  clearInputHandlers,
  emitInput,
  endRender,
  resetHookState,
} from '../../src/hooks/context.js';
import { Heatmap, Legend, VerticalTabs } from '../../src/molecules/index.js';
import { Scroll, useScroll } from '../../src/primitives/index.js';
import { Text } from '../../src/primitives/nodes.js';
import type { VNode } from '../../src/utils/types.js';
import { keys } from '../helpers/keyboard.js';

function renderWithHooks<T>(factory: () => T): T {
  beginRender();
  const result = factory();
  endRender();
  return result;
}

const scrollLines = Array.from({ length: 8 }, (_, index) => Text({}, `Line ${index + 1}`));

describe('Residual interactive DEVX', () => {
  beforeEach(() => {
    resetHookState();
    clearInputHandlers();
  });

  afterEach(() => {
    resetHookState();
    clearInputHandlers();
  });

  it('keeps Scroll position across parent rerenders', () => {
    const renderApp = () =>
      renderWithHooks(() => Scroll({ height: 3, width: 20, isActive: true }, ...scrollLines));

    renderApp();
    emitInput('', keys.down().key);
    emitInput('', keys.down().key);

    const rerendered = renderApp();
    const output = renderToString(rerendered, 20);

    expect(output).toContain('Line 3');
    expect(output).not.toContain('Line 1');
  });

  it('returns the same Scroll controller across rerenders', () => {
    const renderController = () =>
      renderWithHooks(() => {
        const scroll = useScroll();
        Scroll({ ...scroll.bind, height: 3, width: 20, isActive: true }, ...scrollLines);
        return scroll;
      });

    const first = renderController();
    emitInput('', keys.down().key);
    emitInput('', keys.down().key);

    const second = renderController();

    expect(second.bind.state).toBe(first.bind.state);
    expect(second.scrollTop()).toBe(2);
  });

  it('keeps VerticalTabs selection across parent rerenders and updates callbacks', () => {
    const firstOnChange = vi.fn();
    const secondOnChange = vi.fn();

    const renderApp = (onChange: (key: string) => void) =>
      renderWithHooks(() =>
        VerticalTabs({
          tabs: [
            { key: 'general', label: 'General', content: Text({}, 'General panel') },
            { key: 'advanced', label: 'Advanced', content: Text({}, 'Advanced panel') },
          ],
          onChange,
          isActive: true,
        })
      );

    renderApp(firstOnChange);
    emitInput('', keys.down().key);
    emitInput('', keys.enter().key);

    const rerendered = renderApp(secondOnChange);
    emitInput('', keys.enter().key);

    const output = renderToString(rerendered, 80);
    expect(output).toContain('Advanced panel');
    expect(firstOnChange).toHaveBeenCalledWith('advanced');
    expect(secondOnChange).toHaveBeenCalledWith('advanced');
  });

  it('keeps interactive Legend state across parent rerenders and updates callbacks', () => {
    const firstOnItemClick = vi.fn();
    const secondOnItemClick = vi.fn();

    const renderApp = (onItemClick: (index: number, label: string) => void) =>
      renderWithHooks(() =>
        Legend({
          items: [
            { label: 'CPU', color: 'cyan' },
            { label: 'Memory', color: 'green' },
          ],
          interactive: true,
          onItemClick,
        })
      ) as VNode & { children: Array<VNode & { props: Record<string, unknown> }> };

    const first = renderApp(firstOnItemClick);
    first.children[0]!.props.onClick?.();

    const rerendered = renderApp(secondOnItemClick);
    rerendered.children[1]!.props.onClick?.();

    expect(rerendered.children[0]!.props.backgroundColor).toBe('mutedForeground');
    expect(firstOnItemClick).toHaveBeenCalledWith(0, 'CPU');
    expect(secondOnItemClick).toHaveBeenCalledWith(1, 'Memory');
  });

  it('keeps interactive Heatmap cursor across parent rerenders and updates callbacks', () => {
    const firstOnSelect = vi.fn();
    const secondOnSelect = vi.fn();

    const renderApp = (onSelect: (row: number, col: number, value: number) => void) =>
      renderWithHooks(() =>
        Heatmap({
          data: [
            [1, 2],
            [3, 4],
          ],
          interactive: true,
          isActive: true,
          onSelect,
        })
      );

    renderApp(firstOnSelect);
    emitInput('', keys.right().key);
    emitInput('', keys.enter().key);

    renderApp(secondOnSelect);
    emitInput('', keys.enter().key);

    expect(firstOnSelect).toHaveBeenCalledWith(0, 1, 2);
    expect(secondOnSelect).toHaveBeenCalledWith(0, 1, 2);
  });
});
