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
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
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

/** Create a temporary file path for clipboard image */
function createTempImagePath(): { dir: string; file: string } {
  const dir = mkdtempSync(join(tmpdir(), 'tuiuiu-clip-'));
  return { dir, file: join(dir, 'clipboard.png') };
}

/** Safely remove the exact temporary directory created by this module. */
function cleanupTempImage(temp: { dir: string; file: string }): void {
  try { rmSync(temp.dir, { recursive: true, force: true }); } catch { /* ignore */ }
}

// -----------------------------------------------------------------------------
// macOS
// -----------------------------------------------------------------------------

async function hasClipboardImageDarwin(): Promise<boolean> {
  try {
    const result = await execCommand(
      'osascript',
      ['-e', 'clipboard info'],
      { encoding: 'utf8' },
    ) as string;
    return result.includes('PNGf');
  } catch {
    return false;
  }
}

async function readClipboardImageDarwin(): Promise<ClipboardImageResult | null> {
  const temp = createTempImagePath();
  try {
    const script = [
      'on run argv',
      'set png_data to (the clipboard as «class PNGf»)',
      'set fp to open for access POSIX file (item 1 of argv) with write permission',
      'try',
      'set eof fp to 0',
      'write png_data to fp',
      'on error message',
      'try',
      'close access fp',
      'end try',
      'error message',
      'end try',
      'close access fp',
      'end run',
    ].join('\n');
    await execCommand('osascript', ['-e', script, temp.file]);

    const buffer = readFileSync(temp.file);
    if (buffer.length === 0) return null;

    return { buffer, mediaType: 'image/png' };
  } catch {
    return null;
  } finally {
    cleanupTempImage(temp);
  }
}

// -----------------------------------------------------------------------------
// Linux (X11 + Wayland)
// -----------------------------------------------------------------------------

async function hasClipboardImageLinux(): Promise<boolean> {
  try {
    const targets = await execCommand(
      'xclip',
      ['-selection', 'clipboard', '-t', 'TARGETS', '-o'],
      { encoding: 'utf8' },
    ) as string;
    if (targets.includes('image/')) return true;
  } catch { /* try Wayland */ }
  try {
    const targets = await execCommand('wl-paste', ['-l'], { encoding: 'utf8' }) as string;
    return targets.includes('image/');
  } catch { return false; }
}

async function readClipboardImageLinux(): Promise<ClipboardImageResult | null> {
  // Try xclip (X11)
  try {
    const buffer = await execCommand(
      'xclip',
      ['-selection', 'clipboard', '-t', 'image/png', '-o'],
    ) as Buffer;
    if (buffer.length > 0) {
      return { buffer, mediaType: 'image/png' };
    }
  } catch { /* try next */ }

  // Try wl-paste (Wayland)
  try {
    const buffer = await execCommand('wl-paste', ['--type', 'image/png']) as Buffer;
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
  const temp = createTempImagePath();
  try {
    const script = [
      'param([string]$OutputPath)',
      '$img = Get-Clipboard -Format Image',
      'if ($null -ne $img) {',
      'try { $img.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png) }',
      'finally { $img.Dispose() }',
      '}',
    ].join('; ');
    await execCommand('powershell', [
      '-NoProfile',
      '-Command',
      script,
      temp.file,
    ]);

    const buffer = readFileSync(temp.file);
    if (buffer.length === 0) return null;

    // Verify the bytes instead of trusting the requested filename extension.
    const mediaType = detectMediaType(buffer);
    return { buffer, mediaType };
  } catch {
    return null;
  } finally {
    cleanupTempImage(temp);
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
