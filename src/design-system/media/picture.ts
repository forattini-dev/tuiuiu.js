/**
 * Picture Component - Display ASCII art and character-based images
 *
 * Use this for:
 * - ASCII art logos and graphics
 * - Splash screens
 * - Character-based images (including colored pixel art)
 * - Decorative elements
 */

import { Box, Text } from '../../primitives/nodes.js';
import { colorize, stringWidth } from '../../utils/text-utils.js';
import type { VNode } from '../../utils/types.js';

// =============================================================================
// COLORED PIXEL ART SUPPORT
// =============================================================================

/**
 * A single pixel with character and optional colors
 */
export interface Pixel {
  /** The character to display */
  char: string;
  /** Foreground color (supports named colors, hex, rgb) */
  fg?: string;
  /** Background color */
  bg?: string;
}

/**
 * A 2D pixel grid for colored ASCII art
 */
export type PixelGrid = Pixel[][];

/**
 * Color palette for mapping characters to colors
 */
export type ColorPalette = Record<string, { fg?: string; bg?: string }>;

/**
 * Create a pixel grid from source and color palette
 *
 * @example
 * ```typescript
 * const art = `
 * RRR
 * GGG
 * BBB
 * `;
 *
 * const palette = {
 *   'R': { fg: 'red' },
 *   'G': { fg: 'green' },
 *   'B': { fg: 'blue' },
 * };
 *
 * const grid = createPixelGrid(art, palette);
 * ```
 */
export function createPixelGrid(source: string, palette: ColorPalette): PixelGrid {
  const lines = source.split('\n').filter(line => line.length > 0);
  const grid: PixelGrid = [];

  for (const line of lines) {
    const row: Pixel[] = [];
    for (const char of line) {
      const colors = palette[char];
      row.push({
        char,
        fg: colors?.fg,
        bg: colors?.bg,
      });
    }
    grid.push(row);
  }

  return grid;
}

/**
 * Create a pixel grid from a simple color map
 * Each cell can be a color name, and we use a block character
 *
 * @example
 * ```typescript
 * const colorMap = [
 *   ['red', 'red', 'red'],
 *   ['green', 'green', 'green'],
 *   ['blue', 'blue', 'blue'],
 * ];
 *
 * const grid = createPixelGridFromColors(colorMap);
 * ```
 */
export function createPixelGridFromColors(
  colors: (string | null)[][],
  char = '█'
): PixelGrid {
  return colors.map(row =>
    row.map(color => ({
      char: color ? char : ' ',
      fg: color || undefined,
    }))
  );
}

/**
 * Parse BBCode colored ASCII art format to PixelGrid
 *
 * Input format: [color=#hex]char[/color][color=#hex]char[/color]...
 *
 * Useful for importing colored ASCII art from text-to-ASCII generators.
 */
