import { describe, expect, it, vi } from 'vitest';
import {
  createPromptHost,
  getPromptHost,
  PromptBusyError,
  PromptCancelledError,
  PromptHostUnavailableError,
  PromptHostAmbiguousError,
  type PromptControls,
  type PromptRenderer,
  type PromptRequest,
} from '../../src/interaction/prompt.js';
import {
  createRuntimeScope,
  destroyRuntimeScope,
} from '../../src/core/runtime-scope.js';

class MemoryRenderer implements PromptRenderer {
  request: PromptRequest<any> | null = null;
  controls: PromptControls<unknown> | null = null;
  cleanup = vi.fn();

  present<TResult>(request: PromptRequest<any>, controls: PromptControls<TResult>) {
    this.request = request;
    this.controls = controls as PromptControls<unknown>;
    return this.cleanup;
  }
}

describe('PromptHost', () => {
  it('routes typed convenience requests through one renderer contract', async () => {
    const renderer = new MemoryRenderer();
    const host = createPromptHost();
    host.setRenderer(renderer);
    const result = host.select('Environment', ['dev', 'prod'] as const, { default: 'prod' });

    expect(renderer.request).toEqual({
      kind: 'select',
      message: 'Environment',
      choices: ['dev', 'prod'],
      default: 'prod',
    });
    renderer.controls!.resolve('prod');
    await expect(result).resolves.toBe('prod');
    expect(renderer.cleanup).toHaveBeenCalledOnce();
    expect(host.busy).toBe(false);
  });

  it('rejects concurrent requests without disturbing the active one', async () => {
    const renderer = new MemoryRenderer();
    const host = createPromptHost();
    host.setRenderer(renderer);
    const first = host.input('Name');

    await expect(host.confirm('Continue?')).rejects.toBeInstanceOf(PromptBusyError);
    renderer.controls!.resolve('Ada');
    await expect(first).resolves.toBe('Ada');
  });

  it('requires a renderer and makes registration ownership explicit', async () => {
    const host = createPromptHost();
    await expect(host.input('Name')).rejects.toBeInstanceOf(PromptHostUnavailableError);
    const registration = host.setRenderer(new MemoryRenderer());
    expect(() => host.setRenderer(new MemoryRenderer())).toThrow(/already installed/);
    registration.dispose();
    expect(host.available).toBe(false);
  });

  it('rejects ambiguous host lookup when multiple apps are active', () => {
    const first = createRuntimeScope();
    const second = createRuntimeScope();
    try {
      expect(() => getPromptHost()).toThrow(PromptHostAmbiguousError);
    } finally {
      destroyRuntimeScope(first);
      destroyRuntimeScope(second);
    }
  });

  it('cancels exactly once when its renderer is removed', async () => {
    const renderer = new MemoryRenderer();
    const host = createPromptHost();
    const registration = host.setRenderer(renderer);
    const result = host.password('Secret');
    registration.dispose();
    registration.dispose();

    await expect(result).rejects.toBeInstanceOf(PromptCancelledError);
    expect(renderer.cleanup).toHaveBeenCalledOnce();
    expect(renderer.controls!.signal.aborted).toBe(true);
  });

  it('ignores duplicate renderer settlement and disposes active work', async () => {
    const renderer = new MemoryRenderer();
    const host = createPromptHost();
    host.setRenderer(renderer);
    const result = host.number('Age');
    const controls = renderer.controls!;
    controls.resolve(42);
    controls.reject(new Error('late'));
    await expect(result).resolves.toBe(42);

    const next = host.input('Again');
    host.dispose();
    host.dispose();
    await expect(next).rejects.toBeInstanceOf(PromptCancelledError);
    expect(host.disposed).toBe(true);
  });
});
