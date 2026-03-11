import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TextInput, useTextInputState } from '../../src/atoms/text-input.js';
import { renderToString } from '../../src/core/renderer.js';
import { charKey, keys } from '../helpers/keyboard.js';
import { beginRender, clearInputHandlers, emitInput, endRender, resetHookState } from '../../src/hooks/context.js';
import { Select, useSelectState, type SelectItem } from '../../src/molecules/select.js';

function renderWithHooks<T>(factory: () => T): T {
  beginRender();
  const result = factory();
  endRender();
  return result;
}

const items: SelectItem<string>[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

describe('Interactive component state hooks', () => {
  beforeEach(() => {
    resetHookState();
    clearInputHandlers();
  });

  afterEach(() => {
    resetHookState();
    clearInputHandlers();
  });

  it('keeps TextInput value across parent re-renders without external state', () => {
    const renderApp = (placeholder: string) =>
      renderWithHooks(() => TextInput({ placeholder, isActive: true }));

    renderApp('First');
    emitInput('x', charKey('x').key);

    const rerendered = renderApp('Second');
    const output = renderToString(rerendered, 40);

    expect(output).toContain('x');
  });

  it('returns the same TextInput controller across re-renders', () => {
    const renderController = (placeholder: string) =>
      renderWithHooks(() => useTextInputState({ placeholder }));

    const first = renderController('Search...');
    first.setValue('persistent');

    const second = renderController('Filter...');

    expect(second).toBe(first);
    expect(second.value()).toBe('persistent');
  });

  it('keeps Select selection across parent re-renders without external state', () => {
    const renderApp = () =>
      renderWithHooks(() =>
        Select({
          items,
          multiple: true,
          showCount: true,
          isActive: true,
        })
      );

    renderApp();
    emitInput(' ', keys.space().key);

    const rerendered = renderApp();
    const output = renderToString(rerendered, 60);

    expect(output).toContain('1 selected of 2');
  });

  it('returns the same Select controller across re-renders', () => {
    const renderController = () =>
      renderWithHooks(() => useSelectState({ items, multiple: true }));

    const first = renderController();
    first.toggleSelection();

    const second = renderController();

    expect(second).toBe(first);
    expect(second.selected()).toEqual(['a']);
  });
});
