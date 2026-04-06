/**
 * Clipboard Image Reading
 *
 * Platform-specific clipboard image detection and reading.
 * Uses native OS tools (no npm dependencies):
 * - macOS: osascript (AppleScript)
 * - Linux: xclip or wl-paste (Wayland)
 * - Windows: PowerShell Get-Clipboard
 */

import { execFile } from 'node:child_process';
import { writeFileSync, readFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface ClipboardImageResult {
  /** Raw image bytes */
  buffer: Buffer;
  /** MIME type (e.g., 'image/png') */
  mediaType: string;
}

// =============================================================================
// Platform-Specific Implementations
// =============================================================================

function execCommand(cmd: string, args: string[], options?: { encoding?: 'buffer' | 'utf8' }): Promise<Buffer | string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, {
      encoding: options?.encoding === 'utf8' ? 'utf8' : 'buffer' as BufferEncoding,
      maxBuffer: 10 * 1024 * 1024, // 10MB
      timeout: 5000,
    }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout as Buffer | string);
    });
  });
}

function execShell(command: string, options?: { encoding?: 'buffer' | 'utf8' }): Promise<Buffer | string> {
  return new Promise((resolve, reject) => {
    execFile('/bin/sh', ['-c', command], {
      encoding: options?.encoding === 'utf8' ? 'utf8' : 'buffer' as BufferEncoding,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 5000,
    }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout as Buffer | string);
    });
  });
}

/** Create a temporary file path for clipboard image */
function createTempImagePath(): string {
  const dir = mkdtempSync(join(tmpdir(), 'tuiuiu-clip-'));
  return join(dir, 'clipboard.png');
}

/** Safely remove a temp file */
function cleanupTempFile(path: string): void {
  try { unlinkSync(path); } catch { /* ignore */ }
}

// -----------------------------------------------------------------------------
// macOS
// -----------------------------------------------------------------------------

async function hasClipboardImageDarwin(): Promise<boolean> {
  try {
    await execShell("osascript -e 'the clipboard as «class PNGf»' > /dev/null 2>&1");
    return true;
  } catch {
    return false;
  }
}

async function readClipboardImageDarwin(): Promise<ClipboardImageResult | null> {
  const tempPath = createTempImagePath();
  try {
    // Save clipboard PNG to temp file via AppleScript
    await execShell(
      `osascript -e 'set png_data to (the clipboard as «class PNGf»)' ` +
      `-e 'set fp to open for access POSIX file "${tempPath}" with write permission' ` +
      `-e 'write png_data to fp' ` +
      `-e 'close access fp'`
    );

    const buffer = readFileSync(tempPath);
    if (buffer.length === 0) return null;

    return { buffer, mediaType: 'image/png' };
  } catch {
    return null;
  } finally {
    cleanupTempFile(tempPath);
  }
}

// -----------------------------------------------------------------------------
// Linux (X11 + Wayland)
// -----------------------------------------------------------------------------

async function hasClipboardImageLinux(): Promise<boolean> {
  try {
    // Try xclip first (X11), then wl-paste (Wayland)
    const result = await execShell(
      'xclip -selection clipboard -t TARGETS -o 2>/dev/null | grep -q "image/" || ' +
      'wl-paste -l 2>/dev/null | grep -q "image/"',
      { encoding: 'utf8' }
    );
    return true;
  } catch {
    return false;
  }
}

async function readClipboardImageLinux(): Promise<ClipboardImageResult | null> {
  // Try xclip (X11)
  try {
    const buffer = await execShell(
      'xclip -selection clipboard -t image/png -o 2>/dev/null'
    ) as Buffer;
    if (buffer.length > 0) {
      return { buffer, mediaType: 'image/png' };
    }
  } catch { /* try next */ }

  // Try wl-paste (Wayland)
  try {
    const buffer = await execShell(
      'wl-paste --type image/png 2>/dev/null'
    ) as Buffer;
    if (buffer.length > 0) {
      return { buffer, mediaType: 'image/png' };
    }
  } catch { /* no clipboard image available */ }

  return null;
}

// -----------------------------------------------------------------------------
// Windows
// -----------------------------------------------------------------------------

async function hasClipboardImageWin32(): Promise<boolean> {
  try {
    const result = await execCommand(
      'powershell',
      ['-NoProfile', '-Command', '(Get-Clipboard -Format Image) -ne $null'],
      { encoding: 'utf8' }
    ) as string;
    return result.trim() === 'True';
  } catch {
    return false;
  }
}

async function readClipboardImageWin32(): Promise<ClipboardImageResult | null> {
  const tempPath = createTempImagePath();
  try {
    await execCommand('powershell', [
      '-NoProfile',
      '-Command',
      `$img = Get-Clipboard -Format Image; if ($img) { $img.Save('${tempPath.replace(/'/g, "''")}') }`,
    ]);

    const buffer = readFileSync(tempPath);
    if (buffer.length === 0) return null;

    // PowerShell saves as BMP by default — detect and keep as-is
    // (consumers can convert if needed)
    const mediaType = detectMediaType(buffer);
    return { buffer, mediaType };
  } catch {
    return null;
  } finally {
    cleanupTempFile(tempPath);
  }
}

// =============================================================================
// Format Detection (magic bytes)
// =============================================================================

function detectMediaType(buffer: Buffer): string {
  if (buffer.length < 4) return 'image/png';

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'image/gif';
  }
  // BMP: 42 4D
  if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
    return 'image/bmp';
  }
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    if (buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return 'image/webp';
    }
  }

  return 'image/png'; // Default fallback
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Check if the system clipboard contains an image.
 * Fast check — does not read the image data.
 */
export async function hasClipboardImage(): Promise<boolean> {
  switch (process.platform) {
    case 'darwin': return hasClipboardImageDarwin();
    case 'linux': return hasClipboardImageLinux();
    case 'win32': return hasClipboardImageWin32();
    default: return false;
  }
}

/**
 * Read an image from the system clipboard.
 *
 * Returns the raw image buffer and MIME type, or null if no image is available.
 * Uses native OS tools — no npm dependencies required.
 *
 * Platform support:
 * - macOS: AppleScript (osascript)
 * - Linux: xclip (X11) or wl-paste (Wayland)
 * - Windows: PowerShell Get-Clipboard
 *
 * @example
 * const result = await readClipboardImage();
 * if (result) {
 *   console.log(result.mediaType); // 'image/png'
 *   console.log(result.buffer.length); // bytes
 * }
 */
export async function readClipboardImage(): Promise<ClipboardImageResult | null> {
  switch (process.platform) {
    case 'darwin': return readClipboardImageDarwin();
    case 'linux': return readClipboardImageLinux();
    case 'win32': return readClipboardImageWin32();
    default: return null;
  }
}
