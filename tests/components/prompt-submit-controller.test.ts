/**
 * PromptSubmitController Tests
 */

import { describe, expect, it, vi } from 'vitest';
import { createPromptSubmitController, type PromptSubmitInputState } from '../../src/atoms/prompt-submit-controller.js';
import { createTextInput, type TextInputCompletionState, type TextInputSegment } from '../../src/atoms/text-input.js';

function completionState(): TextInputCompletionState {
  return {
    anchor: { start: 0, end: 2, query: 'a', trigger: '@' },
    query: 'a',
    status: 'ready',
    items: [{ id: 'ada', label: '@ada' }],
    selectedIndex: 0,
  };
}

function createFakeInput(initialValue: string, initialSegments: TextInputSegment[] = []) {
  let value = initialValue;
  let segments = [...initialSegments];
  let completion: TextInputCompletionState | null = null;

  const input: PromptSubmitInputState & {
    setValue: (nextValue: string) => void;
    setCompletion: (nextCompletion: TextInputCompletionState | null) => void;
  } = {
    value: () => value,
    segments: () => segments,
    completion: () => completion,
    acceptCompletion: vi.fn(() => {
      if (!completion) return false;
      value = completion.items[completion.selectedIndex]?.label ?? value;
      completion = null;
      return true;
    }),
    insertText: vi.fn((text, range = { start: value.length, end: value.length }) => {
      value = `${value.slice(0, range.start)}${text}${value.slice(range.end)}`;
      return true;
    }),
    clear: vi.fn(() => {
      value = '';
      segments = [];
    }),
    setValue: (nextValue) => {
      value = nextValue;
    },
    setCompletion: (nextCompletion) => {
      completion = nextCompletion;
    },
  };

  return input;
}

describe('createPromptSubmitController', () => {
  it('accepts an active completion before submitting', () => {
    const input = createFakeInput('@a');
    input.setCompletion(completionState());
    const onSubmit = vi.fn();
    const controller = createPromptSubmitController({ input, onSubmit });

    const result = controller.submit();

    expect(result).toEqual({ action: 'accepted-completion' });
    expect(input.acceptCompletion).toHaveBeenCalled();
    expect(input.value()).toBe('@ada');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('ignores empty prompts by default', () => {
    const input = createFakeInput('   ');
    const onSubmit = vi.fn();
    const controller = createPromptSubmitController({ input, onSubmit });

    const result = controller.submit();

    expect(result).toEqual({ action: 'ignored', reason: 'empty' });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input.clear).not.toHaveBeenCalled();
  });

  it('turns the continuation marker into a newline', () => {
    const input = createFakeInput('first line\\');
    const onSubmit = vi.fn();
    const controller = createPromptSubmitController({ input, onSubmit });

    const result = controller.submit();

    expect(result).toEqual({ action: 'continued', value: 'first line\n' });
    expect(input.insertText).toHaveBeenCalledWith('\n', { start: 10, end: 11 });
    expect(input.value()).toBe('first line\n');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a ready prompt with value and semantic segments', () => {
    const segment: TextInputSegment = {
      id: 'file',
      kind: 'file',
      start: 7,
      end: 19,
      displayText: '#src/app.ts',
      payload: { path: 'src/app.ts' },
    };
    const input = createFakeInput('Review #src/app.ts', [segment]);
    const onSubmit = vi.fn();
    const controller = createPromptSubmitController({
      input,
      onSubmit,
      createId: (next) => `submit-${next}`,
    });

    const result = controller.submit();

    expect(result).toMatchObject({
      action: 'submitted',
      item: {
        id: 'submit-1',
        value: 'Review #src/app.ts',
        trimmedValue: 'Review #src/app.ts',
        source: 'submit',
      },
    });
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      id: 'submit-1',
      value: 'Review #src/app.ts',
      queued: false,
      segments: [segment],
    }));
    expect(input.clear).toHaveBeenCalled();
  });

  it('ignores submits while busy by default', () => {
    const input = createFakeInput('run this');
    const onSubmit = vi.fn();
    const controller = createPromptSubmitController({
      input,
      onSubmit,
      initialBusy: true,
    });

    const result = controller.submit();

    expect(result).toMatchObject({
      action: 'busy-ignored',
      item: { value: 'run this' },
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input.clear).not.toHaveBeenCalled();
  });

  it('queues busy submits and dequeues them in FIFO order', () => {
    const input = createFakeInput('first');
    const onSubmit = vi.fn();
    const controller = createPromptSubmitController({
      input,
      onSubmit,
      initialBusy: true,
      busyPolicy: 'queue',
      maxQueue: 2,
      now: () => 123,
      createId: (next) => `queued-${next}`,
    });

    const first = controller.submit();
    input.setValue('second');
    const second = controller.submit();
    input.setValue('third');
    const third = controller.submit();

    expect(first).toMatchObject({ action: 'queued', queueDepth: 1 });
    expect(second).toMatchObject({ action: 'queued', queueDepth: 2 });
    expect(third).toMatchObject({ action: 'queue-full', queueDepth: 2 });
    expect(controller.queue().map((item) => item.value)).toEqual(['first', 'second']);

    const next = controller.dequeue();
    expect(next).toMatchObject({
      action: 'dequeued',
      item: { id: 'queued-1', value: 'first', queuedAt: 123 },
      queueDepth: 1,
    });
    if (next.action === 'dequeued') {
      const submitted = controller.submitQueued(next.item);
      expect(submitted).toMatchObject({
        action: 'submitted',
        item: { id: 'queued-1', value: 'first', source: 'queue' },
      });
    }
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      id: 'queued-1',
      value: 'first',
      queued: true,
    }));
  });

  it('runs interrupt handler while busy', () => {
    const input = createFakeInput('work');
    const onInterrupt = vi.fn();
    const controller = createPromptSubmitController({
      input,
      onSubmit: vi.fn(),
      onInterrupt,
      initialBusy: true,
      busyPolicy: 'queue',
    });
    controller.submit();

    const result = controller.interrupt();

    expect(result).toEqual({ action: 'interrupted', queueDepth: 1 });
    expect(onInterrupt).toHaveBeenCalledWith(expect.objectContaining({
      queueDepth: 1,
      queuedItems: [expect.objectContaining({ value: 'work' })],
    }));
  });

  it('exposes insertText on createTextInput for range edits', () => {
    const input = createTextInput({ initialValue: 'hello\\' });

    const applied = input.insertText('\n', { start: 5, end: 6 });

    expect(applied).toBe(true);
    expect(input.value()).toBe('hello\n');
  });
});
