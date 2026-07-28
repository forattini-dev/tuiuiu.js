import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  execFile: vi.fn(),
  readFileSync: vi.fn(),
  mkdtempSync: vi.fn(),
  rmSync: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execFile: mocks.execFile,
}));

vi.mock('node:fs', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:fs')>();
  return {
    ...original,
    readFileSync: mocks.readFileSync,
    mkdtempSync: mocks.mkdtempSync,
    rmSync: mocks.rmSync,
  };
});

import {
  hasClipboardImage,
  readClipboardImage,
} from '../../src/core/clipboard-image.js';

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

afterEach(() => {
  vi.restoreAllMocks();
  mocks.execFile.mockReset();
  mocks.readFileSync.mockReset();
  mocks.mkdtempSync.mockReset();
  mocks.rmSync.mockReset();
});

describe('clipboard image commands', () => {
  it('passes the Windows temporary path as data instead of PowerShell source', async () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
    const tempDir = String.raw`C:\Temp\tuiuiu-clip-path with ' quote`;
    mocks.mkdtempSync.mockReturnValue(tempDir);
    mocks.readFileSync.mockReturnValue(png);
    mocks.execFile.mockImplementation(
      (
        _command: string,
        _args: string[],
        _options: object,
        callback: (error: Error | null, stdout: Buffer) => void,
      ) => {
        callback(null, Buffer.alloc(0));
      },
    );

    await expect(readClipboardImage()).resolves.toEqual({
      buffer: png,
      mediaType: 'image/png',
    });

    const [command, args] = mocks.execFile.mock.calls[0] as [string, string[]];
    expect(command).toBe('powershell');
    expect(args[2]).not.toContain(tempDir);
    expect(args.at(-1)).toBe(String.raw`C:\Temp\tuiuiu-clip-path with ' quote\clipboard.png`);
    expect(args).not.toContain('/bin/sh');
    expect(mocks.rmSync).toHaveBeenCalledWith(tempDir, {
      recursive: true,
      force: true,
    });
  });

  it('uses fixed executable arguments for Linux detection and reading', async () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
    mocks.execFile.mockImplementation(
      (
        command: string,
        args: string[],
        options: object,
        callback: (error: Error | null, stdout: Buffer | string) => void,
      ) => {
        if (command === 'xclip' && args.includes('TARGETS')) {
          callback(new Error('xclip unavailable'), '');
        } else if (command === 'wl-paste' && args.includes('-l')) {
          callback(null, 'text/plain\nimage/png\n');
        } else {
          callback(null, png);
        }
      },
    );

    await expect(hasClipboardImage()).resolves.toBe(true);
    await expect(readClipboardImage()).resolves.toEqual({
      buffer: png,
      mediaType: 'image/png',
    });

    expect(mocks.execFile.mock.calls.map((call) => call[0])).toEqual([
      'xclip',
      'wl-paste',
      'xclip',
    ]);
    for (const call of mocks.execFile.mock.calls) {
      expect(call[1]).toBeInstanceOf(Array);
    }
  });
});
