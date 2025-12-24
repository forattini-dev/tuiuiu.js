/**
 * Media Documentation
 *
 * Components for displaying images, pixel art, ASCII graphics, and visual content.
 */

import type { ComponentDoc } from '../types.js';

export const media: ComponentDoc[] = [
  {
    name: 'Picture',
    category: 'media',
    description: 'Display ASCII art and character-based images. Handles scaling, cropping, alignment, and transparency.',
    props: [
      { name: 'source', type: "string | string[]", required: true, description: 'ASCII art content (string with newlines or array of strings)' },
      { name: 'width', type: "number", required: false, description: 'Fixed width (characters). If not set, uses source width' },
      { name: 'height', type: "number", required: false, description: 'Fixed height (lines). If not set, uses source height' },
      { name: 'fit', type: "'none' | 'contain' | 'cover' | 'fill' | 'crop'", required: false, default: "'none'", description: 'How to fit the picture in the container' },
      { name: 'alignX', type: "'left' | 'center' | 'right'", required: false, default: "'left'", description: 'Horizontal alignment' },
      { name: 'alignY', type: "'top' | 'center' | 'bottom'", required: false, default: "'top'", description: 'Vertical alignment' },
      { name: 'color', type: "ColorValue", required: false, description: 'Foreground color' },
      { name: 'backgroundColor', type: "ColorValue", required: false, description: 'Background color' },
      { name: 'transparent', type: "string", required: false, description: 'Character to treat as transparent (will not be rendered)' },
      { name: 'borderStyle', type: "'none' | 'single' | 'double' | 'round' | 'bold'", required: false, description: 'Border style' },
      { name: 'borderColor', type: "ColorValue", required: false, description: 'Border color' },
      { name: 'padding', type: "number", required: false, default: '0', description: 'Padding inside the picture frame' },
      { name: 'preserveColors', type: "boolean", required: false, default: 'false', description: 'Whether to preserve colors in source (ANSI codes)' },
    ],
    examples: [
      `// Simple ASCII art\nPicture({\n  source: \`\n    /\\_/\\\\\n   ( o.o )\n    > ^ <\n  \`,\n  color: 'cyan',\n})`,
      `// Logo with fixed size and centering\nPicture({\n  source: LOGO_ART,\n  width: 40,\n  height: 10,\n  fit: 'contain',\n  alignX: 'center',\n  alignY: 'center',\n})`,
      `// Splash screen\nPicture({\n  source: SPLASH_ART,\n  width: process.stdout.columns,\n  height: process.stdout.rows,\n  fit: 'contain',\n  alignX: 'center',\n  alignY: 'center',\n  color: 'magenta',\n})`,
    ],
    relatedComponents: ['ColoredPicture', 'FramedPicture'],
  },
  {
    name: 'ColoredPicture',
    category: 'media',
    description: 'Display colored pixel art using a PixelGrid. Each pixel can have its own foreground and background color.',
    props: [
      { name: 'pixels', type: "PixelGrid", required: true, description: 'Pixel grid to render (2D array of { char, fg?, bg? })' },
      { name: 'width', type: "number", required: false, description: 'Fixed width (will pad/crop if needed)' },
      { name: 'height', type: "number", required: false, description: 'Fixed height (will pad/crop if needed)' },
      { name: 'alignX', type: "'left' | 'center' | 'right'", required: false, default: "'left'", description: 'Horizontal alignment' },
      { name: 'alignY', type: "'top' | 'center' | 'bottom'", required: false, default: "'top'", description: 'Vertical alignment' },
      { name: 'borderStyle', type: "'none' | 'single' | 'double' | 'round' | 'bold'", required: false, description: 'Border style' },
      { name: 'borderColor', type: "ColorValue", required: false, description: 'Border color' },
      { name: 'padding', type: "number", required: false, default: '0', description: 'Padding around the pixel art' },
    ],
    examples: [
      `// Using palette\nconst grid = createPixelGrid(\`\nRRRGGGBBB\nRRRGGGBBB\nRRRGGGBBB\n\`, {\n  'R': { fg: 'red' },\n  'G': { fg: 'green' },\n  'B': { fg: 'blue' },\n});\n\nColoredPicture({ pixels: grid })`,
      `// Using color map\nconst colors = [\n  ['red', 'green', 'blue'],\n  ['yellow', 'magenta', 'cyan'],\n];\nconst grid2 = createPixelGridFromColors(colors);\n\nColoredPicture({ pixels: grid2 })`,
      `// Pre-defined colored art\nimport { TUIUIU_BIRD_COLORED } from './data/tuiuiu-bird-colored.js';\n\nColoredPicture({\n  pixels: TUIUIU_BIRD_COLORED,\n  alignX: 'center',\n})`,
    ],
    relatedComponents: ['Picture', 'createPixelGrid', 'createPixelGridFromColors'],
  },
  {
    name: 'FramedPicture',
    category: 'media',
    description: 'Picture with a decorative frame and optional title. Convenience wrapper around Picture.',
    props: [
      { name: 'source', type: "string | string[]", required: true, description: 'ASCII art content' },
      { name: 'title', type: "string", required: false, description: 'Title to display at the top of the frame' },
      { name: 'titleColor', type: "ColorValue", required: false, default: "'white'", description: 'Title color' },
      { name: 'borderStyle', type: "'single' | 'double' | 'round' | 'bold'", required: false, default: "'single'", description: 'Border style' },
      { name: 'borderColor', type: "ColorValue", required: false, default: "'gray'", description: 'Border color' },
      { name: 'color', type: "ColorValue", required: false, description: 'Art foreground color' },
      { name: 'fit', type: "'none' | 'contain' | 'cover' | 'fill' | 'crop'", required: false, default: "'none'", description: 'How to fit the picture' },
      { name: 'alignX', type: "'left' | 'center' | 'right'", required: false, default: "'left'", description: 'Horizontal alignment' },
      { name: 'alignY', type: "'top' | 'center' | 'bottom'", required: false, default: "'top'", description: 'Vertical alignment' },
    ],
    examples: [
      `FramedPicture({\n  source: LOGO_ART,\n  title: ' My App ',\n  titleColor: 'cyan',\n  borderStyle: 'double',\n  borderColor: 'gray',\n})`,
    ],
    relatedComponents: ['Picture'],
  },
  {
    name: 'createPixelGrid',
    category: 'media',
    description: 'Create a PixelGrid from ASCII art source and a color palette. Maps characters to colors.',
    props: [
      { name: 'source', type: "string", required: true, description: 'ASCII art source with character codes' },
      { name: 'palette', type: "ColorPalette", required: true, description: 'Object mapping characters to { fg?, bg? } colors' },
    ],
    examples: [
      `const art = \`\nRRR\nGGG\nBBB\n\`;\n\nconst palette = {\n  'R': { fg: 'red' },\n  'G': { fg: 'green' },\n  'B': { fg: 'blue' },\n};\n\nconst grid = createPixelGrid(art, palette);\n\n// Use with ColoredPicture\nColoredPicture({ pixels: grid })`,
      `// With hex colors\nconst palette = {\n  '█': { fg: '#ff6b6b' },\n  '▓': { fg: '#4ecdc4' },\n  '░': { fg: '#95a5a6' },\n};\n\nconst grid = createPixelGrid(art, palette);`,
    ],
    relatedComponents: ['ColoredPicture', 'createPixelGridFromColors', 'PixelGrid'],
  },
  {
    name: 'createPixelGridFromColors',
    category: 'media',
    description: 'Create a PixelGrid from a 2D array of color names. Uses block characters by default.',
    props: [
      { name: 'colors', type: "(string | null)[][]", required: true, description: '2D array of color names (null for transparent)' },
      { name: 'char', type: "string", required: false, default: "'█'", description: 'Character to use for pixels' },
    ],
    examples: [
      `const colorMap = [\n  ['red', 'red', 'red'],\n  ['green', 'green', 'green'],\n  ['blue', 'blue', 'blue'],\n];\n\nconst grid = createPixelGridFromColors(colorMap);\n\nColoredPicture({ pixels: grid })`,
      `// With transparency\nconst colorMap = [\n  [null, 'red', null],\n  ['red', 'red', 'red'],\n  [null, 'red', null],\n];\n\nconst grid = createPixelGridFromColors(colorMap);`,
    ],
    relatedComponents: ['ColoredPicture', 'createPixelGrid', 'PixelGrid'],
  },
  {
    name: 'parseColoredBBCode',
    category: 'media',
    description: 'Parse BBCode-formatted colored ASCII art to PixelGrid. Useful for importing from text-to-ASCII generators.',
    props: [
      { name: 'bbcode', type: "string", required: true, description: 'BBCode formatted string with [color=#hex]char[/color] tags' },
    ],
    examples: [
      `const bbcode = '[color=#ff0000]R[/color][color=#00ff00]G[/color][color=#0000ff]B[/color]';\nconst grid = parseColoredBBCode(bbcode);\n\nColoredPicture({ pixels: grid })`,
    ],
    relatedComponents: ['ColoredPicture', 'PixelGrid'],
  },
  {
    name: 'renderPixelGrid',
    category: 'media',
    description: 'Render a PixelGrid to an ANSI string for direct output. Useful for non-component contexts.',
    props: [
      { name: 'grid', type: "PixelGrid", required: true, description: 'Pixel grid to render' },
    ],
    examples: [
      `const grid = createPixelGrid(art, palette);\nconst ansiString = renderPixelGrid(grid);\n\nconsole.log(ansiString);`,
    ],
    relatedComponents: ['PixelGrid', 'createPixelGrid'],
  },
  {
    name: 'createGradientBar',
    category: 'media',
    description: 'Generate a gradient bar string with color stops.',
    props: [
      { name: 'width', type: "number", required: true, description: 'Bar width in characters' },
      { name: 'stops', type: "GradientStop[]", required: true, description: 'Array of { position: 0-1, color } color stops' },
      { name: 'char', type: "string", required: false, default: "'█'", description: 'Character to use for the bar' },
    ],
    examples: [
      `const bar = createGradientBar(20, [\n  { position: 0, color: 'red' },\n  { position: 0.5, color: 'yellow' },\n  { position: 1, color: 'green' }\n]);\n\nText({}, bar)`,
    ],
    relatedComponents: [],
  },
  {
    name: 'rainbowText',
    category: 'media',
    description: 'Colorize text with a rainbow pattern. Each character gets a different color.',
    props: [
      { name: 'text', type: "string", required: true, description: 'Text to colorize' },
    ],
    examples: [
      `Text({}, rainbowText('Hello World'))`,
      `// In a component\nBox({},\n  Text({}, rainbowText('RAINBOW!')),\n)`,
    ],
    relatedComponents: ['createGradientBar'],
  },
  {
    name: 'AsciiPatterns',
    category: 'media',
    description: 'Pre-made ASCII art patterns for common shapes. Includes hline, vline, box, diamond, arrows, star, heart, checkmark, and cross.',
    props: [
      { name: 'hline(width, char?)', type: "function", required: false, description: 'Horizontal line' },
      { name: 'vline(height, char?)', type: "function", required: false, description: 'Vertical line' },
      { name: 'box(width, height, style?)', type: "function", required: false, description: 'Box outline (single or double)' },
      { name: 'diamond(size)', type: "function", required: false, description: 'Diamond shape' },
      { name: 'arrowRight', type: "string", required: false, description: 'Right-pointing arrow' },
      { name: 'arrowLeft', type: "string", required: false, description: 'Left-pointing arrow' },
      { name: 'star', type: "string", required: false, description: 'Star shape' },
      { name: 'heart', type: "string", required: false, description: 'Heart shape' },
      { name: 'checkmark', type: "string", required: false, description: 'Checkmark symbol' },
      { name: 'cross', type: "string", required: false, description: 'X/cross symbol' },
    ],
    examples: [
      `// Use pre-made patterns\nPicture({ source: AsciiPatterns.star, color: 'yellow' })`,
      `// Generate patterns\nconst line = AsciiPatterns.hline(40);\nconst box = AsciiPatterns.box(20, 10, 'double');`,
    ],
    relatedComponents: ['Picture'],
  },
  {
    name: 'createBanner',
    category: 'media',
    description: 'Generate a simple text banner with optional border style.',
    props: [
      { name: 'text', type: "string", required: true, description: 'Text to display in the banner' },
      { name: 'style', type: "'simple' | 'box' | 'double'", required: false, default: "'simple'", description: 'Banner style' },
    ],
    examples: [
      `const banner = createBanner('Welcome!', 'double');\n\n// Result:\n// ╔════════════╗\n// ║  Welcome!  ║\n// ╚════════════╝\n\nPicture({ source: banner })`,
    ],
    relatedComponents: ['Picture'],
  },
];
