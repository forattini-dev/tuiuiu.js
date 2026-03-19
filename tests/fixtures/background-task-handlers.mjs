import { isMainThread, threadId } from 'node:worker_threads';

const sleep = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs));

export const backgroundTaskHandlers = {
  async uppercase(payload) {
    return String(payload.text).toUpperCase();
  },

  async explode(payload) {
    throw new Error(String(payload.message));
  },

  async threadInfo() {
    return {
      isMainThread,
      threadId,
    };
  },

  async delayedEcho(payload, signal) {
    const delayMs = Number(payload.delayMs ?? 10);
    for (let index = 0; index < delayMs; index += 5) {
      if (signal.aborted) {
        throw new Error(String(signal.reason ?? 'Cancelled'));
      }
      await sleep(5);
    }
    return String(payload.text);
  },

  async progressEcho(payload, signal, reporter) {
    const delayMs = Number(payload.delayMs ?? 8);
    const updates = Array.isArray(payload.steps) && payload.steps.length > 0
      ? payload.steps
      : [
          { progress: 15, status: 'Preparing background work' },
          { progress: 60, status: 'Running background work' },
          { progress: 92, status: 'Wrapping background work' },
        ];

    for (const update of updates) {
      if (signal.aborted) {
        throw new Error(String(signal.reason ?? 'Cancelled'));
      }
      reporter.emit('progress', update);
      await sleep(delayMs);
    }

    return String(payload.text ?? 'done');
  },

  async emitAfterAbort(payload, signal, reporter) {
    signal.addEventListener('abort', () => {
      reporter.emit('progress', {
        progress: 99,
        status: 'late progress after cancellation',
      });
    }, { once: true });

    const delayMs = Number(payload.delayMs ?? 30);
    for (let index = 0; index < delayMs; index += 5) {
      if (signal.aborted) {
        throw new Error(String(signal.reason ?? 'Cancelled'));
      }
      await sleep(5);
    }

    return 'completed';
  },
};

export default backgroundTaskHandlers;
