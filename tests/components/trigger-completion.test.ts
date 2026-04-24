/**
 * TriggerCompletion Tests
 *
 * Tests for createTriggerCompletion and createMultiTriggerCompletion factories:
 * - Anchor resolution (trigger detection, cursor position, queries)
 * - Item generation with trigger prefix
 * - Segment vs plain text replacement
 * - Multi-trigger delegation
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createComposableCompletion,
  createPathCompletion,
  createPathCompletionSource,
  createTriggerCompletion,
  createTriggerCompletionSource,
  createMultiTriggerCompletion,
} from '../../src/atoms/trigger-completion.js';
import { createTextInput } from '../../src/atoms/text-input.js';
import type {
  TextInputSegment,
  TextInputCompletionAnchor,
} from '../../src/atoms/text-input.js';

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'tuiuiu-completion-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

// Helper to call resolveAnchor with sensible defaults
function resolveAnchor(
  completion: ReturnType<typeof createTriggerCompletion>,
  value: string,
  cursorPosition: number,
  segments: TextInputSegment[] = [],
): TextInputCompletionAnchor | null {
  return completion.resolveAnchor({ value, cursorPosition, segments });
}

// =============================================================================
// createTriggerCompletion — anchor resolution
// =============================================================================

describe('createTriggerCompletion - resolveAnchor', () => {
  const mention = createTriggerCompletion({
    trigger: '@',
    getItems: async () => [],
  });

  it('detects @ at start of input', () => {
    const anchor = resolveAnchor(mention, '@dan', 4);
    expect(anchor).not.toBeNull();
    expect(anchor!.trigger).toBe('@');
    expect(anchor!.start).toBe(0);
    expect(anchor!.end).toBe(4);
    expect(anchor!.query).toBe('dan');
  });

  it('detects @ after space', () => {
    const anchor = resolveAnchor(mention, 'hello @world', 12);
    expect(anchor).not.toBeNull();
    expect(anchor!.trigger).toBe('@');
    expect(anchor!.start).toBe(6);
    expect(anchor!.end).toBe(12);
    expect(anchor!.query).toBe('world');
  });

  it('returns null when @ is mid-word (not preceded by space)', () => {
    const anchor = resolveAnchor(mention, 'email@test', 10);
    expect(anchor).toBeNull();
  });

  it('returns null when cursor is at position 0', () => {
    const anchor = resolveAnchor(mention, '@hello', 0);
    expect(anchor).toBeNull();
  });

  it('returns null when cursor is before the trigger', () => {
    // Cursor at position 2, trigger at position 6
    const anchor = resolveAnchor(mention, 'hi @world', 2);
    expect(anchor).toBeNull();
  });

  it('extracts empty query when cursor is right after @', () => {
    const anchor = resolveAnchor(mention, '@', 1);
    expect(anchor).not.toBeNull();
    expect(anchor!.query).toBe('');
    expect(anchor!.start).toBe(0);
    expect(anchor!.end).toBe(1);
  });

  it('extracts query correctly with multiple words before trigger', () => {
    const anchor = resolveAnchor(mention, 'cc @john', 8);
    expect(anchor).not.toBeNull();
    expect(anchor!.query).toBe('john');
  });

  it('returns null when trigger is inside an existing segment', () => {
    const segments: TextInputSegment[] = [
      { id: 'seg1', kind: 'mention', start: 0, end: 5, displayText: '@dan' },
    ];
    // Trigger at position 0 is inside segment [0, 5)
    const anchor = resolveAnchor(mention, '@dan @new', 5, segments);
    expect(anchor).toBeNull();
  });

  it('returns null when no trigger character is found', () => {
    const anchor = resolveAnchor(mention, 'hello world', 11);
    expect(anchor).toBeNull();
  });

  it('handles multi-character trigger', () => {
    const slash = createTriggerCompletion({
      trigger: '//',
      getItems: async () => [],
    });
    const anchor = resolveAnchor(slash, '//search', 8);
    expect(anchor).not.toBeNull();
    expect(anchor!.trigger).toBe('//');
    expect(anchor!.query).toBe('search');
  });
});

// =============================================================================
// createTriggerCompletion — getItems
// =============================================================================

describe('createTriggerCompletion - getItems', () => {
  it('returns formatted items with trigger prefix in label', async () => {
    const mention = createTriggerCompletion({
      trigger: '@',
      getItems: () => [
        { id: '1', label: 'alice', detail: 'Alice A.' },
        { id: '2', label: 'bob', detail: 'Bob B.' },
      ],
    });

    const anchor: TextInputCompletionAnchor = {
      start: 0,
      end: 4,
      query: 'ali',
      trigger: '@',
    };

    const items = await mention.getItems({
      value: '@ali',
      cursorPosition: 4,
      segments: [],
      anchor,
    });

    expect(items.length).toBe(2);
    expect(items[0]!.label).toBe('@alice');
    expect(items[0]!.detail).toBe('Alice A.');
    expect(items[1]!.label).toBe('@bob');
  });

  it('respects minChars — returns empty when query is too short', async () => {
    const mention = createTriggerCompletion({
      trigger: '@',
      getItems: () => [{ id: '1', label: 'test' }],
      minChars: 3,
    });

    const anchor: TextInputCompletionAnchor = {
      start: 0,
      end: 3,
      query: 'ab', // only 2 chars, minChars is 3
      trigger: '@',
    };

    const items = await mention.getItems({
      value: '@ab',
      cursorPosition: 3,
      segments: [],
      anchor,
    });

    expect(items.length).toBe(0);
  });

  it('returns items when query meets minChars', async () => {
    const mention = createTriggerCompletion({
      trigger: '@',
      getItems: () => [{ id: '1', label: 'test' }],
      minChars: 2,
    });

    const anchor: TextInputCompletionAnchor = {
      start: 0,
      end: 4,
      query: 'tes',
      trigger: '@',
    };

    const items = await mention.getItems({
      value: '@tes',
      cursorPosition: 4,
      segments: [],
      anchor,
    });

    expect(items.length).toBe(1);
  });

  it('segment replacement has correct kind and displayText', async () => {
    const mention = createTriggerCompletion({
      trigger: '@',
      getItems: () => [{ id: '1', label: 'alice' }],
      segmentKind: 'mention',
    });

    const anchor: TextInputCompletionAnchor = {
      start: 0,
      end: 2,
      query: 'a',
      trigger: '@',
    };

    const items = await mention.getItems({
      value: '@a',
      cursorPosition: 2,
      segments: [],
      anchor,
    });

    expect(items.length).toBe(1);
    const replacement = items[0]!.replacement;
    // insertAsSegment defaults to true, so replacement is an object
    expect(replacement).toBeDefined();
    expect(typeof replacement).toBe('object');
    expect((replacement as any).kind).toBe('mention');
    expect((replacement as any).displayText).toBe('@alice');
  });

  it('uses trigger as default segmentKind', async () => {
    const hashtag = createTriggerCompletion({
      trigger: '#',
      getItems: () => [{ id: '1', label: 'important' }],
      // segmentKind not specified — defaults to trigger '#'
    });

    const anchor: TextInputCompletionAnchor = {
      start: 0,
      end: 2,
      query: 'i',
      trigger: '#',
    };

    const items = await hashtag.getItems({
      value: '#i',
      cursorPosition: 2,
      segments: [],
      anchor,
    });

    expect((items[0]!.replacement as any).kind).toBe('#');
  });

  it('plain text replacement (insertAsSegment=false) has trailing space', async () => {
    const mention = createTriggerCompletion({
      trigger: '@',
      getItems: () => [{ id: '1', label: 'alice' }],
      insertAsSegment: false,
    });

    const anchor: TextInputCompletionAnchor = {
      start: 0,
      end: 2,
      query: 'a',
      trigger: '@',
    };

    const items = await mention.getItems({
      value: '@a',
      cursorPosition: 2,
      segments: [],
      anchor,
    });

    expect(items.length).toBe(1);
    const replacement = items[0]!.replacement;
    // Plain text replacement is a string with trailing space
    expect(typeof replacement).toBe('string');
    expect(replacement).toBe('@alice ');
  });

  it('passes payload through to items and replacement', async () => {
    const mention = createTriggerCompletion<{ email: string }>({
      trigger: '@',
      getItems: () => [
        { id: '1', label: 'alice', payload: { email: 'alice@test.com' } },
      ],
    });

    const anchor: TextInputCompletionAnchor = {
      start: 0,
      end: 2,
      query: 'a',
      trigger: '@',
    };

    const items = await mention.getItems({
      value: '@a',
      cursorPosition: 2,
      segments: [],
      anchor,
    });

    expect(items[0]!.payload).toEqual({ email: 'alice@test.com' });
    expect((items[0]!.replacement as any).payload).toEqual({ email: 'alice@test.com' });
  });

  it('handles async getItems', async () => {
    const mention = createTriggerCompletion({
      trigger: '@',
      getItems: async (query) => {
        // Simulate async
        return [{ id: '1', label: `result-${query}` }];
      },
    });

    const anchor: TextInputCompletionAnchor = {
      start: 0,
      end: 4,
      query: 'foo',
      trigger: '@',
    };

    const items = await mention.getItems({
      value: '@foo',
      cursorPosition: 4,
      segments: [],
      anchor,
    });

    expect(items[0]!.label).toBe('@result-foo');
  });
});

// =============================================================================
// createMultiTriggerCompletion
// =============================================================================

describe('createMultiTriggerCompletion', () => {
  const multi = createMultiTriggerCompletion([
    {
      trigger: '@',
      getItems: (query) => [{ id: `user-${query}`, label: `user-${query}` }],
      segmentKind: 'mention',
    },
    {
      trigger: '/',
      getItems: (query) => [{ id: `cmd-${query}`, label: `cmd-${query}` }],
      segmentKind: 'command',
    },
    {
      trigger: '#',
      getItems: (query) => [{ id: `tag-${query}`, label: `tag-${query}` }],
      segmentKind: 'tag',
    },
  ]);

  it('detects first matching trigger (@)', () => {
    const anchor = multi.resolveAnchor({
      value: '@alice',
      cursorPosition: 6,
      segments: [],
    });
    expect(anchor).not.toBeNull();
    expect(anchor!.trigger).toBe('@');
    expect(anchor!.query).toBe('alice');
  });

  it('detects / trigger', () => {
    const anchor = multi.resolveAnchor({
      value: '/help',
      cursorPosition: 5,
      segments: [],
    });
    expect(anchor).not.toBeNull();
    expect(anchor!.trigger).toBe('/');
    expect(anchor!.query).toBe('help');
  });

  it('detects # trigger', () => {
    const anchor = multi.resolveAnchor({
      value: '#tag',
      cursorPosition: 4,
      segments: [],
    });
    expect(anchor).not.toBeNull();
    expect(anchor!.trigger).toBe('#');
    expect(anchor!.query).toBe('tag');
  });

  it('returns null when no trigger matches', () => {
    const anchor = multi.resolveAnchor({
      value: 'hello world',
      cursorPosition: 11,
      segments: [],
    });
    expect(anchor).toBeNull();
  });

  it('getItems delegates to correct config for @ trigger', async () => {
    const anchor: TextInputCompletionAnchor = {
      start: 0,
      end: 5,
      query: 'test',
      trigger: '@',
    };

    const items = await multi.getItems({
      value: '@test',
      cursorPosition: 5,
      segments: [],
      anchor,
    });

    expect(items.length).toBe(1);
    expect(items[0]!.label).toBe('@user-test');
    expect((items[0]!.replacement as any).kind).toBe('mention');
  });

  it('getItems delegates to correct config for / trigger', async () => {
    const anchor: TextInputCompletionAnchor = {
      start: 0,
      end: 5,
      query: 'help',
      trigger: '/',
    };

    const items = await multi.getItems({
      value: '/help',
      cursorPosition: 5,
      segments: [],
      anchor,
    });

    expect(items.length).toBe(1);
    expect(items[0]!.label).toBe('/cmd-help');
    expect((items[0]!.replacement as any).kind).toBe('command');
  });

  it('getItems delegates to correct config for # trigger', async () => {
    const anchor: TextInputCompletionAnchor = {
      start: 0,
      end: 4,
      query: 'tag',
      trigger: '#',
    };

    const items = await multi.getItems({
      value: '#tag',
      cursorPosition: 4,
      segments: [],
      anchor,
    });

    expect(items.length).toBe(1);
    expect(items[0]!.label).toBe('#tag-tag');
    expect((items[0]!.replacement as any).kind).toBe('tag');
  });

  it('getItems returns empty for unknown trigger', async () => {
    const anchor: TextInputCompletionAnchor = {
      start: 0,
      end: 4,
      query: 'foo',
      trigger: '!', // not configured
    };

    const items = await multi.getItems({
      value: '!foo',
      cursorPosition: 4,
      segments: [],
      anchor,
    });

    expect(items.length).toBe(0);
  });

  it('getItems returns empty when anchor has no trigger', async () => {
    const anchor: TextInputCompletionAnchor = {
      start: 0,
      end: 4,
      query: 'foo',
      // no trigger property
    };

    const items = await multi.getItems({
      value: 'foo',
      cursorPosition: 3,
      segments: [],
      anchor,
    });

    expect(items.length).toBe(0);
  });

  it('multi-trigger respects minChars per config', async () => {
    const multiWithMinChars = createMultiTriggerCompletion([
      {
        trigger: '@',
        getItems: () => [{ id: '1', label: 'user' }],
        minChars: 3,
      },
      {
        trigger: '#',
        getItems: () => [{ id: '2', label: 'tag' }],
        minChars: 0,
      },
    ]);

    // @ with 2-char query should return empty (minChars=3)
    const anchor1: TextInputCompletionAnchor = {
      start: 0,
      end: 3,
      query: 'ab',
      trigger: '@',
    };
    const items1 = await multiWithMinChars.getItems({
      value: '@ab',
      cursorPosition: 3,
      segments: [],
      anchor: anchor1,
    });
    expect(items1.length).toBe(0);

    // # with 0-char query should return items (minChars=0)
    const anchor2: TextInputCompletionAnchor = {
      start: 0,
      end: 1,
      query: '',
      trigger: '#',
    };
    const items2 = await multiWithMinChars.getItems({
      value: '#',
      cursorPosition: 1,
      segments: [],
      anchor: anchor2,
    });
    expect(items2.length).toBe(1);
  });

  it('multi-trigger uses insertAsSegment=false for plain text', async () => {
    const multiPlain = createMultiTriggerCompletion([
      {
        trigger: '@',
        getItems: () => [{ id: '1', label: 'alice' }],
        insertAsSegment: false,
      },
    ]);

    const anchor: TextInputCompletionAnchor = {
      start: 0,
      end: 2,
      query: 'a',
      trigger: '@',
    };

    const items = await multiPlain.getItems({
      value: '@a',
      cursorPosition: 2,
      segments: [],
      anchor,
    });

    expect(typeof items[0]!.replacement).toBe('string');
    expect(items[0]!.replacement).toBe('@alice ');
  });
});

// =============================================================================
// createComposableCompletion
// =============================================================================

describe('createComposableCompletion', () => {
  it('routes @ and # triggers to different providers', async () => {
    const atItems = vi.fn((query: string) => [{ id: `file-${query}`, label: `file-${query}` }]);
    const hashItems = vi.fn((query: string) => [{ id: `issue-${query}`, label: `issue-${query}` }]);
    const completion = createComposableCompletion([
      createTriggerCompletionSource({
        trigger: '@',
        getItems: atItems,
        insertAsSegment: false,
      }),
      createTriggerCompletionSource({
        trigger: '#',
        getItems: hashItems,
        insertAsSegment: false,
      }),
    ]);

    const atAnchor = completion.resolveAnchor({
      value: 'ask @sr',
      cursorPosition: 'ask @sr'.length,
      segments: [],
    });

    expect(atAnchor).toMatchObject({ trigger: '@', query: 'sr' });
    await completion.getItems({
      value: 'ask @sr',
      cursorPosition: 'ask @sr'.length,
      segments: [],
      anchor: atAnchor!,
    });

    expect(atItems).toHaveBeenCalledWith('sr');
    expect(hashItems).not.toHaveBeenCalled();

    const hashAnchor = completion.resolveAnchor({
      value: 'fix #42',
      cursorPosition: 'fix #42'.length,
      segments: [],
    });

    expect(hashAnchor).toMatchObject({ trigger: '#', query: '42' });
    await completion.getItems({
      value: 'fix #42',
      cursorPosition: 'fix #42'.length,
      segments: [],
      anchor: hashAnchor!,
    });

    expect(hashItems).toHaveBeenCalledWith('42');
  });

  it('accepts a composed trigger completion as a semantic snippet', async () => {
    const completion = createComposableCompletion([
      createTriggerCompletionSource({
        trigger: '@',
        segmentKind: 'file',
        getItems: () => [
          {
            id: 'src/index.ts',
            label: 'src/index.ts',
            payload: { path: 'src/index.ts' },
          },
        ],
      }),
    ]);
    const input = createTextInput({
      initialValue: '@s',
      completion,
    });

    await vi.waitFor(() => {
      expect(input.completion()?.items).toHaveLength(1);
    });
    input.acceptCompletion();

    expect(input.value()).toBe('@src/index.ts');
    expect(input.segments()).toMatchObject([
      {
        kind: 'file',
        start: 0,
        end: 13,
        displayText: '@src/index.ts',
        payload: { path: 'src/index.ts' },
      },
    ]);
  });

  it('lets path tokens coexist with @ and # sources without invoking them', async () => {
    const cwd = createTempDir();
    mkdirSync(path.join(cwd, 'src'));
    const atItems = vi.fn(() => [{ id: 'user', label: 'user' }]);
    const hashItems = vi.fn(() => [{ id: 'tag', label: 'tag' }]);
    const completion = createComposableCompletion([
      createTriggerCompletionSource({ trigger: '@', getItems: atItems }),
      createTriggerCompletionSource({ trigger: '#', getItems: hashItems }),
      createPathCompletionSource({ cwd }),
    ]);
    const value = 'open ./s';
    const anchor = completion.resolveAnchor({
      value,
      cursorPosition: value.length,
      segments: [],
    });

    expect(anchor).toMatchObject({ trigger: 'path', query: './s' });

    const items = await completion.getItems({
      value,
      cursorPosition: value.length,
      segments: [],
      anchor: anchor!,
    });

    expect(items[0]).toMatchObject({
      label: 'src/',
      replacement: './src/',
    });
    expect(atItems).not.toHaveBeenCalled();
    expect(hashItems).not.toHaveBeenCalled();
  });
});

// =============================================================================
// createPathCompletionSource / createPathCompletion
// =============================================================================

describe('createPathCompletionSource', () => {
  it('lists home-relative entries and preserves ~/ replacements', async () => {
    const homeDir = createTempDir();
    mkdirSync(path.join(homeDir, 'Documents'));
    writeFileSync(path.join(homeDir, 'notes.txt'), 'hello');
    const source = createPathCompletionSource({ cwd: homeDir, homeDir });
    const value = 'attach ~/';
    const anchor = source.resolveAnchor({
      value,
      cursorPosition: value.length,
      segments: [],
    });

    expect(anchor).toMatchObject({ trigger: 'path', query: '~/' });

    const items = await source.getItems({
      value,
      cursorPosition: value.length,
      segments: [],
      anchor: anchor!,
    });
    const docs = items.find((item) => item.label === 'Documents/');
    const notes = items.find((item) => item.label === 'notes.txt');

    expect(docs?.replacement).toBe('~/Documents/');
    expect(docs?.detail).toBe('dir');
    expect(docs?.payload).toMatchObject({
      kind: 'directory',
      name: 'Documents',
      path: '~/Documents/',
      absolutePath: path.join(homeDir, 'Documents'),
    });
    expect(notes?.replacement).toBe('~/notes.txt');
  });

  it('preserves ./ replacements and marks directories with a trailing slash', async () => {
    const cwd = createTempDir();
    mkdirSync(path.join(cwd, 'src'));
    writeFileSync(path.join(cwd, 'script.ts'), 'export {};');
    const source = createPathCompletionSource({ cwd, homeDir: cwd });

    const dirAnchor = source.resolveAnchor({
      value: './s',
      cursorPosition: './s'.length,
      segments: [],
    });
    const dirItems = await source.getItems({
      value: './s',
      cursorPosition: './s'.length,
      segments: [],
      anchor: dirAnchor!,
    });

    expect(dirItems.map((item) => item.replacement)).toContain('./src/');
    expect(dirItems.map((item) => item.replacement)).toContain('./script.ts');
  });

  it('supports semantic path segments when requested', async () => {
    const cwd = createTempDir();
    writeFileSync(path.join(cwd, 'README.md'), '# test');
    const source = createPathCompletionSource({
      cwd,
      homeDir: cwd,
      insertAsSegment: true,
      fileSegmentKind: 'attachment',
    });
    const anchor = source.resolveAnchor({
      value: './R',
      cursorPosition: './R'.length,
      segments: [],
    });
    const items = await source.getItems({
      value: './R',
      cursorPosition: './R'.length,
      segments: [],
      anchor: anchor!,
    });

    expect(items[0]?.replacement).toMatchObject({
      kind: 'attachment',
      displayText: './README.md',
      payload: {
        kind: 'file',
        path: './README.md',
        name: 'README.md',
      },
    });
  });

  it('limits results after sorting directories before files', async () => {
    const cwd = createTempDir();
    mkdirSync(path.join(cwd, 'alpha'));
    mkdirSync(path.join(cwd, 'beta'));
    writeFileSync(path.join(cwd, 'gamma.txt'), '');
    writeFileSync(path.join(cwd, 'omega.txt'), '');
    const source = createPathCompletionSource({ cwd, homeDir: cwd, maxItems: 3 });
    const anchor = source.resolveAnchor({
      value: './',
      cursorPosition: './'.length,
      segments: [],
    });
    const items = await source.getItems({
      value: './',
      cursorPosition: './'.length,
      segments: [],
      anchor: anchor!,
    });

    expect(items.map((item) => item.label)).toEqual(['alpha/', 'beta/', 'gamma.txt']);
  });

  it('createPathCompletion returns a standalone TextInput completion provider', async () => {
    const cwd = createTempDir();
    mkdirSync(path.join(cwd, 'lib'));
    const completion = createPathCompletion({ cwd, homeDir: cwd });
    const anchor = completion.resolveAnchor({
      value: '~',
      cursorPosition: 1,
      segments: [],
    });

    expect(anchor).toMatchObject({ trigger: 'path', query: '~' });

    const items = await completion.getItems({
      value: '~',
      cursorPosition: 1,
      segments: [],
      anchor: anchor!,
    });

    expect(items[0]).toMatchObject({
      label: 'lib/',
      replacement: '~/lib/',
    });
  });
});
