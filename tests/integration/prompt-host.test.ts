import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '../../src/app/render-loop.js';
import { Text } from '../../src/primitives/nodes.js';
import { useInput } from '../../src/hooks/use-input.js';
import { promptInput, PromptCancelledError } from '../../src/prompts/index.js';
import { cleanupApp } from '../../src/hooks/use-app.js';

function createStreams() {
  const inputEmitter = new EventEmitter();
  const stdin = Object.assign(inputEmitter, {
    isTTY: true,
    setRawMode: vi.fn(),
    resume: vi.fn(),
    pause: vi.fn(),
  }) as unknown as NodeJS.ReadStream;
  const outputEmitter = new EventEmitter();
  const stdout = Object.assign(outputEmitter, {
    columns: 80,
    rows: 24,
    isTTY: true,
    write: vi.fn(() => true),
  }) as unknown as NodeJS.WriteStream;
  return { stdin, stdout };
}

describe('VNode PromptHost integration', () => {
  afterEach(() => cleanupApp());

  it('routes public prompts through the app overlay without leaking input', async () => {
    const { stdin, stdout } = createStreams();
    const backgroundInput = vi.fn();
    const app = render(() => {
      useInput(backgroundInput);
      return Text({}, 'application');
    }, {
      stdin,
      stdout,
      screen: 'inline',
      maxFps: 0,
    });

    const result = promptInput('Name');
    stdin.emit('data', Buffer.from('Ada\r'));
    await expect(result).resolves.toBe('Ada');
    expect(backgroundInput).not.toHaveBeenCalled();

    stdin.emit('data', Buffer.from('z'));
    expect(backgroundInput).toHaveBeenCalledOnce();
    app.unmount();
  });

  it('turns overlay Escape into a prompt cancellation', async () => {
    const { stdin, stdout } = createStreams();
    const app = render(() => Text({}, 'application'), {
      stdin,
      stdout,
      screen: 'inline',
      maxFps: 0,
    });

    const result = promptInput('Name');
    stdin.emit('data', Buffer.from('\u001b'));
    await expect(result).rejects.toBeInstanceOf(PromptCancelledError);
    app.unmount();
  });
});
