import { describe, expect, it } from 'vitest';

import { createPromptModeResolver } from '../../src/interaction/prompt-mode.js';

describe('createPromptModeResolver', () => {
  const registry = createPromptModeResolver({
    defaultMode: {
      id: 'text',
      label: 'Text',
    },
    modes: [
      {
        id: 'command',
        label: 'Command',
        prefix: '/',
      },
      {
        id: 'shell',
        label: 'Shell',
        prefix: '!',
      },
    ],
  });

  it('falls back to the default text mode for plain prompts', () => {
    expect(registry.inspectPrompt('review the render loop')).toMatchObject({
      mode: {
        id: 'text',
      },
      prefix: null,
      payload: 'review the render loop',
      isExplicit: false,
    });
  });

  it('resolves slash-prefixed prompts to command mode', () => {
    expect(registry.inspectPrompt('/help')).toMatchObject({
      mode: {
        id: 'command',
      },
      prefix: '/',
      payload: 'help',
      isExplicit: true,
    });
  });

  it('resolves bang-prefixed prompts to shell mode', () => {
    expect(registry.inspectPrompt('!git status')).toMatchObject({
      mode: {
        id: 'shell',
      },
      prefix: '!',
      payload: 'git status',
      isExplicit: true,
    });
  });

  it('keeps inspectPrompt and parse aligned for the same input', () => {
    expect(registry.inspectPrompt('!echo hello')).toEqual(
      registry.inspectPrompt('!echo hello')
    );
  });
});
