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

  it('keeps semantic segments across parent re-renders', () => {
    const renderController = (placeholder: string) =>
      renderWithHooks(() => useTextInputState({ placeholder }));

    const first = renderController('Search...');
    first.insertSegment({ kind: 'mention', displayText: '@ada' });

    const second = renderController('Filter...');

    expect(second).toBe(first);
    expect(second.value()).toBe('@ada');
    expect(second.segments()).toMatchObject([
      { kind: 'mention', start: 0, end: 4, displayText: '@ada' },
    ]);
  });

  it('keeps controller-local completion ranking across parent re-renders', async () => {
    const renderController = (placeholder: string) =>
      renderWithHooks(() =>
        useTextInputState({
          placeholder,
          initialValue: '@a',
          completion: {
            resolveAnchor: ({ value, cursorPosition }) => {
              const prefix = value.slice(0, cursorPosition);
              const match = prefix.match(/@([a-z]*)$/);
              if (!match || match.index === undefined) {
                return null;
              }

              return {
                start: match.index,
                end: cursorPosition,
                query: match[1] ?? '',
                trigger: '@',
              };
            },
            getItems: async () => [
              { id: 'ada', label: 'Ada', replacement: { kind: 'mention', displayText: '@ada' } },
              { id: 'alan', label: 'Alan', replacement: { kind: 'mention', displayText: '@alan' } },
            ],
            ranking: {
              getKey: (item, context) => `${context.anchor.trigger}:${item.id}`,
            },
          },
        })
      );

    const first = renderController('Search...');
    await Promise.resolve();
    expect(first.completion()?.items.map((item) => item.id)).toEqual(['ada', 'alan']);

    first.selectNextCompletion();
    first.acceptCompletion();
    expect(first.getCompletionRankingSnapshot()).toMatchObject([
      { key: '@:alan', count: 1 },
    ]);

    const second = renderController('Filter...');
    second.setValue('@a');
    await Promise.resolve();

    expect(second).toBe(first);
    expect(second.completion()?.items.map((item) => item.id)).toEqual(['alan', 'ada']);
    expect(second.getCompletionRankingSnapshot()).toMatchObject([
      { key: '@:alan', count: 1 },
    ]);
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
