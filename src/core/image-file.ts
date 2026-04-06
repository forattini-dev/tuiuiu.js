import { execFile } from 'node:child_process';
import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { resolve as resolvePath } from 'node:path';

import {
  createImageData,
  createTerminalImageSource,
  type CellSize,
  type ImageData,
  type TerminalImageSource,
} from './graphics.js';

type CommandEncoding = BufferEncoding | 'buffer';

export interface ProbeImageFileResult {
  path: string;
  width: number;
  height: number;
}

export interface ImageFileCommandOptions {
  cwd?: string;
  encoding?: CommandEncoding;
  maxBuffer?: number;
}

export type ImageFileCommandRunner = (
  command: string,
  args: string[],
  options?: ImageFileCommandOptions,
) => Promise<string | Buffer>;

export interface LoadImageFileOptions {
  cwd?: string;
  ffmpegPath?: string;
  ffprobePath?: string;
  maxBuffer?: number;
  cellSize?: Partial<CellSize>;
  commandRunner?: ImageFileCommandRunner;
}

function defaultCommandRunner(
  command: string,
  args: string[],
  options: ImageFileCommandOptions = {},
): Promise<string | Buffer> {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      {
        cwd: options.cwd,
        encoding: options.encoding ?? 'utf8',
        maxBuffer: options.maxBuffer,
      },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(stdout);
      },
    );
  });
}

function getCommandRunner(options?: LoadImageFileOptions): ImageFileCommandRunner {
  return options?.commandRunner ?? defaultCommandRunner;
}

function resolveImagePath(imagePath: string, cwd?: string): string {
  return resolvePath(cwd ?? process.cwd(), imagePath);
}

async function assertReadableFile(filePath: string): Promise<void> {
  await access(filePath, constants.R_OK);
}

export async function probeImageFile(
  imagePath: string,
  options: LoadImageFileOptions = {},
): Promise<ProbeImageFileResult> {
  const resolvedPath = resolveImagePath(imagePath, options.cwd);
  await assertReadableFile(resolvedPath);

  const stdout = await getCommandRunner(options)(
    options.ffprobePath ?? 'ffprobe',
    [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height',
      '-of',
      'json',
      resolvedPath,
    ],
    {
      cwd: options.cwd,
      encoding: 'utf8',
      maxBuffer: options.maxBuffer,
    },
  );
  const probe = JSON.parse(String(stdout)) as {
    streams?: Array<{ width?: number; height?: number }>;
  };
  const width = probe.streams?.[0]?.width;
  const height = probe.streams?.[0]?.height;

  if (!width || !height) {
    throw new Error(`Unable to determine image dimensions for ${resolvedPath}`);
  }

  return {
    path: resolvedPath,
    width,
    height,
  };
}

export async function loadImageFile(
  imagePath: string,
  options: LoadImageFileOptions = {},
): Promise<ImageData> {
  const { path: resolvedPath, width, height } = await probeImageFile(imagePath, options);
  const expectedSize = width * height * 4;
  const stdout = await getCommandRunner(options)(
    options.ffmpegPath ?? 'ffmpeg',
    [
      '-v',
      'error',
      '-i',
      resolvedPath,
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgba',
      '-',
    ],
    {
      cwd: options.cwd,
      encoding: 'buffer',
      maxBuffer: options.maxBuffer ?? Math.max(expectedSize * 2, 4 * 1024 * 1024),
    },
  );
  const pixels = stdout instanceof Buffer ? stdout : Buffer.from(stdout);

  if (pixels.length !== expectedSize) {
    throw new Error(
      `Decoded RGBA size mismatch for ${resolvedPath}: expected ${expectedSize}, got ${pixels.length}`,
    );
  }

  return createImageData(pixels, width, height);
}

export async function loadTerminalImageSourceFromFile(
  imagePath: string,
  options: LoadImageFileOptions = {},
): Promise<TerminalImageSource> {
  const image = await loadImageFile(imagePath, options);
  return createTerminalImageSource(image, {
    cellSize: options.cellSize
      ? {
          width: options.cellSize.width ?? 10,
          height: options.cellSize.height ?? 20,
        }
      : undefined,
  });
}

// =============================================================================
// Image Path Detection
// =============================================================================

/** Supported image file extensions */
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|bmp|tiff?|svg|ico|avif)$/i;

/**
 * Remove surrounding quotes from a string.
 * Handles both single and double quotes from shell paste.
 */
function removeOuterQuotes(text: string): string {
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  return text;
}

/**
 * Remove shell backslash escapes from a path.
 * E.g., `/path/to/my\ image.png` → `/path/to/my image.png`
 */
function stripBackslashEscapes(text: string): string {
  if (process.platform === 'win32') return text;
  return text.replace(/\\(.)/g, '$1');
}

/**
 * Clean a raw pasted string into a usable file path.
 */
function cleanPath(raw: string): string {
  return stripBackslashEscapes(removeOuterQuotes(raw.trim()));
}

/**
 * Check if a string looks like a path to an image file.
 */
export function isImagePath(text: string): boolean {
  const cleaned = cleanPath(text);
  return cleaned.length > 0 && IMAGE_EXTENSIONS.test(cleaned);
}

/**
 * Extract image file paths from pasted text.
 *
 * Handles:
 * - Newline-separated paths (drag multiple files)
 * - Space-separated absolute paths (Finder/Explorer drag)
 * - Quoted paths with spaces
 * - Shell-escaped paths with backslashes
 *
 * @example
 * extractImagePaths('/home/user/photo.png\n/tmp/screenshot.jpg')
 * // → ['/home/user/photo.png', '/tmp/screenshot.jpg']
 *
 * extractImagePaths('/path/to/my\\ image.png')
 * // → ['/path/to/my image.png']
 */
export function extractImagePaths(text: string): string[] {
  // Split on newlines first, then on spaces before absolute paths
  const candidates = text
    .split(/ (?=\/|[A-Za-z]:\\)/)
    .flatMap((part) => part.split('\n'))
    .map((line) => cleanPath(line))
    .filter((line) => line.length > 0);

  return candidates.filter((candidate) => IMAGE_EXTENSIONS.test(candidate));
}
