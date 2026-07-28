/**
 * Incremental terminal input framing.
 *
 * This state machine owns UTF-8 chunk decoding, incomplete terminal sequences,
 * and bounded bracketed-paste accumulation. It deliberately stops before key,
 * focus, or mouse interpretation so every input consumer can share the same
 * chunk-boundary behavior.
 */

import { StringDecoder } from 'node:string_decoder';
import { PASTE_END, PASTE_START } from './input.js';

export interface TerminalInputStreamOptions {
  /** Maximum accepted paste payload in UTF-8 bytes. */
  maxPasteBytes?: number;
  /** Maximum incomplete escape sequence retained between chunks. */
  maxPendingEscapeBytes?: number;
  /** Plain-text chunk length treated as an unbracketed paste. */
  pasteHeuristicThreshold?: number;
}

export type TerminalInputStreamEvent =
  | {
      type: 'input';
      input: string;
    }
  | {
      type: 'paste';
      text: string;
      bracketed: boolean;
    };

export interface TerminalInputStreamStatus {
  pendingEscapeBytes: number;
  pasteBytes: number;
  pasteActive: boolean;
  pasteOverflowed: boolean;
}

function validatePositiveSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`[tuiuiu] ${name} must be a positive safe integer`);
  }
}

function validateNonNegativeSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`[tuiuiu] ${name} must be a non-negative safe integer`);
  }
}

function incompleteEscapeStart(input: string): number {
  let cursor = 0;

  while (cursor < input.length) {
    const start = input.indexOf('\x1b', cursor);
    if (start === -1) return -1;
    if (start + 1 >= input.length) return start;

    const introducer = input[start + 1];
    if (introducer === '[') {
      let end = start + 2;
      while (end < input.length) {
        const code = input.charCodeAt(end);
        if (code >= 0x40 && code <= 0x7e) break;
        end++;
      }
      if (end >= input.length) return start;
      cursor = end + 1;
      continue;
    }

    if (
      introducer === ']' ||
      introducer === 'P' ||
      introducer === '^' ||
      introducer === '_'
    ) {
      let end = start + 2;
      let complete = false;
      while (end < input.length) {
        if (introducer === ']' && input.charCodeAt(end) === 0x07) {
          end++;
          complete = true;
          break;
        }
        if (input[end] === '\x1b' && input[end + 1] === '\\') {
          end += 2;
          complete = true;
          break;
        }
        end++;
      }
      if (!complete) return start;
      cursor = end;
      continue;
    }

    if (introducer === 'O' && start + 2 >= input.length) return start;
    cursor = Math.min(
      input.length,
      start + (introducer === 'O' ? 3 : 2),
    );
  }

  return -1;
}

function splitIncompleteInput(input: string): {
  complete: string;
  pending: string;
} {
  const start = incompleteEscapeStart(input);
  if (start === -1) return { complete: input, pending: '' };
  return {
    complete: input.slice(0, start),
    pending: input.slice(start),
  };
}

function terminalPrefixAtEnd(input: string): number {
  const maxLength = Math.min(input.length, PASTE_END.length - 1);
  for (let length = maxLength; length > 0; length--) {
    if (input.endsWith(PASTE_END.slice(0, length))) return length;
  }
  return 0;
}

export class TerminalInputStream {
  private readonly maxPasteBytes: number;
  private readonly maxPendingEscapeBytes: number;
  private readonly pasteHeuristicThreshold: number;
  private decoder = new StringDecoder('utf8');
  private pendingInput = '';
  private pasteBuffer: string | null = null;
  private pasteBufferBytes = 0;
  private pasteOverflowed = false;
  private pasteTerminatorPrefix = '';
  private disposed = false;

  constructor(options: TerminalInputStreamOptions = {}) {
    this.maxPasteBytes = options.maxPasteBytes ?? 1024 * 1024;
    this.maxPendingEscapeBytes = options.maxPendingEscapeBytes ?? 4096;
    this.pasteHeuristicThreshold = options.pasteHeuristicThreshold ?? 32;
    validatePositiveSafeInteger(this.maxPasteBytes, 'maxPasteBytes');
    validatePositiveSafeInteger(
      this.maxPendingEscapeBytes,
      'maxPendingEscapeBytes',
    );
    validateNonNegativeSafeInteger(
      this.pasteHeuristicThreshold,
      'pasteHeuristicThreshold',
    );
  }

  get status(): TerminalInputStreamStatus {
    return {
      pendingEscapeBytes: Buffer.byteLength(this.pendingInput, 'utf8'),
      pasteBytes: this.pasteBufferBytes,
      pasteActive: this.pasteBuffer !== null,
      pasteOverflowed: this.pasteOverflowed,
    };
  }

