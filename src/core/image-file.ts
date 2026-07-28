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
  timeoutMs?: number;
  signal?: AbortSignal;
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
  /** Maximum width accepted from image metadata (default: 8192). */
  maxWidth?: number;
  /** Maximum height accepted from image metadata (default: 8192). */
  maxHeight?: number;
  /** Maximum number of decoded pixels (default: 16,777,216). */
  maxPixels?: number;
  /** Maximum decoded RGBA bytes (default: 64 MiB). */
  maxDecodedBytes?: number;
  /** Subprocess timeout in milliseconds (default: 15s). */
  timeoutMs?: number;
  /** Abort ffprobe/ffmpeg work. */
  signal?: AbortSignal;
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
        timeout: options.timeoutMs,
        signal: options.signal,
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

function validateImageDimensions(
  width: unknown,
  height: unknown,
  resolvedPath: string,
  options: LoadImageFileOptions,
): { width: number; height: number; expectedSize: number } {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    (width as number) <= 0 ||
    (height as number) <= 0
  ) {
    throw new Error(`Invalid image dimensions for ${resolvedPath}`);
  }

  const safeWidth = width as number;
  const safeHeight = height as number;
  const maxWidth = options.maxWidth ?? 8192;
  const maxHeight = options.maxHeight ?? 8192;
  const maxPixels = options.maxPixels ?? 16_777_216;
  const maxDecodedBytes = options.maxDecodedBytes ?? 64 * 1024 * 1024;
  const pixels = safeWidth * safeHeight;
  const expectedSize = pixels * 4;

  if (
    safeWidth > maxWidth ||
    safeHeight > maxHeight ||
    !Number.isSafeInteger(pixels) ||
    pixels > maxPixels ||
    !Number.isSafeInteger(expectedSize) ||
    expectedSize > maxDecodedBytes
  ) {
    throw new Error(
      `Image dimensions exceed configured limits for ${resolvedPath}: ` +
      `${safeWidth}x${safeHeight}`,
    );
  }

  return { width: safeWidth, height: safeHeight, expectedSize };
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
      maxBuffer: Math.min(options.maxBuffer ?? 1024 * 1024, 1024 * 1024),
      timeoutMs: options.timeoutMs ?? 15_000,
      signal: options.signal,
    },
  );
  const probe = JSON.parse(String(stdout)) as {
    streams?: Array<{ width?: number; height?: number }>;
  };
  const width = probe.streams?.[0]?.width;
  const height = probe.streams?.[0]?.height;

  const validated = validateImageDimensions(width, height, resolvedPath, options);

  return {
    path: resolvedPath,
    width: validated.width,
    height: validated.height,
  };
}

export async function loadImageFile(
  imagePath: string,
  options: LoadImageFileOptions = {},
): Promise<ImageData> {
  const { path: resolvedPath, width, height } = await probeImageFile(imagePath, options);
  const { expectedSize } = validateImageDimensions(width, height, resolvedPath, options);
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
      maxBuffer: options.maxBuffer ?? Math.max(expectedSize + 64 * 1024, 4 * 1024 * 1024),
      timeoutMs: options.timeoutMs ?? 15_000,
      signal: options.signal,
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
  // Preserve native Windows drive and UNC paths on every host. A POSIX path
  // pasted from a shell should still be decoded when the app runs on Windows
  // (for example inside WSL or from a remote session).
  if (/^[A-Za-z]:[\\/]/u.test(text) || /^\\\\[^\\]/u.test(text)) {
    return text;
  }
  if (
    text.startsWith('/') ||
    text.startsWith('./') ||
    text.startsWith('../') ||
    text.startsWith('~/') ||
    process.platform !== 'win32'
  ) {
    return text.replace(/\\(.)/g, '$1');
  }
  return text;
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
