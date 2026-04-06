/**
 * useImagePaste - Detect and load images from paste events
 *
 * Connects the paste detection system to the image loading pipeline:
 * 1. Detects image file paths in pasted text → loads via ffmpeg
 * 2. Detects empty bracketed paste (clipboard image) → reads from OS clipboard
 * 3. Delivers ready-to-render ImageData + TerminalImageSource
 */

import { usePaste } from './use-paste.js';
import { getAppContext } from './context.js';
import { extractImagePaths } from '../core/image-file.js';
import { loadImageFile, loadTerminalImageSourceFromFile } from '../core/image-file.js';
import { createTerminalImageSource, scaleImage, type ImageData, type TerminalImageSource } from '../core/graphics.js';
import { readClipboardImage } from '../core/clipboard-image.js';
import type { InputPriority } from './types.js';

// =============================================================================
// Types
// =============================================================================

export interface ImagePasteEvent {
  /** Raw RGBA pixel data ready for TerminalImage */
  imageData: ImageData;
  /** Pre-computed terminal image source (with cell size info) */
  source: TerminalImageSource;
  /** Original file path if loaded from a path paste */
  sourcePath?: string;
  /** MIME type of the original image */
  mediaType: string;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
}

export type ImagePasteHandler = (event: ImagePasteEvent) => void;

export interface UseImagePasteOptions {
  /** Whether the handler is active (default: true) */
  isActive?: boolean;
  /** Priority level for the paste handler (default: 'normal') */
  priority?: InputPriority;
  /** Maximum image width in pixels before scaling (default: 2000) */
  maxWidth?: number;
  /** Maximum image height in pixels before scaling (default: 2000) */
  maxHeight?: number;
}

// =============================================================================
// Implementation
// =============================================================================

const DEFAULT_MAX_WIDTH = 2000;
const DEFAULT_MAX_HEIGHT = 2000;

/**
 * Constrain image dimensions if they exceed max bounds.
 */
function constrainImage(imageData: ImageData, maxWidth: number, maxHeight: number): ImageData {
  let { width, height } = imageData;
  if (width <= maxWidth && height <= maxHeight) return imageData;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }
  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  return scaleImage(imageData, width, height);
}

/**
 * Write a buffer to a temp file and load it as ImageData via ffmpeg.
 */
async function imageDataFromBuffer(
  buffer: Buffer,
  mediaType: string,
): Promise<{ imageData: ImageData; mediaType: string } | null> {
  // Write buffer to temp file for ffmpeg to read
  const { writeFileSync, unlinkSync, mkdtempSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');

  const ext = mediaType.replace('image/', '') || 'png';
  const dir = mkdtempSync(join(tmpdir(), 'tuiuiu-img-'));
  const tempPath = join(dir, `clipboard.${ext}`);

  try {
    writeFileSync(tempPath, buffer);
    const imageData = await loadImageFile(tempPath);
    return { imageData, mediaType };
  } catch {
    return null;
  } finally {
    try { unlinkSync(tempPath); } catch { /* ignore */ }
  }
}

/**
 * useImagePaste - Detect and load images from paste events.
 *
 * Handles two paste scenarios:
 * 1. **File paths pasted** — Detects image extensions in pasted text,
 *    loads each file via ffmpeg, and emits ImagePasteEvent
 * 2. **Clipboard image** — When an empty bracketed paste is detected
 *    (common on macOS with Cmd+V of a screenshot), reads the system
 *    clipboard and loads the image
 *
 * @example
 * function App() {
 *   const [image, setImage] = useState<ImagePasteEvent | null>(null);
 *
 *   useImagePaste((event) => {
 *     setImage(event);
 *   });
 *
 *   return Box({},
 *     image()
 *       ? TerminalImage({ source: image().source, fit: 'contain' })
 *       : Text({}, 'Paste an image...')
 *   );
 * }
 */
export function useImagePaste(
  handler: ImagePasteHandler,
  options: UseImagePasteOptions = {},
): void {
  const {
    isActive = true,
    priority = 'normal',
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
  } = options;

  usePaste(
    (event) => {
      // Case 1: Pasted text contains image file paths
      const paths = extractImagePaths(event.text);
      if (paths.length > 0) {
        // Load each image asynchronously
        for (const imagePath of paths) {
          loadAndEmit(imagePath, handler, maxWidth, maxHeight);
        }
        return true; // Stop propagation — we're handling this paste
      }

      // Case 2: Empty bracketed paste → likely clipboard image (macOS Cmd+V)
      if (event.isBracketed && event.text.trim() === '') {
        loadFromClipboard(handler, maxWidth, maxHeight);
        return true;
      }

      // Not an image paste — let other paste handlers process it
      return;
    },
    { isActive, priority, stopPropagation: true },
  );
}

/**
 * Load an image from a file path and emit the event.
 */
function loadAndEmit(
  imagePath: string,
  handler: ImagePasteHandler,
  maxWidth: number,
  maxHeight: number,
): void {
  const appContext = getAppContext();

  loadTerminalImageSourceFromFile(imagePath)
    .then((source) => {
      let imageData: ImageData = {
        pixels: source.pixels,
        width: source.width,
        height: source.height,
      };

      // Constrain if needed
      imageData = constrainImage(imageData, maxWidth, maxHeight);
      const constrainedSource = createTerminalImageSource(imageData);

      const event: ImagePasteEvent = {
        imageData,
        source: constrainedSource,
        sourcePath: imagePath,
        mediaType: guessMediaType(imagePath),
        width: imageData.width,
        height: imageData.height,
      };

      // Emit within the app's update cycle
      if (appContext?.enqueueExternalUpdate) {
        appContext.enqueueExternalUpdate(() => handler(event));
      } else {
        handler(event);
      }
    })
    .catch(() => {
      // Silently ignore — file may not be a valid image
    });
}

/**
 * Read image from clipboard and emit the event.
 */
function loadFromClipboard(
  handler: ImagePasteHandler,
  maxWidth: number,
  maxHeight: number,
): void {
  const appContext = getAppContext();

  readClipboardImage()
    .then(async (result) => {
      if (!result) return;

      const loaded = await imageDataFromBuffer(result.buffer, result.mediaType);
      if (!loaded) return;

      let imageData = constrainImage(loaded.imageData, maxWidth, maxHeight);
      const source = createTerminalImageSource(imageData);

      const event: ImagePasteEvent = {
        imageData,
        source,
        mediaType: result.mediaType,
        width: imageData.width,
        height: imageData.height,
      };

      if (appContext?.enqueueExternalUpdate) {
        appContext.enqueueExternalUpdate(() => handler(event));
      } else {
        handler(event);
      }
    })
    .catch(() => {
      // Silently ignore clipboard errors
    });
}

/** Guess MIME type from file extension */
function guessMediaType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg': case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'webp': return 'image/webp';
    case 'bmp': return 'image/bmp';
    case 'svg': return 'image/svg+xml';
    case 'ico': return 'image/x-icon';
    case 'avif': return 'image/avif';
    case 'tif': case 'tiff': return 'image/tiff';
    default: return 'image/png';
  }
}
