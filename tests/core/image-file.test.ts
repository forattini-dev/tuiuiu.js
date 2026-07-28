import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import {
  loadImageFile,
  loadTerminalImageSourceFromFile,
  probeImageFile,
  type ImageFileCommandRunner,
} from '../../src/core/image-file.js';

describe('image-file helpers', () => {
  const tempDirs: string[] = [];

  async function createTempImagePath(): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'tuiuiu-image-file-'));
    tempDirs.push(dir);
    const filePath = join(dir, 'image.png');
    await writeFile(filePath, Buffer.from('stub'));
    return filePath;
  }

  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })),
    );
  });

  it('probes image dimensions through ffprobe output', async () => {
    const filePath = await createTempImagePath();
    const calls: Array<{ command: string; args: string[] }> = [];
    const commandRunner: ImageFileCommandRunner = async (command, args) => {
      calls.push({ command, args });
      return JSON.stringify({
        streams: [{ width: 12, height: 8 }],
      });
    };

    const result = await probeImageFile(filePath, { commandRunner });

    expect(result).toEqual({
      path: filePath,
      width: 12,
      height: 8,
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      command: 'ffprobe',
    });
  });

  it('loads RGBA pixels via ffmpeg and returns ImageData', async () => {
    const filePath = await createTempImagePath();
    const pixels = Buffer.from([
      255, 0, 0, 255,
      0, 255, 0, 255,
      0, 0, 255, 255,
      255, 255, 255, 255,
    ]);
    const commandRunner: ImageFileCommandRunner = async (command) => {
      if (command === 'ffprobe') {
        return JSON.stringify({ streams: [{ width: 2, height: 2 }] });
      }

      return pixels;
    };

    const image = await loadImageFile(filePath, { commandRunner });

    expect(image.width).toBe(2);
    expect(image.height).toBe(2);
    expect(Array.from(image.pixels)).toEqual(Array.from(pixels));
  });

  it('creates a TerminalImageSource directly from a file path', async () => {
    const filePath = await createTempImagePath();
    const pixels = Buffer.from([
      255, 0, 0, 255,
      0, 255, 0, 255,
      0, 0, 255, 255,
      255, 255, 255, 255,
    ]);
    const commandRunner: ImageFileCommandRunner = async (command) => {
      if (command === 'ffprobe') {
        return JSON.stringify({ streams: [{ width: 4, height: 4 }] });
      }

      return Buffer.concat([pixels, pixels, pixels, pixels]);
    };

    const source = await loadTerminalImageSourceFromFile(filePath, {
      cellSize: { width: 2, height: 2 },
      commandRunner,
    });

    expect(source.width).toBe(4);
    expect(source.height).toBe(4);
    expect(source.cellSize).toEqual({ width: 2, height: 2 });
    expect(source.desiredColumns).toBe(2);
    expect(source.desiredRows).toBe(2);
  });

  it('rejects decoded payloads with the wrong RGBA size', async () => {
    const filePath = await createTempImagePath();
    const commandRunner: ImageFileCommandRunner = async (command) => {
      if (command === 'ffprobe') {
        return JSON.stringify({ streams: [{ width: 3, height: 2 }] });
      }

      return Buffer.alloc(8);
    };

    await expect(loadImageFile(filePath, { commandRunner })).rejects.toThrow(
      /Decoded RGBA size mismatch/,
    );
  });

  it('rejects unsafe image dimensions before invoking ffmpeg', async () => {
    const filePath = await createTempImagePath();
    const commands: string[] = [];
    const commandRunner: ImageFileCommandRunner = async (command) => {
      commands.push(command);
      return JSON.stringify({ streams: [{ width: 100_000, height: 100_000 }] });
    };

    await expect(loadImageFile(filePath, { commandRunner })).rejects.toThrow(
      /exceed configured limits/u,
    );
    expect(commands).toEqual(['ffprobe']);
  });

  it('passes timeout and abort controls to subprocess runners', async () => {
    const filePath = await createTempImagePath();
    const abortController = new AbortController();
    const seenOptions: Array<{ timeoutMs?: number; signal?: AbortSignal }> = [];
    const commandRunner: ImageFileCommandRunner = async (command, _args, options) => {
      seenOptions.push(options ?? {});
      if (command === 'ffprobe') {
        return JSON.stringify({ streams: [{ width: 1, height: 1 }] });
      }
      return Buffer.alloc(4);
    };

    await loadImageFile(filePath, {
      commandRunner,
      timeoutMs: 321,
      signal: abortController.signal,
    });

    expect(seenOptions).toHaveLength(2);
    expect(seenOptions.every((options) =>
      options.timeoutMs === 321 && options.signal === abortController.signal
    )).toBe(true);
  });
});
