import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RangeSlider, Slider } from '../../src/atoms/slider.js';
import { Switch } from '../../src/atoms/switch.js';
import { renderToString } from '../../src/core/renderer.js';
import {
  beginRender, endRender, resetHookState } from '../../src/hooks/context.js';
import { resetTestInteractions, dispatchTestKey } from '../../src/testing/interaction.js';
import {
  Autocomplete,
  createAutocomplete,
  createMultiSelect,
  createTagInput,
  MultiSelect,
  RadioGroup,
  Tabs,
  TagInput,
  Tree,
  useAutocompleteState,
  useMultiSelectState,
  useTabsState,
  useTreeState,
  type AutocompleteItem,
  type MultiSelectItem,
  type Tab,
  type TreeNode,
} from '../../src/molecules/index.js';
import { charKey, keys } from '../helpers/keyboard.js';

function renderWithHooks<T>(factory: () => T): T {
  beginRender();
  const result = factory();
  endRender();
  return result;
}

const selectionItems: MultiSelectItem<string>[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

const autocompleteItems: AutocompleteItem<string>[] = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
];

const tabs: Tab<string>[] = [
  { key: 'home', label: 'Home', content: 'Home content' as any },
  { key: 'settings', label: 'Settings', content: 'Settings content' as any },
];

const treeNodes: TreeNode[] = [
  {
    id: 'root',
    label: 'Root',
    children: [
      { id: 'child-1', label: 'Child 1' },
      { id: 'child-2', label: 'Child 2' },
    ],
  },
];

