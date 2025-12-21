/**
 * Graphics Protocol Support
 *
 * Features:
 * - Kitty Graphics Protocol (modern, efficient)
 * - iTerm2 Inline Images
 * - Sixel (legacy, wide support)
 * - Braille fallback (universal)
 * - Auto-detection with manual override
 *
 * 
 */

// =============================================================================
// Types
// =============================================================================

export type GraphicsProtocol = 'kitty' | 'iterm2' | 'sixel' | 'braille' | 'none';

export interface ImageOptions {
  /** Width in cells (auto if not specified) */
  width?: number;
  /** Height in cells (auto if not specified) */
  height?: number;
  /** How to fit image in dimensions */
  fit?: 'contain' | 'cover' | 'fill' | 'none';
  /** Preserve aspect ratio */
  preserveAspectRatio?: boolean;
  /** Threshold for braille conversion (0-255) */
  threshold?: number;
  /** Enable dithering for braille */
  dither?: boolean;
}

export interface ImageData {
  /** Raw pixel data (RGBA) */
  pixels: Uint8Array;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
}

export interface ProtocolCapabilities {
  protocol: GraphicsProtocol;
  supportsTransparency: boolean;
  supportsAnimation: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

// =============================================================================
// Protocol Detection
// =============================================================================

let detectedProtocol: GraphicsProtocol | null = null;
let manualOverride: GraphicsProtocol | null = null;

/**
 * Detect the best available graphics protocol
 */
export function detectGraphicsProtocol(): GraphicsProtocol {
  // Manual override takes precedence
  if (manualOverride) {
    return manualOverride;
  }

  // Use cached detection
  if (detectedProtocol) {
    return detectedProtocol;
  }

  // Check environment variable override
  const envProtocol = process.env.TUIUIU_GRAPHICS?.toLowerCase();
  if (envProtocol && isValidProtocol(envProtocol)) {
    detectedProtocol = envProtocol as GraphicsProtocol;
    return detectedProtocol;
  }

  // Check terminal program
  const termProgram = process.env.TERM_PROGRAM?.toLowerCase() || '';
  const term = process.env.TERM?.toLowerCase() || '';
  const kittyWindowId = process.env.KITTY_WINDOW_ID;
  const wtSession = process.env.WT_SESSION; // Windows Terminal
  const iterm2Session = process.env.ITERM_SESSION_ID;

  // Kitty detection
  if (kittyWindowId || termProgram === 'kitty') {
    detectedProtocol = 'kitty';
    return detectedProtocol;
  }

  // iTerm2 detection
  if (iterm2Session || termProgram === 'iterm.app') {
    detectedProtocol = 'iterm2';
    return detectedProtocol;
  }

  // WezTerm supports Kitty protocol
  if (termProgram === 'wezterm') {
    detectedProtocol = 'kitty';
    return detectedProtocol;
  }

  // Windows Terminal supports iTerm2 protocol
  if (wtSession) {
    detectedProtocol = 'iterm2';
    return detectedProtocol;
  }

  // Check for Sixel support in TERM
  if (
    term.includes('xterm') ||
    term.includes('mlterm') ||
    term.includes('mintty') ||
    term.includes('foot')
  ) {
    // These terminals often support Sixel, but we'd need to query
    // For now, use braille as safe fallback
    detectedProtocol = 'braille';
    return detectedProtocol;
  }

  // Default to braille (universal fallback)
  detectedProtocol = 'braille';
  return detectedProtocol;
}

/**
 * Set graphics protocol manually (overrides auto-detection)
 */
export function setGraphicsProtocol(protocol: GraphicsProtocol | null): void {
  manualOverride = protocol;
}

/**
 * Get current graphics protocol
 */
export function getGraphicsProtocol(): GraphicsProtocol {
  return manualOverride || detectedProtocol || detectGraphicsProtocol();
}

/**
 * Get protocol capabilities
 */
export function getProtocolCapabilities(): ProtocolCapabilities {
  const protocol = getGraphicsProtocol();

  switch (protocol) {
    case 'kitty':
      return {
        protocol: 'kitty',
        supportsTransparency: true,
        supportsAnimation: true,
      };
    case 'iterm2':
      return {
        protocol: 'iterm2',
        supportsTransparency: true,
        supportsAnimation: false,
      };
    case 'sixel':
      return {
        protocol: 'sixel',
        supportsTransparency: false, // Limited transparency support
        supportsAnimation: false,
        maxWidth: 1024, // Typical limit
        maxHeight: 1024,
      };
    case 'braille':
      return {
        protocol: 'braille',
        supportsTransparency: false,
        supportsAnimation: false,
      };
    default:
      return {
        protocol: 'none',
        supportsTransparency: false,
        supportsAnimation: false,
      };
  }
}

function isValidProtocol(protocol: string): protocol is GraphicsProtocol {
  return ['kitty', 'iterm2', 'sixel', 'braille', 'none'].includes(protocol);
}

/**
 * Reset cached detection (for testing)
 */
export function resetGraphicsDetection(): void {
  detectedProtocol = null;
  manualOverride = null;
}

// =============================================================================
// Kitty Graphics Protocol
// =============================================================================

/**
 * Kitty Graphics Protocol implementation
 * https://sw.kovidgoyal.net/kitty/graphics-protocol/
 */
export const kittyGraphics = {
  /**
   * Transmit image data to terminal
   */
  transmit(imageData: ImageData, options: ImageOptions = {}): string {
    const { width, height, pixels } = imageData;

    // Calculate dimensions
    const cols = options.width || Math.ceil(width / 10); // ~10 pixels per cell
    const rows = options.height || Math.ceil(height / 20); // ~20 pixels per cell

    // Base64 encode PNG data (simplified - real implementation would encode PNG)
    const base64Data = base64Encode(pixels);

    // Chunk size (4096 bytes is safe)
    const CHUNK_SIZE = 4096;
    const chunks: string[] = [];

    for (let i = 0; i < base64Data.length; i += CHUNK_SIZE) {
      const chunk = base64Data.slice(i, i + CHUNK_SIZE);
      const isLast = i + CHUNK_SIZE >= base64Data.length;
      const more = isLast ? 0 : 1;

      if (i === 0) {
        // First chunk includes format info
        chunks.push(
          `\x1b_Ga=T,f=32,s=${width},v=${height},c=${cols},r=${rows},m=${more};${chunk}\x1b\\`
        );
      } else {
        // Continuation chunks
        chunks.push(`\x1b_Gm=${more};${chunk}\x1b\\`);
      }
    }

    return chunks.join('');
  },

  /**
   * Display a previously transmitted image
   */
  display(imageId: number, x: number, y: number): string {
    return `\x1b_Ga=p,i=${imageId},p=1,X=${x},Y=${y}\x1b\\`;
  },

  /**
   * Delete an image from memory
   */
  delete(imageId?: number): string {
    if (imageId !== undefined) {
      return `\x1b_Ga=d,d=i,i=${imageId}\x1b\\`;
    }
    // Delete all images
    return `\x1b_Ga=d,d=A\x1b\\`;
  },

  /**
   * Clear all images from screen
   */
  clear(): string {
    return `\x1b_Ga=d,d=A\x1b\\`;
  },
};

// =============================================================================
// iTerm2 Inline Images
// =============================================================================

/**
 * iTerm2 Inline Images Protocol
 * https://iterm2.com/documentation-images.html
 */
export const iterm2Graphics = {
  /**
   * Display an image
   */
  display(imageData: ImageData, options: ImageOptions = {}): string {
    const { width: imgWidth, height: imgHeight, pixels } = imageData;

    // Calculate dimensions
    const width = options.width ? `width=${options.width}` : 'width=auto';
    const height = options.height ? `height=${options.height}` : 'height=auto';

    // Base64 encode
    const base64Data = base64Encode(pixels);

    // iTerm2 OSC 1337 sequence
    return `\x1b]1337;File=inline=1;${width};${height}:${base64Data}\x07`;
  },

  /**
   * Display image from file path (if accessible to terminal)
   */
  displayFile(path: string, options: ImageOptions = {}): string {
    const width = options.width ? `width=${options.width}` : 'width=auto';
    const height = options.height ? `height=${options.height}` : 'height=auto';

    // Base64 encode the path
    const encodedPath = Buffer.from(path).toString('base64');

    return `\x1b]1337;File=inline=1;${width};${height}:${encodedPath}\x07`;
  },
};

// =============================================================================
// Sixel Graphics
// =============================================================================

/**
 * Sixel Graphics implementation
 * https://en.wikipedia.org/wiki/Sixel
 */
export const sixelGraphics = {
  /**
   * Encode image as Sixel
   */
  encode(imageData: ImageData, options: ImageOptions = {}): string {
    const { width, height, pixels } = imageData;

    // Build palette (up to 256 colors)
    const palette = buildPalette(pixels, 256);

    // Start DCS sequence
    let output = '\x1bPq';

    // Define palette
    for (let i = 0; i < palette.length; i++) {
      const [r, g, b] = palette[i];
      // Sixel uses 0-100 range
      const sr = Math.round((r / 255) * 100);
      const sg = Math.round((g / 255) * 100);
      const sb = Math.round((b / 255) * 100);
      output += `#${i};2;${sr};${sg};${sb}`;
    }

    // Encode pixels (6 rows at a time = 1 sixel row)
    for (let y = 0; y < height; y += 6) {
      for (let c = 0; c < palette.length; c++) {
        let hasColor = false;
        let colorData = `#${c}`;

        for (let x = 0; x < width; x++) {
          let sixel = 0;

          for (let row = 0; row < 6; row++) {
            const py = y + row;
            if (py >= height) continue;

            const idx = (py * width + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];

            const colorIdx = findClosestColor([r, g, b], palette);
            if (colorIdx === c) {
              sixel |= 1 << row;
              hasColor = true;
            }
          }

          colorData += String.fromCharCode(63 + sixel);
        }

        if (hasColor) {
          output += colorData + '$'; // Carriage return
        }
      }
      output += '-'; // New sixel row
    }

    // End DCS sequence
    output += '\x1b\\';

    return output;
  },
};

// =============================================================================
// Braille Graphics (Universal Fallback)
// =============================================================================

/**
 * Unicode Braille character mapping
 *
 * Braille dots are arranged:
 * 1 4
 * 2 5
 * 3 6
 * 7 8
 *
 * Each character represents 2x4 pixels
 */
const BRAILLE_OFFSET = 0x2800;

/**
 * Braille Graphics implementation
 */
export const brailleGraphics = {
  /**
   * Convert image to braille characters
   */
  render(imageData: ImageData, options: ImageOptions = {}): string {
    const { width, height, pixels } = imageData;
    const threshold = options.threshold ?? 128;
    const dither = options.dither ?? false;

    // Calculate output dimensions (2x4 pixels per character)
    const outWidth = Math.ceil(width / 2);
    const outHeight = Math.ceil(height / 4);

    // Grayscale conversion buffer
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = pixels[i * 4];
      const g = pixels[i * 4 + 1];
      const b = pixels[i * 4 + 2];
      gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // Apply Floyd-Steinberg dithering if enabled
    if (dither) {
      floydSteinbergDither(gray, width, height);
    }

    // Build output
    const lines: string[] = [];

    for (let cy = 0; cy < outHeight; cy++) {
      let line = '';

      for (let cx = 0; cx < outWidth; cx++) {
        let braille = 0;

        // Map 2x4 pixel block to braille dots
        const dotMap = [
          [0, 0, 0], // dot 1
          [0, 1, 1], // dot 2
          [0, 2, 2], // dot 3
          [1, 0, 3], // dot 4
          [1, 1, 4], // dot 5
          [1, 2, 5], // dot 6
          [0, 3, 6], // dot 7
          [1, 3, 7], // dot 8
        ];

        for (const [dx, dy, bit] of dotMap) {
          const px = cx * 2 + dx;
          const py = cy * 4 + dy;

          if (px < width && py < height) {
            const idx = py * width + px;
            if (gray[idx] < threshold) {
              braille |= 1 << bit;
            }
          }
        }

        line += String.fromCharCode(BRAILLE_OFFSET + braille);
      }

      lines.push(line);
    }

    return lines.join('\n');
  },

  /**
   * Invert braille output (light on dark vs dark on light)
   */
  invert(brailleText: string): string {
    let result = '';
    for (const char of brailleText) {
      if (char === '\n') {
        result += char;
        continue;
      }

      const code = char.charCodeAt(0);
      if (code >= BRAILLE_OFFSET && code < BRAILLE_OFFSET + 256) {
        // Invert all 8 bits
        const inverted = BRAILLE_OFFSET + (255 - (code - BRAILLE_OFFSET));
        result += String.fromCharCode(inverted);
      } else {
        result += char;
      }
    }
    return result;
  },
};

// =============================================================================
// Unified Image Rendering
// =============================================================================

/**
 * Render an image using the best available protocol
 */
export function renderImage(imageData: ImageData, options: ImageOptions = {}): string {
  const protocol = getGraphicsProtocol();

  switch (protocol) {
    case 'kitty':
      return kittyGraphics.transmit(imageData, options);
    case 'iterm2':
      return iterm2Graphics.display(imageData, options);
    case 'sixel':
      return sixelGraphics.encode(imageData, options);
    case 'braille':
      return brailleGraphics.render(imageData, options);
    default:
      return brailleGraphics.render(imageData, options);
  }
}

/**
 * Clear all displayed images
 */
export function clearImages(): string {
  const protocol = getGraphicsProtocol();

  switch (protocol) {
    case 'kitty':
      return kittyGraphics.clear();
    case 'iterm2':
      return ''; // iTerm2 doesn't have a clear command
    case 'sixel':
      return ''; // Sixel images are just text
    case 'braille':
      return ''; // Braille is just text
    default:
      return '';
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Base64 encode bytes
 */
function base64Encode(data: Uint8Array): string {
  return Buffer.from(data).toString('base64');
}

/**
 * Build a color palette from image data
 */
function buildPalette(pixels: Uint8Array, maxColors: number): [number, number, number][] {
  // Simple median cut algorithm
  const colors: Map<string, number> = new Map();

  for (let i = 0; i < pixels.length; i += 4) {
    const key = `${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`;
    colors.set(key, (colors.get(key) || 0) + 1);
  }

  // Sort by frequency and take top colors
  const sorted = Array.from(colors.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors);

  return sorted.map(([key]) => {
    const [r, g, b] = key.split(',').map(Number);
    return [r, g, b] as [number, number, number];
  });
}

/**
 * Find closest color in palette
 */
function findClosestColor(
  color: [number, number, number],
  palette: [number, number, number][]
): number {
  let bestIdx = 0;
  let bestDist = Infinity;

  for (let i = 0; i < palette.length; i++) {
    const [pr, pg, pb] = palette[i];
    const dr = color[0] - pr;
    const dg = color[1] - pg;
    const db = color[2] - pb;
    const dist = dr * dr + dg * dg + db * db;

    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  return bestIdx;
}

/**
 * Floyd-Steinberg dithering
 */
function floydSteinbergDither(gray: Float32Array, width: number, height: number): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldValue = gray[idx];
      const newValue = oldValue < 128 ? 0 : 255;
      gray[idx] = newValue;

      const error = oldValue - newValue;

      // Distribute error to neighbors
      if (x + 1 < width) {
        gray[idx + 1] += (error * 7) / 16;
      }
      if (y + 1 < height) {
        if (x > 0) {
          gray[idx + width - 1] += (error * 3) / 16;
        }
        gray[idx + width] += (error * 5) / 16;
        if (x + 1 < width) {
          gray[idx + width + 1] += (error * 1) / 16;
        }
      }
    }
  }
}

// =============================================================================
// Image Loading Utilities
// =============================================================================

/**
 * Create image data from RGBA pixel array
 */
export function createImageData(
  pixels: Uint8Array | number[],
  width: number,
  height: number
): ImageData {
  return {
    pixels: pixels instanceof Uint8Array ? pixels : new Uint8Array(pixels),
    width,
    height,
  };
}

/**
 * Create a solid color image
 */
export function createSolidImage(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number,
  a = 255
): ImageData {
  const pixels = new Uint8Array(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    pixels[i * 4] = r;
    pixels[i * 4 + 1] = g;
    pixels[i * 4 + 2] = b;
    pixels[i * 4 + 3] = a;
  }

  return { pixels, width, height };
}

/**
 * Create a gradient image (for testing)
 */
export function createGradientImage(width: number, height: number): ImageData {
  const pixels = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      pixels[i] = Math.floor((x / width) * 255); // R
      pixels[i + 1] = Math.floor((y / height) * 255); // G
      pixels[i + 2] = 128; // B
      pixels[i + 3] = 255; // A
    }
  }

  return { pixels, width, height };
}

/**
 * Scale image data (nearest neighbor)
 */
export function scaleImage(
  imageData: ImageData,
  newWidth: number,
  newHeight: number
): ImageData {
  const { width, height, pixels } = imageData;
  const scaled = new Uint8Array(newWidth * newHeight * 4);

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcX = Math.floor((x / newWidth) * width);
      const srcY = Math.floor((y / newHeight) * height);
      const srcIdx = (srcY * width + srcX) * 4;
      const dstIdx = (y * newWidth + x) * 4;

      scaled[dstIdx] = pixels[srcIdx];
      scaled[dstIdx + 1] = pixels[srcIdx + 1];
      scaled[dstIdx + 2] = pixels[srcIdx + 2];
      scaled[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }

  return { pixels: scaled, width: newWidth, height: newHeight };
}
