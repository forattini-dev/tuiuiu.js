import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ButtonGroup } from '../../src/atoms/button.js';
import { renderToString } from '../../src/core/renderer.js';
import {
  beginRender,
  clearInputHandlers,
  emitInput,
  endRender,
  resetHookState,
} from '../../src/hooks/context.js';
import {
  Accordion,
  Calendar,
  Collapsible,
  ConfirmButton,
  DatePicker,
  useCalendarState,
  useDatePickerState,
} from '../../src/molecules/index.js';
import { Text } from '../../src/primitives/nodes.js';
import type { VNode } from '../../src/utils/types.js';
import { charKey, keys } from '../helpers/keyboard.js';

function renderWithHooks<T>(factory: () => T): T {
  beginRender();
  const result = factory();
  endRender();
  return result;
}

const fixedDate = new Date(2024, 5, 15);

describe('Wave 2 interactive component state', () => {
  beforeEach(() => {
    resetHookState();
    clearInputHandlers();
  });

  afterEach(() => {
    resetHookState();
    clearInputHandlers();
  });

  it('keeps Calendar view state across parent re-renders and updates callbacks', () => {
    const firstOnMonthChange = vi.fn();
    const secondOnMonthChange = vi.fn();

    const renderApp = (onMonthChange: (year: number, month: number) => void) =>
      renderWithHooks(() =>
        Calendar({
          initialDate: fixedDate,
          onMonthChange,
          isActive: true,
        })
      );

    renderApp(firstOnMonthChange);
    emitInput('L', charKey('L').key);

    renderApp(secondOnMonthChange);
    emitInput('L', charKey('L').key);

    expect(firstOnMonthChange).toHaveBeenCalledWith(2024, 6);
    expect(secondOnMonthChange).toHaveBeenCalledWith(2024, 7);
  });

  it('returns the same Calendar controller across re-renders', () => {
    const renderController = () =>
      renderWithHooks(() => useCalendarState({ initialDate: fixedDate }));

    const first = renderController();
    first.moveMonth(1);

    const second = renderController();

    expect(second).toBe(first);
    expect(second.viewDate().getMonth()).toBe(6);
  });

  it('keeps DatePicker selection across parent re-renders', () => {
    const renderApp = () =>
      renderWithHooks(() =>
        DatePicker({
          initialDate: fixedDate,
          placeholder: 'Pick a date',
          isActive: true,
        })
      );

    renderApp();
    emitInput('', keys.enter().key);
    emitInput('', keys.enter().key);

    const rerendered = renderApp();
    const output = renderToString(rerendered, 80);

    expect(output).toContain('2024-06-15');
  });

  it('returns the same DatePicker controller across re-renders', () => {
    const renderController = () =>
      renderWithHooks(() => useDatePickerState({ initialDate: fixedDate }));

    const first = renderController();
    first.open();
    first.selectCursor();

    const second = renderController();

    expect(second).toBe(first);
    expect(second.formattedValue()).toBe('2024-06-15');
    expect(second.isOpen()).toBe(true);
  });

  it('keeps Collapsible expansion across parent re-renders', () => {
    const renderApp = () =>
      renderWithHooks(() =>
        Collapsible({
          title: 'Advanced',
          isActive: true,
          children: Text({}, 'Hidden content'),
        })
      );

    renderApp();
    emitInput(' ', charKey(' ').key);

    const rerendered = renderApp();
    const output = renderToString(rerendered, 80);

    expect(output).toContain('Hidden content');
  });

  it('keeps Accordion expansion across parent re-renders', () => {
    const renderApp = () =>
      renderWithHooks(() =>
        Accordion({
          sections: [
            { key: 'general', title: 'General', content: Text({}, 'General content') },
            { key: 'advanced', title: 'Advanced', content: Text({}, 'Advanced content') },
          ],
          isActive: true,
        })
      );

    renderApp();
    emitInput(' ', charKey(' ').key);

    const rerendered = renderApp();
    const output = renderToString(rerendered, 80);

    expect(output).toContain('General content');
  });

  it('keeps ButtonGroup focus across parent re-renders', () => {
    const primaryClick = vi.fn();
    const secondaryClick = vi.fn();

    const renderApp = () =>
      renderWithHooks(() =>
        ButtonGroup({
          buttons: [
            { label: 'Primary', onClick: primaryClick },
            { label: 'Secondary', onClick: secondaryClick },
          ],
          isActive: true,
        })
      );

    renderApp();
    emitInput('', keys.right().key);

    renderApp();
    emitInput('', keys.enter().key);

    expect(primaryClick).not.toHaveBeenCalled();
    expect(secondaryClick).toHaveBeenCalledTimes(1);
  });

  it('keeps ConfirmButton confirmation state across parent re-renders', () => {
    const onConfirm = vi.fn();

    const renderApp = () =>
      renderWithHooks(() =>
        ConfirmButton({
          label: 'Delete',
          confirmLabel: 'Confirm delete',
          onConfirm,
        })
      ) as VNode;

    const first = renderApp();
    first.props.onClick();

    const rerendered = renderApp();
    expect(renderToString(rerendered, 80)).toContain('Confirm delete');

    rerendered.props.onClick();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
