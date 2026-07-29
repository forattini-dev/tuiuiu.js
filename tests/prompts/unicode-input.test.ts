import { beforeEach, describe, expect, it, vi } from 'vitest';

const processMocks = vi.hoisted(() => ({
  stdin: undefined as unknown as {
    emit: (event: string, value: Buffer) => boolean;
    isTTY: boolean;
    setRawMode: ReturnType<typeof vi.fn>;
    resume: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
  },
  write: vi.fn(),
}));

vi.mock('node:process', async () => {
  const { EventEmitter } = await vi.importActual<typeof import('node:events')>('node:events');
  processMocks.stdin = Object.assign(new EventEmitter(), {
    isTTY: true,
    setRawMode: vi.fn(),
    resume: vi.fn(),
    pause: vi.fn(),
  });
  return {
    stdin: processMocks.stdin,
    stdout: { write: processMocks.write },
  };
});

import {
  getPromptTheme,
  prompt,
  promptAutocomplete,
  promptPassword,
  promptSelect,
  resetPromptTheme,
} from '../../src/prompts/index.js';

describe('interactive prompt Unicode input', () => {
  beforeEach(() => {
    processMocks.write.mockClear();
    resetPromptTheme();
  });

  it('decodes split UTF-8 and deletes one password grapheme at a time', async () => {
    const resultPromise = promptPassword('Password');
    const emoji = Buffer.from('👩‍💻');

    processMocks.stdin.emit('data', emoji.subarray(0, 3));
    processMocks.stdin.emit('data', emoji.subarray(3));
    processMocks.stdin.emit('data', Buffer.from('\x7f'));
    processMocks.stdin.emit('data', emoji);
    processMocks.stdin.emit('data', Buffer.from('\r'));

    await expect(resultPromise).resolves.toBe('👩‍💻');
  });

  it('accepts split UTF-8 autocomplete queries without replacement characters', async () => {
    const resultPromise = promptAutocomplete(
      'Command',
      ['Deploy 👩‍💻', 'Other'],
    );
    const emoji = Buffer.from('👩‍💻');

    processMocks.stdin.emit('data', emoji.subarray(0, 2));
    processMocks.stdin.emit('data', emoji.subarray(2));
    processMocks.stdin.emit('data', Buffer.from('\r'));

    await expect(resultPromise).resolves.toBe('Deploy 👩‍💻');
    expect(processMocks.write.mock.calls.flat().join('')).not.toContain('\uFFFD');
  });

  it('strips terminal protocols from prompt labels and inactive choices', async () => {
    const resultPromise = promptSelect(
      `Choose\x1b]0;owned-title\x07 visible`,
      ['Safe', `Bad\x1b]52;c;payload\x07 visible`],
    );

    processMocks.stdin.emit('data', Buffer.from('\r'));
    await expect(resultPromise).resolves.toBe('Safe');

    const output = processMocks.write.mock.calls.flat().join('');
    expect(output).not.toContain('\x1b]');
    expect(output).not.toContain('owned-title');
    expect(output).not.toContain('payload');
    expect(output).toContain('visible');
  });

  it('supports a per-call theme without changing the global theme', async () => {
    const resultPromise = promptSelect('Choose', ['One', 'Two'], {
      theme: {
        symbols: {
          question: 'λ',
          pointer: '→',
        },
        colors: {
          accent: 'magenta',
          answer: 'blue',
        },
      },
    });

    processMocks.stdin.emit('data', Buffer.from('\r'));
    await expect(resultPromise).resolves.toBe('One');

    const output = processMocks.write.mock.calls.flat().join('');
    expect(output).toContain('\x1b[35mλ\x1b[0m');
    expect(output).toContain('\x1b[34m→\x1b[0m');
    expect(output).toContain('\x1b[34mOne\x1b[0m');
    expect(getPromptTheme().symbols.question).toBe('?');
  });

  it('configures and resets the process-wide prompt theme', async () => {
    prompt.setTheme({
      symbols: { question: '>' },
      colors: { accent: null, answer: null },
    });

    const configured = prompt.getTheme();
    configured.symbols.question = 'mutated copy';
    expect(prompt.getTheme().symbols.question).toBe('>');

    const resultPromise = promptSelect('Choose', ['One']);
    processMocks.stdin.emit('data', Buffer.from('\r'));
    await expect(resultPromise).resolves.toBe('One');

    const output = processMocks.write.mock.calls.flat().join('');
    expect(output).toContain('> \x1b[1mChoose\x1b[0m');
    expect(output).not.toContain('\x1b[36m>\x1b[0m');

    prompt.resetTheme();
    expect(prompt.getTheme()).toEqual({
      symbols: {
        question: '?',
        error: '!',
        pointer: '❯',
        selected: '◉',
        unselected: '○',
        cursor: '▌',
      },
      colors: {
        accent: 'cyan',
        answer: 'green',
        error: 'yellow',
      },
    });
  });

  it('sanitizes user-defined prompt symbols', async () => {
    const resultPromise = promptSelect('Choose', ['One'], {
      theme: {
        symbols: {
          question: `?\x1b]52;c;payload\x07\nowned`,
          pointer: `→\x1b]0;title\x07`,
        },
      },
    });

    processMocks.stdin.emit('data', Buffer.from('\r'));
    await expect(resultPromise).resolves.toBe('One');

    const output = processMocks.write.mock.calls.flat().join('');
    expect(output).not.toContain('\x1b]');
    expect(output).not.toContain('payload');
    expect(output).not.toContain('title');
    expect(output).toContain('? owned');
  });
});
