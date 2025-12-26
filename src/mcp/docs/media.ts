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
  {
    name: 'AnimatedPicture',
    category: 'media',
    description: 'Animated pixel art with built-in effects like pulse, breathe, shimmer, rainbow, and more. Perfect for loading states, alerts, and visual feedback.',
    props: [
      { name: 'pixels', type: 'PixelGrid', required: true, description: 'Pixel grid to animate' },
      { name: 'animation', type: "PictureAnimation", required: false, default: "'pulse'", description: "Animation type: 'none' | 'pulse' | 'breathe' | 'blink' | 'fadeIn' | 'fadeOut' | 'glow' | 'shimmer' | 'rainbow' | 'glitch'" },
      { name: 'duration', type: 'number', required: false, default: '1500', description: 'Animation cycle duration in ms' },
      { name: 'minBrightness', type: 'number', required: false, default: '0.2', description: 'Minimum brightness (0-1)' },
      { name: 'maxBrightness', type: 'number', required: false, default: '1.0', description: 'Maximum brightness (0-1)' },
      { name: 'easing', type: "AnimationEasing", required: false, default: "'sine'", description: "Easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'sine'" },
      { name: 'loop', type: 'boolean', required: false, default: 'true', description: 'Whether to loop the animation' },
      { name: 'autoPlay', type: 'boolean', required: false, default: 'true', description: 'Start animation automatically' },
      { name: 'onCycleComplete', type: '() => void', required: false, description: 'Callback when animation cycle completes' },
      { name: 'width', type: 'number', required: false, description: 'Fixed width' },
      { name: 'height', type: 'number', required: false, description: 'Fixed height' },
      { name: 'alignX', type: "'left' | 'center' | 'right'", required: false, default: "'left'", description: 'Horizontal alignment' },
      { name: 'alignY', type: "'top' | 'center' | 'bottom'", required: false, default: "'top'", description: 'Vertical alignment' },
    ],
    examples: [
      `// Pulsing logo\nconst logo = createPixelGridFromColors([\n  ['cyan', 'cyan', 'cyan'],\n  ['cyan', 'cyan', 'cyan'],\n]);\n\nAnimatedPicture({\n  pixels: logo,\n  animation: 'pulse',\n  duration: 1500,\n  minBrightness: 0.3,\n})`,
      `// Loading shimmer\nAnimatedPicture({\n  pixels: loadingBar,\n  animation: 'shimmer',\n  duration: 1000,\n})`,
      `// Rainbow celebration\nAnimatedPicture({\n  pixels: star,\n  animation: 'rainbow',\n  duration: 2000,\n})`,
      `// Error glitch effect\nAnimatedPicture({\n  pixels: errorIcon,\n  animation: 'glitch',\n  duration: 500,\n})`,
    ],
    relatedComponents: ['ColoredPicture', 'createAnimatedPicture', 'createPixelGrid'],
  },
  {
    name: 'createAnimatedPicture',
    category: 'media',
    description: 'Create an animation controller for programmatic control over pixel art animations. Returns controls for play, pause, stop, and brightness manipulation.',
    props: [
      { name: 'pixels', type: 'PixelGrid', required: true, description: 'Pixel grid to animate' },
      { name: 'animation', type: 'PictureAnimation', required: false, default: "'pulse'", description: 'Animation type' },
      { name: 'duration', type: 'number', required: false, default: '1500', description: 'Cycle duration in ms' },
      { name: 'minBrightness', type: 'number', required: false, default: '0.2', description: 'Minimum brightness' },
      { name: 'maxBrightness', type: 'number', required: false, default: '1.0', description: 'Maximum brightness' },
      { name: 'easing', type: 'AnimationEasing', required: false, default: "'sine'", description: 'Easing function' },
      { name: 'loop', type: 'boolean', required: false, default: 'true', description: 'Loop animation' },
      { name: 'autoPlay', type: 'boolean', required: false, default: 'true', description: 'Start automatically' },
      { name: 'onCycleComplete', type: '() => void', required: false, description: 'Cycle complete callback' },
    ],
    examples: [
      `// Create controller\nconst anim = createAnimatedPicture({\n  pixels: myGrid,\n  animation: 'breathe',\n  duration: 3000,\n  autoPlay: false,\n});\n\n// Control methods\nanim.play();         // Start\nanim.pause();        // Pause\nanim.stop();         // Stop and reset\n\n// State access\nanim.isPlaying();    // boolean\nanim.progress();     // 0-1\nanim.brightness();   // current brightness\nanim.pixels();       // current PixelGrid`,
      `// Change animation\nanim.setAnimation('shimmer');\n\n// Manual brightness\nanim.setBrightness(0.5);`,
      `// Fade in then switch\nconst splash = createAnimatedPicture({\n  pixels: logo,\n  animation: 'fadeIn',\n  duration: 1000,\n  loop: false,\n  autoPlay: false,\n  onCycleComplete: () => showMainApp(),\n});\n\nsplash.play();`,
    ],
    relatedComponents: ['AnimatedPicture', 'ColoredPicture'],
  },
  {
    name: 'adjustBrightness',
    category: 'media',
    description: 'Adjust the brightness of a color. Returns a new color with modified luminance.',
    props: [
      { name: 'color', type: 'string', required: true, description: 'Color to adjust (hex, rgb, or named)' },
      { name: 'brightness', type: 'number', required: true, description: 'Brightness factor (0 = black, 1 = original, >1 = brighter)' },
    ],
    examples: [
      `// Dim to half brightness\nadjustBrightness('#ff0000', 0.5)  // '#800000'\n\n// Fully dim to black\nadjustBrightness('cyan', 0)       // '#000000'\n\n// Brighten (clamped to white)\nadjustBrightness('#808080', 2)    // '#ffffff'`,
    ],
    relatedComponents: ['interpolateColor', 'applyBrightnessToGrid'],
  },
  {
    name: 'interpolateColor',
    category: 'media',
    description: 'Blend between two colors. Returns a color at position t between start and end.',
    props: [
      { name: 'color1', type: 'string', required: true, description: 'Start color' },
      { name: 'color2', type: 'string', required: true, description: 'End color' },
      { name: 't', type: 'number', required: true, description: 'Interpolation factor (0-1)' },
    ],
    examples: [
      `// Midpoint between red and blue\ninterpolateColor('#ff0000', '#0000ff', 0.5)  // '#800080' (purple)\n\n// 25% toward blue\ninterpolateColor('red', 'blue', 0.25)        // '#c00040'`,
    ],
    relatedComponents: ['adjustBrightness'],
  },
  {
    name: 'applyBrightnessToGrid',
    category: 'media',
    description: 'Apply brightness adjustment to an entire PixelGrid. Returns a new grid with modified colors.',
    props: [
      { name: 'grid', type: 'PixelGrid', required: true, description: 'Pixel grid to modify' },
      { name: 'brightness', type: 'number', required: true, description: 'Brightness factor (0-1)' },
    ],
    examples: [
      `// Dim entire image to 50%\nconst dimmed = applyBrightnessToGrid(grid, 0.5);\n\nColoredPicture({ pixels: dimmed })`,
    ],
    relatedComponents: ['applyShimmerToGrid', 'applyRainbowToGrid', 'applyGlitchToGrid'],
  },
  {
    name: 'applyShimmerToGrid',
    category: 'media',
    description: 'Apply a shimmer wave effect across a PixelGrid. Creates a moving highlight effect.',
    props: [
      { name: 'grid', type: 'PixelGrid', required: true, description: 'Pixel grid to modify' },
      { name: 'progress', type: 'number', required: true, description: 'Animation progress (0-1)' },
      { name: 'minBrightness', type: 'number', required: false, default: '0.2', description: 'Minimum brightness in wave' },
      { name: 'waveWidth', type: 'number', required: false, default: '0.3', description: 'Wave width as fraction of grid' },
    ],
    examples: [
      `// Shimmer at 30% progress\nconst shimmered = applyShimmerToGrid(grid, 0.3, 0.2);\n\nColoredPicture({ pixels: shimmered })`,
    ],
    relatedComponents: ['applyBrightnessToGrid', 'applyRainbowToGrid'],
  },
  {
    name: 'applyRainbowToGrid',
    category: 'media',
    description: 'Apply a rainbow color cycling effect to a PixelGrid. Each pixel shifts through the spectrum.',
    props: [
      { name: 'grid', type: 'PixelGrid', required: true, description: 'Pixel grid to modify' },
      { name: 'progress', type: 'number', required: true, description: 'Animation progress (0-1)' },
    ],
    examples: [
      `// Rainbow at 50% progress\nconst rainbow = applyRainbowToGrid(grid, 0.5);\n\nColoredPicture({ pixels: rainbow })`,
    ],
    relatedComponents: ['applyBrightnessToGrid', 'applyShimmerToGrid'],
  },
  {
    name: 'applyGlitchToGrid',
    category: 'media',
    description: 'Apply a random glitch/distortion effect to a PixelGrid. Pixels may swap or shift randomly.',
    props: [
      { name: 'grid', type: 'PixelGrid', required: true, description: 'Pixel grid to modify' },
      { name: 'intensity', type: 'number', required: true, description: 'Glitch intensity (0 = none, 1 = maximum)' },
    ],
    examples: [
      `// Light glitch (40% intensity)\nconst glitched = applyGlitchToGrid(grid, 0.4);\n\n// Heavy glitch for errors\nconst errorGlitch = applyGlitchToGrid(errorIcon, 0.8);`,
    ],
    relatedComponents: ['applyBrightnessToGrid', 'applyShimmerToGrid'],
  },
];
