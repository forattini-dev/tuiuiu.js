import { describe, expect, it } from 'vitest';

import { createPromptCommandRegistry } from '../../src/core/prompt-command-routing.js';

describe('createPromptCommandRegistry', () => {
  it('returns slash command completion items for matching queries', () => {
    const registry = createPromptCommandRegistry([
      { id: 'help', command: 'help', description: 'Show available commands.' },
      { id: 'clear', command: 'clear', description: 'Reset the transcript.' },
    ]);

    expect(registry.complete('he')[0]).toMatchObject({
      id: 'help',
      label: '/help',
      replacement: '/help',
    });
  });

  it('keeps command-token completion context stable for / queries', () => {
    const registry = createPromptCommandRegistry([
      { id: 'help', command: 'help', description: 'Show available commands.' },
      { id: 'clear', command: 'clear', description: 'Reset the transcript.' },
    ]);

    expect(registry.getCompletionContext('/he', 3)).toMatchObject({
      target: 'command',
      replaceRange: {
        start: 0,
        end: 3,
      },
      query: 'he',
    });
  });

  it('reuses fuzzy matching and aliases when ranking completion results', () => {
    const registry = createPromptCommandRegistry([
      { id: 'clear', command: 'clear', description: 'Reset the transcript.', aliases: ['wipe'] },
      { id: 'tokens', command: 'tokens', description: 'Summarize semantic tokens.' },
      { id: 'help', command: 'help', description: 'Show available commands.' },
    ]);

    expect(registry.complete('wi')[0]?.id).toBe('clear');
    expect(registry.complete('tok').map((item) => item.id)[0]).toBe('tokens');
  });

  it('parses submitted prompt text into canonical command matches and arguments', () => {
    const registry = createPromptCommandRegistry([
      { id: 'clear', command: 'clear', description: 'Reset the transcript.', aliases: ['wipe'] },
      { id: 'seed', command: 'seed', description: 'Seed the prompt.' },
    ]);

    expect(registry.parse('/wipe current draft')).toMatchObject({
      command: {
        id: 'clear',
        command: 'clear',
      },
      matchedToken: 'wipe',
      invocation: '/wipe',
      argsText: 'current draft',
    });

    expect(registry.parse('normal prompt')).toBeNull();
  });

  it('resolves argument completion context for matched commands', () => {
    const registry = createPromptCommandRegistry([
      {
        id: 'seed',
        command: 'seed',
        description: 'Seed the prompt.',
        completeArgs: (context) => [
          { id: 'planner', label: 'planner', replacement: 'planner', detail: `arg:${context.currentArgText}` },
        ],
      },
    ]);

    expect(registry.getCompletionContext('/seed pl', 8)).toMatchObject({
      target: 'argument',
      query: 'pl',
      replaceRange: {
        start: 6,
        end: 8,
      },
      parseResult: {
        command: {
          id: 'seed',
          command: 'seed',
        },
        argsText: 'pl',
        currentArgText: 'pl',
      },
    });
  });

  it('returns command-specific argument suggestions when the cursor is inside arguments', async () => {
    const registry = createPromptCommandRegistry([
      {
        id: 'seed',
        command: 'seed',
        description: 'Seed the prompt.',
        completeArgs: (context) =>
          ['planner', 'reviewer']
            .filter((item) => item.includes(context.currentArgText))
            .map((item) => ({
              id: item,
              label: item,
              replacement: item,
            })),
      },
    ]);

    const resolved = await registry.resolvePromptCompletion('/seed re', 8);
    expect(resolved).toMatchObject({
      context: {
        target: 'argument',
        query: 're',
      },
    });
    expect(resolved?.items.map((item) => item.id)).toEqual(['reviewer']);
  });

  it('inspects matched live context while editing a recognized slash command token', () => {
    const registry = createPromptCommandRegistry([
      {
        id: 'help',
        command: 'help',
        description: 'Show available commands.',
        usage: '/help',
      },
    ]);

    expect(registry.inspectPrompt('/help', 5)).toMatchObject({
      status: 'matched',
      target: 'command',
      query: 'help',
      invocation: '/help',
      usage: '/help',
      token: 'help',
      replaceRange: {
        start: 0,
        end: 5,
      },
    });
  });

  it('inspects unresolved live context for unknown slash command tokens', () => {
    const registry = createPromptCommandRegistry([
      { id: 'help', command: 'help', description: 'Show available commands.' },
    ]);

    expect(registry.inspectPrompt('/unknown', 8)).toMatchObject({
      status: 'unresolved',
      target: 'command',
      query: 'unknown',
      invocation: '/unknown',
      token: 'unknown',
      replaceRange: {
        start: 0,
        end: 8,
      },
    });
  });

  it('inspects matched live context for slash-command arguments and exposes usage metadata', () => {
    const registry = createPromptCommandRegistry([
      {
        id: 'seed',
        command: 'seed',
        description: 'Seed the prompt.',
        usage: '/seed <preset>',
      },
    ]);

    expect(registry.inspectPrompt('/seed reviewer extra', 14)).toMatchObject({
      status: 'matched',
      target: 'argument',
      invocation: '/seed',
      usage: '/seed <preset>',
      query: 'reviewer',
      currentArgText: 'reviewer',
      argsText: 'reviewer extra',
      args: ['reviewer', 'extra'],
      replaceRange: {
        start: 6,
        end: 14,
      },
    });
  });

  it('exposes informational live diagnostics for matched commands', () => {
    const registry = createPromptCommandRegistry([
      {
        id: 'seed',
        command: 'seed',
        description: 'Seed the prompt.',
        getLiveDiagnostic: (context) => context.args[0] === 'planner'
          ? { level: 'info', message: 'Preset ready: planner' }
          : null,
      },
    ]);

    expect(registry.inspectPrompt('/seed planner', 13)).toMatchObject({
      status: 'matched',
      target: 'argument',
      diagnostic: {
        level: 'info',
        message: 'Preset ready: planner',
      },
    });
  });

  it('surfaces warning and error diagnostics for incomplete or invalid arguments', () => {
    const registry = createPromptCommandRegistry([
      {
        id: 'seed',
        command: 'seed',
        description: 'Seed the prompt.',
        getLiveDiagnostic: (context) => {
          const preset = context.args[0];
          if (!preset) {
            return {
              level: 'warning',
              message: 'Preset required.',
            };
          }
          if (!['planner', 'reviewer', 'render-loop'].includes(preset)) {
            return {
              level: 'error',
              message: `Unknown preset: ${preset}`,
            };
          }
          return {
            level: 'info',
            message: `Preset ready: ${preset}`,
          };
        },
      },
    ]);

    expect(registry.inspectPrompt('/seed', 5)).toMatchObject({
      status: 'matched',
      target: 'command',
      diagnostic: {
        level: 'warning',
        message: 'Preset required.',
      },
    });

    expect(registry.inspectPrompt('/seed mystery', 13)).toMatchObject({
      status: 'matched',
      target: 'argument',
      diagnostic: {
        level: 'error',
        message: 'Unknown preset: mystery',
      },
    });
  });

  it('does not fabricate matched-command diagnostics for unresolved commands', () => {
    const registry = createPromptCommandRegistry([
      {
        id: 'seed',
        command: 'seed',
        description: 'Seed the prompt.',
        getLiveDiagnostic: () => ({
          level: 'error',
          message: 'This should not appear for unresolved commands.',
        }),
      },
    ]);

    expect(registry.inspectPrompt('/mystery', 8)).toMatchObject({
      status: 'unresolved',
      target: 'command',
      query: 'mystery',
    });
  });
});
