import { PassThrough, Writable } from 'node:stream';

const DEFAULT_TIMEOUT_MS = 5_000;
const RECENT_OUTPUT_LIMIT = 128 * 1024;

export class CaptureStream extends Writable {
  constructor(columns, rows) {
    super();
    this.columns = columns;
    this.rows = rows;
    this.isTTY = true;
    this.totalBytes = 0;
    this.writeCount = 0;
    this.recentOutput = '';
    this.waiters = new Set();
  }

  _write(chunk, encoding, callback) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
    this.totalBytes += buffer.byteLength;
    this.writeCount += 1;
    this.recentOutput = `${this.recentOutput}${buffer.toString('utf8')}`.slice(
      -RECENT_OUTPUT_LIMIT,
    );

    for (const waiter of [...this.waiters]) {
      if (waiter.predicate(this)) {
        this.waiters.delete(waiter);
        clearTimeout(waiter.timeout);
        waiter.resolve();
      }
    }

    callback();
  }

  snapshot() {
    return {
      bytes: this.totalBytes,
      writes: this.writeCount,
    };
  }

  waitForWriteAfter(writeCount, timeoutMs = DEFAULT_TIMEOUT_MS) {
    return this.waitFor(
      (stream) => stream.writeCount > writeCount,
      `output write after write ${writeCount}`,
      timeoutMs,
    );
  }

  waitForText(text, timeoutMs = DEFAULT_TIMEOUT_MS) {
    return this.waitFor(
      (stream) => stream.recentOutput.includes(text),
      `output containing ${JSON.stringify(text)}`,
      timeoutMs,
    );
  }

  waitFor(predicate, description, timeoutMs) {
    if (predicate(this)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const waiter = {
        predicate,
        resolve,
        timeout: setTimeout(() => {
          this.waiters.delete(waiter);
          reject(new Error(`Timed out waiting for ${description}`));
        }, timeoutMs),
      };
      this.waiters.add(waiter);
    });
  }
}

export function createInputStream() {
  const input = new PassThrough();
  input.isTTY = true;
  input.isRaw = false;
  input.setRawMode = (enabled) => {
    input.isRaw = enabled;
    return input;
  };
  return input;
}