export function parseColoredBBCode(bbcode: string): PixelGrid {
  const lines = bbcode.split('\n');
  const result: PixelGrid = [];

  // Regex to match [color=#hex]char(s)[/color] pattern
  const colorPattern = /\[color=(#[0-9a-fA-F]{6})\]([^[]*)\[\/color\]/g;

  for (const line of lines) {
    const pixelRow: Pixel[] = [];
    let match: RegExpExecArray | null;

    // Reset lastIndex for each line
    colorPattern.lastIndex = 0;

    while ((match = colorPattern.exec(line)) !== null) {
      const [, color, chars] = match;
      // Handle multi-character matches
      for (const char of chars) {
        pixelRow.push({ char, fg: color! });
      }
    }

    // Only add non-empty lines
    if (pixelRow.length > 0) {
      result.push(pixelRow);
    }
  }

  return result;
}

/**
 * Render a pixel grid to an ANSI string
 */
export function renderPixelGrid(grid: PixelGrid): string {
  const lines: string[] = [];

  for (const row of grid) {
    let line = '';
    for (const pixel of row) {
      if (pixel.fg) {
        // Apply foreground color
        let colored = colorize(pixel.char, pixel.fg, 'foreground');
        // Apply background if present
        if (pixel.bg) {
          colored = colorize(colored, pixel.bg, 'background');
        }
        line += colored;
      } else if (pixel.bg) {
        line += colorize(pixel.char, pixel.bg, 'background');
      } else {
        line += pixel.char;
      }
    }
    lines.push(line);
  }

  return lines.join('\n');
}

/**
 * How the picture should fit within its container
 */
export type PictureFit =
  | 'none'      // No scaling, show at original size
  | 'contain'   // Scale to fit, maintain aspect ratio, may have empty space
  | 'cover'     // Scale to cover, maintain aspect ratio, may crop
  | 'fill'      // Stretch to fill, may distort
  | 'crop';     // Crop to fit, no scaling

/**
 * Horizontal alignment within container
 */
export type PictureAlignX = 'left' | 'center' | 'right';

/**
 * Vertical alignment within container
 */
export type PictureAlignY = 'top' | 'center' | 'bottom';

export interface PictureProps {
  /** The ASCII art content (string with newlines or array of strings) */
  source: string | string[];

  /** Fixed width (characters). If not set, uses source width */
  width?: number;

  /** Fixed height (lines). If not set, uses source height */
  height?: number;

  /** How to fit the picture in the container */
  fit?: PictureFit;

  /** Horizontal alignment */
  alignX?: PictureAlignX;

  /** Vertical alignment */
  alignY?: PictureAlignY;

  /** Foreground color */
  color?: string;

  /** Background color */
  backgroundColor?: string;

  /** Character to treat as transparent (won't be rendered) */
  transparent?: string;

  /** Border style */
  borderStyle?: 'none' | 'single' | 'double' | 'round' | 'bold';

  /** Border color */
  borderColor?: string;

  /** Padding inside the picture frame */
  padding?: number;

  /** Whether to preserve colors in source (ANSI codes) */
  preserveColors?: boolean;
}

/**
 * Parse source into lines
 */
function parseSource(source: string | string[]): string[] {
  if (Array.isArray(source)) {
    return source;
  }
  return source.split('\n');
}

/**
 * Get the dimensions of the source
 */
function getSourceDimensions(lines: string[]): { width: number; height: number } {
  const height = lines.length;
  let width = 0;
  for (const line of lines) {
    // Use stringWidth for accurate width with emojis and wide chars
    const lineWidth = stringWidth(line);
    if (lineWidth > width) {
      width = lineWidth;
    }
  }
  return { width, height };
}

/**
 * Pad a line to a specific width
 */
function padLine(line: string, targetWidth: number, align: PictureAlignX): string {
  const currentWidth = stringWidth(line);

  if (currentWidth >= targetWidth) {
    return line;
  }

  const padding = targetWidth - currentWidth;

  switch (align) {
    case 'left':
      return line + ' '.repeat(padding);
    case 'right':
      return ' '.repeat(padding) + line;
    case 'center': {
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      return ' '.repeat(leftPad) + line + ' '.repeat(rightPad);
    }
  }
}

/**
 * Crop a line to a specific width (ANSI-aware)
 */
function cropLine(line: string, targetWidth: number, align: PictureAlignX): string {
  const currentWidth = stringWidth(line);

  if (currentWidth <= targetWidth) {
    return line;
  }

  // For cropping with wide characters, we need to iterate carefully
  // Strip ANSI for cropping, then apply
  const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
  const excess = currentWidth - targetWidth;

  // For simplicity with wide chars, we'll use a character-by-character approach
  let result = '';
  let width = 0;
  let startOffset = 0;

  if (align === 'right') {
    startOffset = excess;
  } else if (align === 'center') {
    startOffset = Math.floor(excess / 2);
  }

  let skippedWidth = 0;
  for (const char of cleanLine) {
    const charWidth = stringWidth(char);
    if (skippedWidth < startOffset) {
      skippedWidth += charWidth;
      continue;
    }
    if (width + charWidth > targetWidth) {
      break;
    }
    result += char;
    width += charWidth;
  }

  return result;
}

/**
 * Process lines to fit target dimensions
 */
function processLines(
  lines: string[],
  targetWidth: number,
  targetHeight: number,
  fit: PictureFit,
  alignX: PictureAlignX,
  alignY: PictureAlignY
): string[] {
  const { width: srcWidth, height: srcHeight } = getSourceDimensions(lines);

  // Handle vertical alignment and sizing
  let processedLines: string[] = [...lines];

  // Adjust height
  if (processedLines.length < targetHeight) {
    const padding = targetHeight - processedLines.length;
    const emptyLine = '';

    switch (alignY) {
      case 'top':
        processedLines = [...processedLines, ...Array(padding).fill(emptyLine)];
        break;
      case 'bottom':
        processedLines = [...Array(padding).fill(emptyLine), ...processedLines];
        break;
      case 'center': {
        const topPad = Math.floor(padding / 2);
        const bottomPad = padding - topPad;
        processedLines = [
          ...Array(topPad).fill(emptyLine),
          ...processedLines,
          ...Array(bottomPad).fill(emptyLine),
        ];
        break;
      }
    }
  } else if (processedLines.length > targetHeight && (fit === 'crop' || fit === 'cover')) {
    const excess = processedLines.length - targetHeight;

    switch (alignY) {
      case 'top':
        processedLines = processedLines.slice(0, targetHeight);
        break;
      case 'bottom':
        processedLines = processedLines.slice(excess);
        break;
      case 'center': {
        const start = Math.floor(excess / 2);
        processedLines = processedLines.slice(start, start + targetHeight);
        break;
      }
    }
  }

  // Adjust width for each line
  processedLines = processedLines.map(line => {
    const lineWidth = stringWidth(line);

    if (lineWidth < targetWidth) {
      return padLine(line, targetWidth, alignX);
    } else if (lineWidth > targetWidth && (fit === 'crop' || fit === 'cover')) {
      return cropLine(line, targetWidth, alignX);
    }
    return padLine(line, targetWidth, alignX);
  });

  return processedLines;
}

/**
 * Apply transparency to lines
 */
function applyTransparency(lines: string[], transparentChar: string): string[] {
  return lines.map(line => {
    // Replace transparent characters with spaces
    // This is a simple implementation - could be enhanced for true transparency
    return line.split('').map(char => char === transparentChar ? ' ' : char).join('');
  });
}

/**
 * Picture - Display ASCII art and character-based images
 *
 * @example
 * ```typescript
 * // Simple ASCII art
 * Picture({
 *   source: `
 *     ╭─────╮
 *     │ HI! │
 *     ╰─────╯
 *   `,
 *   color: 'cyan',
 * })
 *
 * // Logo with fixed size
 * Picture({
 *   source: LOGO_ART,
 *   width: 40,
 *   height: 10,
 *   fit: 'contain',
 *   alignX: 'center',
 *   alignY: 'center',
 * })
 *
 * // Splash screen
 * Picture({
 *   source: SPLASH_ART,
 *   width: process.stdout.columns,
 *   height: process.stdout.rows,
 *   fit: 'contain',
 *   alignX: 'center',
 *   alignY: 'center',
 *   color: 'magenta',
 * })
 * ```
 */
export function Picture(props: PictureProps): VNode {
  const {
    source,
    width,
    height,
    fit = 'none',
    alignX = 'left',
    alignY = 'top',
    color,
    backgroundColor,
    transparent,
    borderStyle,
    borderColor,
    padding = 0,
    preserveColors = false,
  } = props;

  // Parse source into lines
  let lines = parseSource(source);

  // Remove leading/trailing empty lines from source
  while (lines.length > 0 && lines[0].trim() === '') {
    lines.shift();
  }
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  // Get source dimensions
  const { width: srcWidth, height: srcHeight } = getSourceDimensions(lines);

  // Calculate target dimensions
  const targetWidth = width ?? srcWidth;
  const targetHeight = height ?? srcHeight;

  // Process lines to fit target dimensions
  lines = processLines(lines, targetWidth, targetHeight, fit, alignX, alignY);

  // Apply transparency if specified
  if (transparent) {
    lines = applyTransparency(lines, transparent);
  }

  // Build the picture content
  const content = lines.map((line, index) =>
    Text(
      {
        color: preserveColors ? undefined : color,
        backgroundColor,
      },
      line
    )
  );

  // Wrap in Box if border or padding is needed
  if (borderStyle || padding > 0) {
    return Box(
      {
        flexDirection: 'column',
        borderStyle: borderStyle === 'none' ? undefined : borderStyle,
        borderColor,
        padding,
        width: borderStyle ? targetWidth + 2 + padding * 2 : undefined,
        height: borderStyle ? targetHeight + 2 + padding * 2 : undefined,
      },
      ...content
    );
  }

  // Simple case: just return the lines in a column
  return Box(
    {
      flexDirection: 'column',
      width: targetWidth,
      height: targetHeight,
    },
    ...content
  );
}

/**
 * Create a framed picture with a title
 */
export interface FramedPictureProps extends PictureProps {
  /** Title to display at the top of the frame */
  title?: string;

  /** Title color */
  titleColor?: string;
}

/**
 * FramedPicture - Picture with a decorative frame and optional title
 *
 * @example
 * ```typescript
 * FramedPicture({
 *   source: LOGO_ART,
 *   title: ' My App ',
 *   titleColor: 'cyan',
 *   borderStyle: 'double',
 *   borderColor: 'gray',
 * })
 * ```
 */
export function FramedPicture(props: FramedPictureProps): VNode {
  const {
    title,
    titleColor = 'white',
    borderStyle = 'single',
    borderColor = 'gray',
    ...pictureProps
  } = props;

  // For framed picture, we always want a border
  return Box(
    {
      flexDirection: 'column',
      borderStyle,
      borderColor,
    },
    title
      ? Box(
          { flexDirection: 'row' },
          Text({ color: titleColor, bold: true }, title)
        )
      : null,
    Picture({ ...pictureProps, borderStyle: 'none' })
  );
}

// =============================================================================
// PRE-MADE ASCII ART ELEMENTS
// =============================================================================

/**
 * Common ASCII art patterns
 */
export const AsciiPatterns = {
  /** Horizontal line */
  hline: (width: number, char = '─') => char.repeat(width),

  /** Vertical line */
  vline: (height: number, char = '│') => Array(height).fill(char).join('\n'),

  /** Box */
  box: (width: number, height: number, style: 'single' | 'double' = 'single') => {
    const chars = style === 'single'
      ? { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' }
      : { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' };

    const top = chars.tl + chars.h.repeat(width - 2) + chars.tr;
    const middle = chars.v + ' '.repeat(width - 2) + chars.v;
    const bottom = chars.bl + chars.h.repeat(width - 2) + chars.br;

    return [top, ...Array(height - 2).fill(middle), bottom].join('\n');
  },

  /** Diamond shape */
  diamond: (size: number) => {
    const lines: string[] = [];
    const half = Math.floor(size / 2);

    for (let i = 0; i <= half; i++) {
      const spaces = ' '.repeat(half - i);
      const stars = '◆'.repeat(i * 2 + 1);
      lines.push(spaces + stars);
    }
    for (let i = half - 1; i >= 0; i--) {
      const spaces = ' '.repeat(half - i);
      const stars = '◆'.repeat(i * 2 + 1);
      lines.push(spaces + stars);
    }

    return lines.join('\n');
  },

  /** Arrow pointing right */
  arrowRight: `
   ▶
  ▶▶▶
 ▶▶▶▶▶
  ▶▶▶
   ▶
`.trim(),

  /** Arrow pointing left */
  arrowLeft: `
   ◀
  ◀◀◀
 ◀◀◀◀◀
  ◀◀◀
   ◀
`.trim(),

  /** Star */
  star: `
    ★
   ★★★
  ★★★★★
   ★★★
    ★
`.trim(),

  /** Heart */
  heart: `
 ♥♥   ♥♥
♥♥♥♥ ♥♥♥♥
 ♥♥♥♥♥♥♥
  ♥♥♥♥♥
   ♥♥♥
    ♥
`.trim(),

  /** Checkmark */
  checkmark: `
      ✓
     ✓
✓   ✓
 ✓ ✓
  ✓
`.trim(),

  /** Cross/X */
  cross: `
✗     ✗
 ✗   ✗
  ✗ ✗
   ✗
  ✗ ✗
 ✗   ✗
✗     ✗
`.trim(),
};

/**
 * Generate a simple text banner
 */
export function createBanner(
  text: string,
  style: 'simple' | 'box' | 'double' = 'simple'
): string {
  const width = stringWidth(text) + 4;

  switch (style) {
    case 'simple':
      return `
${'═'.repeat(width)}
  ${text}
${'═'.repeat(width)}
`.trim();

    case 'box':
      return `
┌${'─'.repeat(width - 2)}┐
│ ${text} │
└${'─'.repeat(width - 2)}┘
`.trim();

    case 'double':
      return `
╔${'═'.repeat(width - 2)}╗
║ ${text} ║
╚${'═'.repeat(width - 2)}╝
`.trim();
  }
}

// =============================================================================
// COLORED PICTURE COMPONENT
// =============================================================================

export interface ColoredPictureProps {
  /** Pixel grid to render */
  pixels: PixelGrid;

  /** Fixed width (will pad/crop if needed) */
  width?: number;

  /** Fixed height (will pad/crop if needed) */
  height?: number;

  /** Horizontal alignment */
  alignX?: PictureAlignX;

  /** Vertical alignment */
  alignY?: PictureAlignY;

  /** Border style */
  borderStyle?: 'none' | 'single' | 'double' | 'round' | 'bold';

  /** Border color */
  borderColor?: string;

  /** Padding */
  padding?: number;
}

/**
 * ColoredPicture - Display colored pixel art
 *
 * @example
 * ```typescript
 * // Using palette
 * const grid = createPixelGrid(`
 * RRRGGGBBB
 * RRRGGGBBB
 * RRRGGGBBB
 * `, {
 *   'R': { fg: 'red' },
 *   'G': { fg: 'green' },
 *   'B': { fg: 'blue' },
 * });
 *
 * ColoredPicture({ pixels: grid })
 *
 * // Using color map
 * const colors = [
 *   ['red', 'green', 'blue'],
 *   ['yellow', 'magenta', 'cyan'],
 * ];
 * const grid2 = createPixelGridFromColors(colors);
 *
 * ColoredPicture({ pixels: grid2 })
 * ```
 */
export function ColoredPicture(props: ColoredPictureProps): VNode {
  const {
    pixels,
    width,
    height,
    alignX = 'left',
    alignY = 'top',
    borderStyle,
    borderColor,
    padding = 0,
  } = props;

  // Get grid dimensions
  const gridHeight = pixels.length;
  const gridWidth = pixels.length > 0
    ? Math.max(...pixels.map(row => row.length))
    : 0;

  const targetWidth = width ?? gridWidth;
  const targetHeight = height ?? gridHeight;

  // Render each row
  const rows: VNode[] = [];

  for (let y = 0; y < targetHeight; y++) {
    // Calculate source row based on alignment
    let srcY = y;
    if (alignY === 'center') {
      srcY = y - Math.floor((targetHeight - gridHeight) / 2);
    } else if (alignY === 'bottom') {
      srcY = y - (targetHeight - gridHeight);
    }

    const row = pixels[srcY];

    if (!row) {
      // Empty row (outside grid)
      rows.push(Text({}, ' '.repeat(targetWidth)));
      continue;
    }

    // Build row content with colors
    let rowContent = '';

    for (let x = 0; x < targetWidth; x++) {
      // Calculate source column based on alignment
      let srcX = x;
      if (alignX === 'center') {
        srcX = x - Math.floor((targetWidth - row.length) / 2);
      } else if (alignX === 'right') {
        srcX = x - (targetWidth - row.length);
      }

      const pixel = row[srcX];

      if (!pixel) {
        rowContent += ' ';
      } else if (pixel.fg) {
        let colored = colorize(pixel.char, pixel.fg, 'foreground');
        if (pixel.bg) {
          colored = colorize(colored, pixel.bg, 'background');
        }
        rowContent += colored;
      } else if (pixel.bg) {
        rowContent += colorize(pixel.char, pixel.bg, 'background');
      } else {
        rowContent += pixel.char;
      }
    }

    rows.push(Text({}, rowContent));
  }

  // Wrap in Box
  if (borderStyle || padding > 0) {
    return Box(
      {
        flexDirection: 'column',
        borderStyle: borderStyle === 'none' ? undefined : borderStyle,
        borderColor,
        padding,
        width: targetWidth + (borderStyle && borderStyle !== 'none' ? 2 : 0) + padding * 2,
      },
      ...rows
    );
  }

  return Box(
    { flexDirection: 'column', width: targetWidth },
    ...rows
  );
}

// =============================================================================
// SPRITE SUPPORT - For animations and games
// =============================================================================

/**
 * A sprite is a collection of frames (pixel grids)
 */
export interface Sprite {
  /** Name of the sprite */
  name: string;
  /** Frames of animation */
  frames: PixelGrid[];
  /** Current frame index */
  currentFrame: number;
  /** Frame duration in ms (for animation) */
  frameDuration?: number;
}

/**
 * Create a sprite from multiple sources
 */
export function createSprite(
  name: string,
  sources: string[],
  palette: ColorPalette,
  frameDuration = 100
): Sprite {
  return {
    name,
    frames: sources.map(src => createPixelGrid(src, palette)),
    currentFrame: 0,
    frameDuration,
  };
}

/**
 * Get the current frame of a sprite as a pixel grid
 */
export function getSpriteFrame(sprite: Sprite): PixelGrid {
  return sprite.frames[sprite.currentFrame] || sprite.frames[0];
}

/**
 * Advance sprite to next frame
 */
export function nextSpriteFrame(sprite: Sprite): Sprite {
  return {
    ...sprite,
    currentFrame: (sprite.currentFrame + 1) % sprite.frames.length,
  };
}

// =============================================================================
// GRADIENT AND EFFECTS
// =============================================================================

/**
 * Color gradient definition
 */
export type GradientStop = { position: number; color: string };

/**
 * Create a horizontal gradient bar
 */
export function createGradientBar(
  width: number,
  stops: GradientStop[],
  char = '█'
): string {
  if (stops.length === 0) return char.repeat(width);
  if (stops.length === 1) return colorize(char.repeat(width), stops[0].color);

  // Sort stops by position
  const sortedStops = [...stops].sort((a, b) => a.position - b.position);

  let result = '';
  for (let i = 0; i < width; i++) {
    const position = i / (width - 1);

    // Find the two stops we're between
    let startStop = sortedStops[0];
    let endStop = sortedStops[sortedStops.length - 1];

    for (let j = 0; j < sortedStops.length - 1; j++) {
      if (position >= sortedStops[j].position && position <= sortedStops[j + 1].position) {
        startStop = sortedStops[j];
        endStop = sortedStops[j + 1];
        break;
      }
    }

    // Use the start stop color (simple implementation)
    // A more advanced version would interpolate colors
    const color = position < 0.5 ? startStop.color : endStop.color;
    result += colorize(char, color);
  }

  return result;
}

/**
 * Create a rainbow text effect
 */
export function rainbowText(text: string): string {
  const colors = ['red', 'yellow', 'green', 'cyan', 'blue', 'magenta'];
  let result = '';

  for (let i = 0; i < text.length; i++) {
    const color = colors[i % colors.length];
    result += colorize(text[i], color);
  }

  return result;
}

/**
 * Create a shadow effect (duplicate text offset and dimmed)
 */
export function createShadowedText(
  text: string,
  color: string,
  shadowColor = 'gray'
): string[] {
  const lines = text.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    // Shadow line (offset by 1)
    result.push(' ' + colorize(line, shadowColor));
  }

  // Now overlay the main text
  const mainLines = lines.map(line => colorize(line, color));

  // Combine (simplified - just returns both)
  return [...result.slice(0, -1), ...mainLines];
}

// =============================================================================
// ANIMATED PICTURE - Pulse, Breathe, and more animations
// =============================================================================

/**
 * Supported picture animations
 */
export type PictureAnimation =
  | 'none'
  | 'pulse'      // Fast brightness oscillation
  | 'breathe'    // Slow, smooth breathing effect
  | 'blink'      // On/off blinking
  | 'fadeIn'     // Fade from dim to bright
  | 'fadeOut'    // Fade from bright to dim
  | 'glow'       // Subtle pulsing glow
  | 'shimmer'    // Wave of brightness across image
  | 'rainbow'    // Cycle through rainbow colors
  | 'glitch';    // Random distortion effect

/**
 * Animation easing types
 */
export type AnimationEasing =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'sine';

/**
 * Props for AnimatedPicture component
 */
export interface AnimatedPictureProps {
  /** Pixel grid to animate */
  pixels: PixelGrid;

  /** Animation type */
  animation?: PictureAnimation;

  /** Duration of one animation cycle in ms */
  duration?: number;

  /** Minimum brightness (0-1), default 0.2 */
  minBrightness?: number;

  /** Maximum brightness (0-1), default 1.0 */
  maxBrightness?: number;

  /** Easing function for animation */
  easing?: AnimationEasing;

  /** Whether to loop the animation */
  loop?: boolean;

  /** Start animation automatically */
  autoPlay?: boolean;

  /** Callback when animation cycle completes */
  onCycleComplete?: () => void;

  /** Fixed width */
  width?: number;

  /** Fixed height */
  height?: number;

  /** Horizontal alignment */
  alignX?: PictureAlignX;

  /** Vertical alignment */
  alignY?: PictureAlignY;

  /** Border style */
  borderStyle?: 'none' | 'single' | 'double' | 'round' | 'bold';

  /** Border color */
  borderColor?: string;

  /** Padding */
  padding?: number;
}

// =============================================================================
// COLOR UTILITIES FOR ANIMATION
// =============================================================================

/**
 * Parse a color string to RGB values
 */
function parseColorToRgb(color: string): { r: number; g: number; b: number } | null {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      // Short hex (#RGB)
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    } else if (hex.length === 6) {
      // Full hex (#RRGGBB)
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
    return null;
  }

  // Handle rgb() format
  const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // Named colors - common ones
  const namedColors: Record<string, { r: number; g: number; b: number }> = {
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 255, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    yellow: { r: 255, g: 255, b: 0 },
    cyan: { r: 0, g: 255, b: 255 },
    magenta: { r: 255, g: 0, b: 255 },
    white: { r: 255, g: 255, b: 255 },
    black: { r: 0, g: 0, b: 0 },
    gray: { r: 128, g: 128, b: 128 },
    grey: { r: 128, g: 128, b: 128 },
    orange: { r: 255, g: 165, b: 0 },
    pink: { r: 255, g: 192, b: 203 },
    purple: { r: 128, g: 0, b: 128 },
    brown: { r: 139, g: 69, b: 19 },
  };

  return namedColors[color.toLowerCase()] || null;
}

/**
 * Convert RGB values to hex color string
 */
function rgbToHexColor(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('');
}

/**
 * Adjust color brightness
 * @param color - Color string (hex, rgb, or named)
 * @param brightness - Brightness multiplier (0-1 dims, >1 brightens)
 */
export function adjustBrightness(color: string, brightness: number): string {
  const rgb = parseColorToRgb(color);
  if (!rgb) return color;

  return rgbToHexColor(
    rgb.r * brightness,
    rgb.g * brightness,
    rgb.b * brightness
  );
}

/**
 * Interpolate between two colors
 * @param color1 - Start color
 * @param color2 - End color
 * @param t - Progress (0-1)
 */
export function interpolateColor(color1: string, color2: string, t: number): string {
  const rgb1 = parseColorToRgb(color1);
  const rgb2 = parseColorToRgb(color2);

  if (!rgb1 || !rgb2) return color1;

  return rgbToHexColor(
    rgb1.r + (rgb2.r - rgb1.r) * t,
    rgb1.g + (rgb2.g - rgb1.g) * t,
    rgb1.b + (rgb2.b - rgb1.b) * t
  );
}

/**
 * Apply brightness to entire pixel grid
 */
export function applyBrightnessToGrid(grid: PixelGrid, brightness: number): PixelGrid {
  return grid.map(row =>
    row.map(pixel => ({
      ...pixel,
      fg: pixel.fg ? adjustBrightness(pixel.fg, brightness) : undefined,
      bg: pixel.bg ? adjustBrightness(pixel.bg, brightness) : undefined,
    }))
  );
}

/**
 * Apply shimmer effect to grid (wave of brightness)
 * @param grid - Pixel grid
 * @param progress - Animation progress (0-1)
 * @param minBrightness - Minimum brightness
 * @param waveWidth - Width of the shimmer wave (0-1)
 */
export function applyShimmerToGrid(
  grid: PixelGrid,
  progress: number,
  minBrightness: number = 0.3,
  waveWidth: number = 0.3
): PixelGrid {
  const gridWidth = grid.length > 0 ? Math.max(...grid.map(r => r.length)) : 0;

  return grid.map(row =>
    row.map((pixel, x) => {
      const normalizedX = gridWidth > 1 ? x / (gridWidth - 1) : 0;
      const distance = Math.abs(normalizedX - progress);
      const waveEffect = Math.max(0, 1 - distance / waveWidth);
      const brightness = minBrightness + (1 - minBrightness) * waveEffect;

      return {
        ...pixel,
        fg: pixel.fg ? adjustBrightness(pixel.fg, brightness) : undefined,
        bg: pixel.bg ? adjustBrightness(pixel.bg, brightness) : undefined,
      };
    })
  );
}

/**
 * Apply rainbow effect to grid
 * @param grid - Pixel grid
 * @param progress - Animation progress (0-1)
 */
export function applyRainbowToGrid(grid: PixelGrid, progress: number): PixelGrid {
  const rainbowColors = [
    '#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'
  ];

  return grid.map((row, y) =>
    row.map((pixel, x) => {
      if (!pixel.fg) return pixel;

      const colorIndex = (progress * rainbowColors.length + (x + y) * 0.1) % rainbowColors.length;
      const colorIdx1 = Math.floor(colorIndex);
      const colorIdx2 = (colorIdx1 + 1) % rainbowColors.length;
      const colorT = colorIndex - colorIdx1;

      const newColor = interpolateColor(
        rainbowColors[colorIdx1],
        rainbowColors[colorIdx2],
        colorT
      );

      return { ...pixel, fg: newColor };
    })
  );
}

/**
 * Apply glitch effect to grid
 * @param grid - Pixel grid
 * @param intensity - Glitch intensity (0-1)
 */
export function applyGlitchToGrid(grid: PixelGrid, intensity: number): PixelGrid {
  if (intensity < 0.1) return grid;

  return grid.map((row, y) => {
    // Random horizontal shift for some rows
    if (Math.random() < intensity * 0.3) {
      const shift = Math.floor((Math.random() - 0.5) * 6 * intensity);
      if (shift > 0) {
        return [...row.slice(shift), ...row.slice(0, shift)];
      } else if (shift < 0) {
        return [...row.slice(shift), ...row.slice(0, row.length + shift)];
      }
    }

    // Random character corruption
    return row.map(pixel => {
      if (Math.random() < intensity * 0.1) {
        const glitchChars = '░▒▓█▀▄▌▐';
        return {
          ...pixel,
          char: glitchChars[Math.floor(Math.random() * glitchChars.length)],
        };
      }
      return pixel;
    });
  });
}

// =============================================================================
// EASING FUNCTIONS
// =============================================================================

const easingFunctions: Record<AnimationEasing, (t: number) => number> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  sine: (t) => (Math.sin((t - 0.5) * Math.PI) + 1) / 2,
};

// =============================================================================
// ANIMATED PICTURE STATE FACTORY
// =============================================================================

export interface AnimatedPictureControls {
  /** Start or resume animation */
  play: () => void;
  /** Pause animation */
  pause: () => void;
  /** Stop and reset animation */
  stop: () => void;
  /** Set animation type */
  setAnimation: (animation: PictureAnimation) => void;
  /** Set brightness directly (0-1) */
  setBrightness: (brightness: number) => void;
  /** Get current brightness */
  brightness: () => number;
  /** Get processed pixels for current frame */
  pixels: () => PixelGrid;
  /** Check if animation is playing */
  isPlaying: () => boolean;
  /** Get animation progress (0-1) */
  progress: () => number;
  /** Component props for rendering */
  props: AnimatedPictureProps;
}

import { createSignal, createEffect } from '../../primitives/signal.js';

/**
 * Create an animated picture controller for programmatic control
 *
 * @example
 * ```typescript
 * const anim = createAnimatedPicture({
 *   pixels: myGrid,
 *   animation: 'pulse',
 *   duration: 2000,
 *   minBrightness: 0.3,
 * })
 *
 * // Control
 * anim.play()
 * anim.pause()
 * anim.setAnimation('breathe')
 *
 * // Render
 * ColoredPicture({ pixels: anim.pixels() })
 * ```
 */
export function createAnimatedPicture(
  props: AnimatedPictureProps
): AnimatedPictureControls {
  const {
    pixels: sourcePixels,
    animation: initialAnimation = 'pulse',
    duration = 1500,
    minBrightness = 0.2,
    maxBrightness = 1.0,
    easing = 'sine',
    loop = true,
    autoPlay = true,
    onCycleComplete,
  } = props;

  // State
  const [animation, setAnimation] = createSignal<PictureAnimation>(initialAnimation);
  const [brightness, setBrightness] = createSignal(maxBrightness);
  const [progress, setProgress] = createSignal(0);
  const [isPlaying, setIsPlaying] = createSignal(autoPlay);

  // Timer for animation
  let animationTimer: ReturnType<typeof setInterval> | null = null;
  let startTime = 0;

  const easingFn = easingFunctions[easing];

  /**
   * Calculate brightness based on animation type and progress
   */
  function calculateBrightness(animType: PictureAnimation, prog: number): number {
    switch (animType) {
      case 'pulse':
        // Fast sine wave oscillation
        return minBrightness + (maxBrightness - minBrightness) * ((Math.sin(prog * Math.PI * 2) + 1) / 2);

      case 'breathe':
        // Slower, smoother breathing (uses easing)
        const breatheT = easingFn(prog < 0.5 ? prog * 2 : (1 - prog) * 2);
        return minBrightness + (maxBrightness - minBrightness) * breatheT;

      case 'blink':
        // Hard on/off
        return prog < 0.5 ? maxBrightness : minBrightness;

      case 'fadeIn':
        return minBrightness + (maxBrightness - minBrightness) * easingFn(prog);

      case 'fadeOut':
        return maxBrightness - (maxBrightness - minBrightness) * easingFn(prog);

      case 'glow':
        // Subtle pulsing
        const glowRange = (maxBrightness - minBrightness) * 0.3;
        return maxBrightness - glowRange + glowRange * ((Math.sin(prog * Math.PI * 2) + 1) / 2);

      default:
        return maxBrightness;
    }
  }

  /**
   * Get current processed pixels based on animation state
   */
  function getPixels(): PixelGrid {
    const animType = animation();
    const prog = progress();
    const bright = brightness();

    switch (animType) {
      case 'shimmer':
        return applyShimmerToGrid(sourcePixels, prog, minBrightness);

      case 'rainbow':
        return applyRainbowToGrid(sourcePixels, prog);

      case 'glitch':
        // Glitch intensity varies with progress
        const intensity = Math.sin(prog * Math.PI * 4) * 0.5 + 0.5;
        return applyGlitchToGrid(sourcePixels, intensity * 0.5);

      case 'none':
        return sourcePixels;

      default:
        // Brightness-based animations (pulse, breathe, blink, fadeIn, fadeOut, glow)
        return applyBrightnessToGrid(sourcePixels, bright);
    }
  }

  /**
   * Animation tick
   */
  function tick() {
    if (!isPlaying()) return;

    const elapsed = Date.now() - startTime;
    let prog = (elapsed % duration) / duration;

    // Check for cycle completion
    if (elapsed >= duration) {
      if (!loop) {
        stop();
        onCycleComplete?.();
        return;
      }
      startTime = Date.now();
      onCycleComplete?.();
    }

    setProgress(prog);
    setBrightness(calculateBrightness(animation(), prog));
  }

  /**
   * Start animation loop
   */
  function play() {
    if (isPlaying()) return;

    setIsPlaying(true);
    startTime = Date.now() - progress() * duration;

    animationTimer = setInterval(tick, 16); // ~60fps
  }

  /**
   * Pause animation
   */
  function pause() {
    setIsPlaying(false);
    if (animationTimer) {
      clearInterval(animationTimer);
      animationTimer = null;
    }
  }

  /**
   * Stop and reset animation
   */
  function stop() {
    pause();
    setProgress(0);
    setBrightness(maxBrightness);
  }

  /**
   * Change animation type
   */
  function changeAnimation(newAnimation: PictureAnimation) {
    setAnimation(newAnimation);
    setProgress(0);
    startTime = Date.now();
  }

  // Auto-start if enabled
  if (autoPlay) {
    // Use setTimeout to defer start until after render setup
    setTimeout(play, 0);
  }

  return {
    play,
    pause,
    stop,
    setAnimation: changeAnimation,
    setBrightness,
    brightness,
    pixels: getPixels,
    isPlaying,
    progress,
    props,
  };
}

/**
 * AnimatedPicture - Display animated pixel art
 *
 * @example
 * ```typescript
 * // Simple pulse animation
 * const anim = createAnimatedPicture({
 *   pixels: myGrid,
 *   animation: 'pulse',
 *   duration: 2000,
 *   minBrightness: 0.3,
 * })
 *
 * // In render loop
 * ColoredPicture({
 *   pixels: anim.pixels(),
 *   width: 20,
 *   height: 10,
 * })
 * ```
 *
 * Animations:
 * - `pulse` - Fast brightness oscillation
 * - `breathe` - Slow, smooth breathing effect
 * - `blink` - On/off blinking
 * - `fadeIn` - Fade from dim to bright
 * - `fadeOut` - Fade from bright to dim
 * - `glow` - Subtle pulsing glow
 * - `shimmer` - Wave of brightness across image
 * - `rainbow` - Cycle through rainbow colors
 * - `glitch` - Random distortion effect
 */
export function AnimatedPicture(props: AnimatedPictureProps): VNode {
  const controller = createAnimatedPicture(props);

  // Effect to start animation
  createEffect(() => {
    if (props.autoPlay !== false) {
      controller.play();
    }
    // Cleanup on unmount
    return () => controller.stop();
  });

  return ColoredPicture({
    pixels: controller.pixels(),
    width: props.width,
    height: props.height,
    alignX: props.alignX,
    alignY: props.alignY,
    borderStyle: props.borderStyle,
    borderColor: props.borderColor,
    padding: props.padding,
  });
}
