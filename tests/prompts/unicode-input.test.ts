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
  promptAutocomplete,
  promptPassword,
  promptSelect,
} from '../../src/prompts/index.js';

describe('interactive prompt Unicode input', () => {
  beforeEach(() => {
    processMocks.write.mockClear();
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
});