  push(data: Buffer | string): TerminalInputStreamEvent[] {
    if (this.disposed) return [];
    const decoded =
      typeof data === 'string'
        ? data
        : this.decoder.write(data);
    if (!decoded && !this.pendingInput) return [];

    const combined = this.pendingInput + decoded;
    this.pendingInput = '';
    const { complete, pending } = splitIncompleteInput(combined);
    const events = complete ? this.processCompleteInput(complete) : [];

    if (pending) {
      if (
        Buffer.byteLength(pending, 'utf8') >
        this.maxPendingEscapeBytes
      ) {
        events.push(...this.processCompleteInput(pending));
      } else {
        this.pendingInput = pending;
      }
    }
    return events;
  }

  /**
   * Resolve an ambiguous escape prefix after the host's deadline expires.
   */
  flushPendingInput(): TerminalInputStreamEvent[] {
    if (this.disposed || !this.pendingInput) return [];
    const pending = this.pendingInput;
    this.pendingInput = '';
    return this.processCompleteInput(pending);
  }

  /**
   * Drop an unterminated bracketed paste after the host's deadline expires.
   */
  abortPaste(): void {
    const wasActive = this.pasteBuffer !== null;
    this.pasteBuffer = null;
    this.pasteBufferBytes = 0;
    this.pasteOverflowed = false;
    this.pasteTerminatorPrefix = '';
    if (wasActive && PASTE_END.startsWith(this.pendingInput)) {
      this.pendingInput = '';
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.pendingInput = '';
    this.abortPaste();
    this.decoder.end();
  }

  private appendPaste(text: string): void {
    if (this.pasteBuffer === null || this.pasteOverflowed || !text) return;
    const textBytes = Buffer.byteLength(text, 'utf8');
    if (this.pasteBufferBytes + textBytes > this.maxPasteBytes) {
      this.pasteBuffer = '';
      this.pasteBufferBytes = 0;
      this.pasteOverflowed = true;
      return;
    }
    this.pasteBuffer += text;
    this.pasteBufferBytes += textBytes;
  }

  private consumeActivePaste(
    input: string,
    events: TerminalInputStreamEvent[],
  ): string | null {
    const candidate = this.pasteTerminatorPrefix + input;
    this.pasteTerminatorPrefix = '';
    const endIndex = candidate.indexOf(PASTE_END);

    if (endIndex === -1) {
      const prefixLength = terminalPrefixAtEnd(candidate);
      const contentEnd = candidate.length - prefixLength;
      this.appendPaste(candidate.slice(0, contentEnd));
      this.pasteTerminatorPrefix = candidate.slice(contentEnd);
      return null;
    }

    this.appendPaste(candidate.slice(0, endIndex));
    if (!this.pasteOverflowed && this.pasteBuffer !== null) {
      events.push({
        type: 'paste',
        text: this.pasteBuffer,
        bracketed: true,
      });
    }
    this.abortPaste();
    return candidate.slice(endIndex + PASTE_END.length);
  }

  private processCompleteInput(input: string): TerminalInputStreamEvent[] {
    const events: TerminalInputStreamEvent[] = [];
    let rawInput = input;

    if (this.pasteBuffer !== null) {
      const remaining = this.consumeActivePaste(rawInput, events);
      if (remaining === null) return events;
      rawInput = remaining;
      if (!rawInput) return events;
    }

    while (rawInput.length > 0) {
      const pasteStartIndex = rawInput.indexOf(PASTE_START);
      if (pasteStartIndex !== -1) {
        const before = rawInput.slice(0, pasteStartIndex);
        if (before) {
          events.push({
            type: 'input',
            input: before,
          });
        }

        this.pasteBuffer = '';
        this.pasteBufferBytes = 0;
        this.pasteOverflowed = false;
        this.pasteTerminatorPrefix = '';
        const remaining = this.consumeActivePaste(
          rawInput.slice(pasteStartIndex + PASTE_START.length),
          events,
        );
        if (remaining === null) return events;
        rawInput = remaining;
        continue;
      }

      if (
        rawInput.length > this.pasteHeuristicThreshold &&
        !rawInput.includes('\x1b')
      ) {
        if (Buffer.byteLength(rawInput, 'utf8') <= this.maxPasteBytes) {
          events.push({
            type: 'paste',
            text: rawInput,
            bracketed: false,
          });
        }
        return events;
      }

      events.push({
        type: 'input',
        input: rawInput,
      });
      return events;
    }

    return events;
  }
}

export function createTerminalInputStream(
  options: TerminalInputStreamOptions = {},
): TerminalInputStream {
  return new TerminalInputStream(options);
}
