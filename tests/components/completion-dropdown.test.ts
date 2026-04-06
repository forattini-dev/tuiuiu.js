/**
 * CompletionDropdown Tests
 *
 * Tests for the CompletionDropdown component rendering:
 * - Null state (hidden)
 * - Loading, error, and empty states
 * - Item rendering with selection highlight
 * - Scroll indicators
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from '../../src/core/renderer.js';
import { setRenderMode } from '../../src/core/capabilities.js';
import { CompletionDropdown } from '../../src/atoms/completion-dropdown.js';
import type { TextInputCompletionState, TextInputCompletionItem } from '../../src/atoms/text-input.js';

// Helper to create a completion state signal
function makeState<T = unknown>(
  state: TextInputCompletionState<T> | null,
): () => TextInputCompletionState<T> | null {
  return () => state;
}

// Helper to create a ready completion state with items
function readyState<T = unknown>(
  items: TextInputCompletionItem<T>[],
  selectedIndex = 0,
): TextInputCompletionState<T> {
  return {
    anchor: { start: 0, end: 1, query: '', trigger: '@' },
    query: '',
    status: 'ready',
    items,
    selectedIndex,
  };
}

describe('CompletionDropdown', () => {
  beforeEach(() => {
    setRenderMode('unicode');
  });

  it('returns null when state is null', () => {
    const result = CompletionDropdown({
      state: makeState(null),
    });
    expect(result).toBeNull();
  });

  it('renders loading spinner when status=loading', () => {
    const state: TextInputCompletionState = {
      anchor: { start: 0, end: 1, query: '', trigger: '@' },
      query: '',
      status: 'loading',
      items: [],
      selectedIndex: 0,
    };

    const node = CompletionDropdown({ state: makeState(state) });
    expect(node).not.toBeNull();
    const output = renderToString(node!, 40);
    expect(output).toContain('Searching...');
  });

  it('renders custom loading message', () => {
    const state: TextInputCompletionState = {
      anchor: { start: 0, end: 1, query: '', trigger: '@' },
      query: '',
      status: 'loading',
      items: [],
      selectedIndex: 0,
    };

    const node = CompletionDropdown({
      state: makeState(state),
      loadingMessage: 'Fetching users...',
    });
    expect(node).not.toBeNull();
    const output = renderToString(node!, 40);
    expect(output).toContain('Fetching users...');
  });

  it('renders error message when status=error', () => {
    const state: TextInputCompletionState = {
      anchor: { start: 0, end: 1, query: '', trigger: '@' },
      query: '',
      status: 'error',
      items: [],
      selectedIndex: 0,
      error: 'Network failure',
    };

    const node = CompletionDropdown({ state: makeState(state) });
    expect(node).not.toBeNull();
    const output = renderToString(node!, 40);
    expect(output).toContain('Network failure');
  });

  it('renders default error message when no error string provided', () => {
    const state: TextInputCompletionState = {
      anchor: { start: 0, end: 1, query: '', trigger: '@' },
      query: '',
      status: 'error',
      items: [],
      selectedIndex: 0,
    };

    const node = CompletionDropdown({ state: makeState(state) });
    expect(node).not.toBeNull();
    const output = renderToString(node!, 40);
    expect(output).toContain('Error loading suggestions');
  });

  it('renders empty message when items=[]', () => {
    const state = readyState([]);
    const node = CompletionDropdown({ state: makeState(state) });
    expect(node).not.toBeNull();
    const output = renderToString(node!, 40);
    expect(output).toContain('No results');
  });

  it('renders custom empty message', () => {
    const state = readyState([]);
    const node = CompletionDropdown({
      state: makeState(state),
      emptyMessage: 'No users found',
    });
    expect(node).not.toBeNull();
    const output = renderToString(node!, 40);
    expect(output).toContain('No users found');
  });

  it('renders items with labels', () => {
    const items: TextInputCompletionItem[] = [
      { id: '1', label: '@alice' },
      { id: '2', label: '@bob' },
      { id: '3', label: '@charlie' },
    ];
    const state = readyState(items, 0);
    const node = CompletionDropdown({ state: makeState(state) });
    expect(node).not.toBeNull();
    const output = renderToString(node!, 40);
    expect(output).toContain('@alice');
    expect(output).toContain('@bob');
    expect(output).toContain('@charlie');
  });

  it('renders items with detail text', () => {
    const items: TextInputCompletionItem[] = [
      { id: '1', label: '@alice', detail: 'Engineer' },
      { id: '2', label: '@bob', detail: 'Designer' },
    ];
    const state = readyState(items, 0);
    const node = CompletionDropdown({ state: makeState(state) });
    expect(node).not.toBeNull();
    const output = renderToString(node!, 60);
    expect(output).toContain('Engineer');
    expect(output).toContain('Designer');
  });

  it('renders selection highlight on selected item', () => {
    const items: TextInputCompletionItem[] = [
      { id: '1', label: '@alice' },
      { id: '2', label: '@bob' },
    ];
    const state = readyState(items, 1); // Bob is selected
    const node = CompletionDropdown({ state: makeState(state) });
    expect(node).not.toBeNull();

    // The component renders a Box with rows. Selected row gets ❯ pointer.
    const output = renderToString(node!, 40);
    expect(output).toContain('\u276F'); // ❯ pointer for selected item
    expect(output).toContain('@bob');
  });

  it('renders selection pointer in ascii mode', () => {
    setRenderMode('ascii');
    const items: TextInputCompletionItem[] = [
      { id: '1', label: '@alice' },
      { id: '2', label: '@bob' },
    ];
    const state = readyState(items, 0);
    const node = CompletionDropdown({ state: makeState(state) });
    expect(node).not.toBeNull();
    const output = renderToString(node!, 40);
    expect(output).toContain('>');
  });

  it('scroll indicators show when items exceed maxVisible', () => {
    const items: TextInputCompletionItem[] = [];
    for (let i = 0; i < 15; i++) {
      items.push({ id: String(i), label: `item-${i}` });
    }

    // Select an item in the middle to trigger both scroll indicators
    const state = readyState(items, 10);
    const node = CompletionDropdown({
      state: makeState(state),
      maxVisible: 5,
    });
    expect(node).not.toBeNull();
    const output = renderToString(node!, 40);
    // Should have scroll-down indicator (▼) since there are items below
    expect(output).toContain('\u25BC'); // ▼
    // Should have scroll-up indicator (▲) since there are items above
    expect(output).toContain('\u25B2'); // ▲
  });

  it('scroll indicators show "N more" text', () => {
    const items: TextInputCompletionItem[] = [];
    for (let i = 0; i < 10; i++) {
      items.push({ id: String(i), label: `item-${i}` });
    }

    const state = readyState(items, 5);
    const node = CompletionDropdown({
      state: makeState(state),
      maxVisible: 4,
    });
    expect(node).not.toBeNull();
    const output = renderToString(node!, 40);
    expect(output).toContain('more');
  });

  it('no scroll-up indicator when at top', () => {
    const items: TextInputCompletionItem[] = [];
    for (let i = 0; i < 10; i++) {
      items.push({ id: String(i), label: `item-${i}` });
    }

    const state = readyState(items, 0); // at top
    const node = CompletionDropdown({
      state: makeState(state),
      maxVisible: 5,
    });
    expect(node).not.toBeNull();
    const output = renderToString(node!, 40);
    // Should NOT have scroll-up indicator
    expect(output).not.toContain('\u25B2');
    // Should have scroll-down indicator
    expect(output).toContain('\u25BC');
  });

  it('no scroll indicators when all items fit', () => {
    const items: TextInputCompletionItem[] = [
      { id: '1', label: '@alice' },
      { id: '2', label: '@bob' },
    ];
    const state = readyState(items, 0);
    const node = CompletionDropdown({
      state: makeState(state),
      maxVisible: 8,
    });
    expect(node).not.toBeNull();
    const output = renderToString(node!, 40);
    expect(output).not.toContain('\u25B2');
    expect(output).not.toContain('\u25BC');
  });

  it('renders with custom border style', () => {
    const items: TextInputCompletionItem[] = [
      { id: '1', label: '@alice' },
    ];
    const state = readyState(items, 0);
    const node = CompletionDropdown({
      state: makeState(state),
      borderStyle: 'single',
    });
    expect(node).not.toBeNull();
    expect(node!.props.borderStyle).toBe('single');
  });

  it('renders with custom width', () => {
    const items: TextInputCompletionItem[] = [
      { id: '1', label: '@alice' },
    ];
    const state = readyState(items, 0);
    const node = CompletionDropdown({
      state: makeState(state),
      width: 50,
    });
    expect(node).not.toBeNull();
    expect(node!.props.width).toBe(50);
  });

  it('ascii scroll indicators in ascii mode', () => {
    setRenderMode('ascii');
    const items: TextInputCompletionItem[] = [];
    for (let i = 0; i < 15; i++) {
      items.push({ id: String(i), label: `item-${i}` });
    }

    const state = readyState(items, 10);
    const node = CompletionDropdown({
      state: makeState(state),
      maxVisible: 5,
    });
    expect(node).not.toBeNull();
    const output = renderToString(node!, 40);
    expect(output).toContain('^'); // ascii up
    expect(output).toContain('v'); // ascii down
  });
});