describe('Wave 1 interactive component state', () => {
  beforeEach(() => {
    resetHookState();
    resetTestInteractions();
  });

  afterEach(() => {
    resetHookState();
    resetTestInteractions();
  });

  it('keeps Switch state across parent re-renders', () => {
    const renderApp = () =>
      renderWithHooks(() =>
        Switch({
          showLabels: true,
          onLabel: 'ON',
          offLabel: 'OFF',
          isActive: true,
        })
      );

    renderApp();
    dispatchTestKey(' ', charKey(' ').key);

    const rerendered = renderApp();
    const output = renderToString(rerendered, 40);

    expect(output).toContain('ON');
    expect(output).not.toContain('OFF');
  });

  it('keeps Slider state across parent re-renders', () => {
    const renderApp = () =>
      renderWithHooks(() =>
        Slider({
          min: 0,
          max: 10,
          initialValue: 4,
          formatValue: (value) => `[${value}]`,
          isActive: true,
        })
      );

    renderApp();
    dispatchTestKey('', keys.right().key);

    const rerendered = renderApp();
    const output = renderToString(rerendered, 60);

    expect(output).toContain('[5]');
  });

  it('keeps RangeSlider state across parent re-renders', () => {
    const renderApp = () =>
      renderWithHooks(() =>
        RangeSlider({
          min: 0,
          max: 10,
          initialValue: [0, 10],
          formatValue: (value) => `[${value}]`,
          isActive: true,
        })
      );

    renderApp();
    dispatchTestKey('', keys.right().key);

    const rerendered = renderApp();
    const output = renderToString(rerendered, 60);

    expect(output).toContain('[1]');
  });

  it('preserves RadioGroup focus across parent re-renders and updates callbacks', () => {
    const firstOnChange = vi.fn();
    const secondOnChange = vi.fn();

    const renderApp = (onChange: (value: string) => void) =>
      renderWithHooks(() =>
        RadioGroup({
          options: [
            { value: 'a', label: 'Alpha' },
            { value: 'b', label: 'Beta' },
          ],
          onChange,
          isActive: true,
        })
      );

    renderApp(firstOnChange);
    dispatchTestKey('', keys.down().key);
    dispatchTestKey(' ', charKey(' ').key);

    const rerendered = renderApp(secondOnChange);
    dispatchTestKey('', keys.enter().key);

    expect(renderToString(rerendered, 60)).toContain('Beta');
    expect(firstOnChange).toHaveBeenCalledWith('b');
    expect(secondOnChange).toHaveBeenCalledWith('b');
  });

  it('keeps Tabs selection across parent re-renders', () => {
    const renderApp = () =>
      renderWithHooks(() =>
        Tabs({
          tabs,
          isActive: true,
        })
      );

    renderApp();
    dispatchTestKey('', keys.right().key);
    dispatchTestKey('', keys.enter().key);

    const rerendered = renderApp();
    const output = renderToString(rerendered, 80);

    expect(output).toContain('Settings content');
  });

  it('returns the same Tabs controller across re-renders', () => {
    const renderController = () =>
      renderWithHooks(() => useTabsState({ tabs }));

    const first = renderController();
    first.setActiveTab('settings');

    const second = renderController();

    expect(second).toBe(first);
    expect(second.activeTab()).toBe('settings');
  });

  it('keeps MultiSelect selection across parent re-renders', () => {
    const renderApp = () =>
      renderWithHooks(() =>
        MultiSelect({
          items: selectionItems,
          showCount: true,
          isActive: true,
        })
      );

    renderApp();
    dispatchTestKey(' ', keys.space().key);

    const rerendered = renderApp();
    const output = renderToString(rerendered, 80);

    expect(output).toContain('1 selected · 2 items');
  });

  it('returns the same MultiSelect controller across re-renders', () => {
    const renderController = () =>
      renderWithHooks(() => useMultiSelectState({ items: selectionItems }));

    const first = renderController();
    first.toggleCurrent();

    const second = renderController();

    expect(second).toBe(first);
    expect(second.selected()).toEqual(['a']);
  });

  it('gives MultiSelect an explicit grapheme-safe search mode', () => {
    const state = createMultiSelect({ items: selectionItems, searchable: true });
    const family = '👨‍👩‍👧‍👦';

    renderWithHooks(() =>
      MultiSelect({ items: selectionItems, searchable: true, state })
    );
    dispatchTestKey('/', charKey('/').key);
    dispatchTestKey(`j${family}`, charKey(family).key);

    expect(state.isSearching()).toBe(true);
    expect(state.searchQuery()).toBe(`j${family}`);
    expect(state.cursorIndex()).toBe(0);

    dispatchTestKey('', keys.backspace().key);
    expect(state.searchQuery()).toBe('j');

    dispatchTestKey('', keys.enter().key);
    expect(state.isSearching()).toBe(false);
    expect(state.searchQuery()).toBe('j');
  });

  it('keeps Autocomplete input across parent re-renders', () => {
    const renderApp = () =>
      renderWithHooks(() =>
        Autocomplete({
          items: autocompleteItems,
          placeholder: 'Search...',
          isActive: true,
        })
      );

    renderApp();
    dispatchTestKey('b', charKey('b').key);

    const rerendered = renderApp();
    const output = renderToString(rerendered, 80);

    expect(output).toContain('Beta');
  });

  it('returns the same Autocomplete controller across re-renders', () => {
    const renderController = () =>
      renderWithHooks(() => useAutocompleteState({ items: autocompleteItems }));

    const first = renderController();
    first.setInput('be');

    const second = renderController();

    expect(second).toBe(first);
    expect(second.inputValue()).toBe('be');
  });

  it('accepts multi-code-point input in Autocomplete and TagInput', () => {
    const family = '👨‍👩‍👧‍👦';
    const autocompleteState = createAutocomplete({ items: autocompleteItems });

    renderWithHooks(() =>
      Autocomplete({
        items: autocompleteItems,
        state: autocompleteState,
        isActive: true,
      })
    );
    dispatchTestKey(family, charKey(family).key);
    expect(autocompleteState.inputValue()).toBe(family);

    resetHookState();
    resetTestInteractions();

    const tagState = createTagInput({ items: autocompleteItems });
    renderWithHooks(() =>
      TagInput({
        items: autocompleteItems,
        state: tagState,
        isActive: true,
      })
    );
    dispatchTestKey(family, charKey(family).key);
    expect(tagState.inputValue()).toBe(family);
    dispatchTestKey('', keys.backspace().key);
    expect(tagState.inputValue()).toBe('');
  });

  it('keeps TagInput selections across parent re-renders', () => {
    const renderApp = () =>
      renderWithHooks(() =>
        TagInput({
          items: autocompleteItems,
          placeholder: 'Add tag...',
          isActive: true,
        })
      );

    renderApp();
    dispatchTestKey('a', charKey('a').key);
    dispatchTestKey('', keys.enter().key);

    const rerendered = renderApp();
    const output = renderToString(rerendered, 80);

    expect(output).toContain('Alpha');
  });

  it('keeps Tree expansion across parent re-renders', () => {
    const renderApp = () =>
      renderWithHooks(() =>
        Tree({
          nodes: treeNodes,
          isActive: true,
        })
      );

    renderApp();
    dispatchTestKey('', keys.right().key);

    const rerendered = renderApp();
    const output = renderToString(rerendered, 80);

    expect(output).toContain('Child 1');
  });

  it('returns the same Tree controller across re-renders', () => {
    const renderController = () =>
      renderWithHooks(() => useTreeState({ nodes: treeNodes }));

    const first = renderController();
    first.expand('root');

    const second = renderController();

    expect(second).toBe(first);
    expect(second.expanded().has('root')).toBe(true);
  });
});
