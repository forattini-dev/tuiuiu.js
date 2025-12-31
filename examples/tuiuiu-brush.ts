/**
 * Tuiuiu Brush - Terminal Paint
 *
 * A nostalgic recreation of Windows 95/98 MS Paint built with tuiuiu.js.
 * Features: Pencil, Line, Rectangle, Circle, Fill Bucket, Eraser, Color Palette.
 *
 * Run: pnpm example examples/tuiuiu-brush.ts
 *
 * Controls:
 * - Mouse click on canvas to draw
 * - Mouse drag for shapes (line, rect, circle)
 * - 1-6 keys for quick tool selection
 * - d to draw "tuiuiu.js" demo logo
 * - c to clear canvas
 * - q to quit
 */

import {
  render,
  Box,
  Text,
  useHotkeys,
  useMouse,
  useApp,
  useTerminalSize,
  createSignal,
  createCanvas,
  setTheme,
  darkTheme,
  bresenhamLine,
  midpointCircle,
  rectanglePoints,
  useInterval,
} from '../src/index.js';
import type { VNode } from '../src/utils/types.js';
import type { Point } from '../src/primitives/canvas.js';

// =============================================================================
// Types
// =============================================================================

type Tool = 'pencil' | 'line' | 'rectangle' | 'circle' | 'fill' | 'eraser';

// =============================================================================
// Color Palette - HSL-based color picker style
// =============================================================================

// Helper: HSL to RGB to Hex
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

// Generate palette: organized by hue, each row = one hue from dark to light
function generatePalette(): string[] {
  const colors: string[] = [];

  // Row 1: Grayscale (5 colors) - dark to light
  colors.push('#000000', '#444444', '#888888', '#CCCCCC', '#FFFFFF');

  // Hues organized by color family
  // Each row = one hue with 5 lightness levels (20%, 35%, 50%, 65%, 80%)
  const hues = [
    0,    // Red
    20,   // Red-Orange
    35,   // Orange
    50,   // Yellow-Orange
    60,   // Yellow
    80,   // Lime
    120,  // Green
    160,  // Teal
    190,  // Cyan
    210,  // Sky Blue
    230,  // Blue
    260,  // Indigo
    285,  // Purple
    310,  // Magenta
    330,  // Pink
  ];

  const lightLevels = [20, 35, 50, 65, 80];

  // Each hue gets one row with 5 lightness variations
  for (const hue of hues) {
    for (const lightness of lightLevels) {
      colors.push(hslToHex(hue, 85, lightness));
    }
  }

  // Earth tones row (browns)
  colors.push(
    hslToHex(25, 70, 15),   // Dark Brown
    hslToHex(28, 60, 30),   // Brown
    hslToHex(32, 50, 45),   // Medium Brown
    hslToHex(35, 40, 60),   // Tan
    hslToHex(40, 30, 75),   // Beige
  );

  // Skin tones row
  colors.push(
    hslToHex(20, 55, 25),   // Dark Skin
    hslToHex(22, 50, 40),   // Brown Skin
    hslToHex(25, 45, 55),   // Medium Skin
    hslToHex(28, 40, 70),   // Light Skin
    hslToHex(30, 30, 85),   // Pale Skin
  );

  return colors;
}

const PALETTE_COLORS = generatePalette();

// =============================================================================
// Tool Definitions
// =============================================================================

const TOOLS: { id: Tool; key: string; name: string }[] = [
  { id: 'pencil', key: '1', name: 'Pencil' },
  { id: 'line', key: '2', name: 'Line' },
  { id: 'rectangle', key: '3', name: 'Rect' },
  { id: 'circle', key: '4', name: 'Circle' },
  { id: 'fill', key: '5', name: 'Fill' },
  { id: 'eraser', key: '6', name: 'Eraser' },
];

// =============================================================================
// State
// =============================================================================

const [currentTool, setCurrentTool] = createSignal<Tool>('pencil');
const [primaryColor, setPrimaryColor] = createSignal<string>('#000000');
const [secondaryColor, setSecondaryColor] = createSignal<string>('#000000');
const [mousePos, setMousePos] = createSignal<Point>({ x: 0, y: 0 });
const [rawMousePos, setRawMousePos] = createSignal<Point>({ x: 0, y: 0 });
const [lastClick, setLastClick] = createSignal<string>('');
const [isDrawing, setIsDrawing] = createSignal<boolean>(false);
const [startPoint, setStartPoint] = createSignal<Point | null>(null);
const [canvasVersion, setCanvasVersion] = createSignal<number>(0);

// =============================================================================
// Layout System - Simplified: Header + Sidebar (Tools+Palette) + Canvas
// =============================================================================

interface Layout {
  // Terminal
  cols: number;
  rows: number;
  // Fixed dimensions
  sidebarWidth: number;   // Tools + Palette in one sidebar
  headerHeight: number;
  // Canvas dimensions (calculated)
  canvasWidth: number;
  canvasHeight: number;
  // Mouse offset to canvas coordinates
  canvasOffsetX: number;
  canvasOffsetY: number;
  // Sidebar sections
  toolsStartY: number;    // Where tools list starts
  paletteStartY: number;  // Where palette starts (below tools)
}

// Palette in sidebar: 5 colors per row
const PALETTE_COLS = 5;
const PALETTE_ROWS = Math.ceil(PALETTE_COLORS.length / PALETTE_COLS);

function calculateLayout(cols: number, rows: number): Layout {
  // Fixed dimensions
  const sidebarWidth = 12;  // Tools + 5 color swatches (each 2 chars = 10) + 1 padding + 1 extra
  const headerHeight = 1;

  // Canvas uses remaining space minus some padding for safety
  const canvasWidth = Math.max(20, cols - sidebarWidth);
  const canvasHeight = Math.max(10, rows - headerHeight - 1);  // -1 extra for terminal quirks

  // Mouse offsets: where canvas content starts on screen
  // X: sidebar width (canvas starts after sidebar)
  // Y: header height (canvas starts after header)
  const canvasOffsetX = sidebarWidth;
  const canvasOffsetY = headerHeight;

  // Tools start right after header (Y = headerHeight = 1)
  // After "Tools" label + 6 tools + divider + "Palette" label
  const toolsStartY = headerHeight;
  const paletteStartY = headerHeight + 1 + TOOLS.length + 1; // +1 for "Tools" label, +1 for divider

  return {
    cols,
    rows,
    sidebarWidth,
    headerHeight,
    canvasWidth,
    canvasHeight,
    canvasOffsetX,
    canvasOffsetY,
    toolsStartY,
    paletteStartY,
  };
}

// Current layout (updated on terminal resize)
let layout: Layout = calculateLayout(80, 24);

// Canvas state - now with built-in color support
let canvas = createCanvas({
  width: layout.canvasWidth,
  height: layout.canvasHeight,
  mode: 'character',
});

function initCanvas(newLayout: Layout): void {
  layout = newLayout;
  canvas = createCanvas({
    width: layout.canvasWidth,
    height: layout.canvasHeight,
    mode: 'character',
  });
}

// =============================================================================
// Drawing Functions
// =============================================================================

function isInCanvas(x: number, y: number): boolean {
  return x >= 0 && x < layout.canvasWidth && y >= 0 && y < layout.canvasHeight;
}

// Now uses canvas's built-in color support
function setPixelWithColor(x: number, y: number, char: string, color: string): void {
  if (isInCanvas(x, y)) {
    canvas.setPixel(x, y, char, color);
  }
}

function drawLine(x0: number, y0: number, x1: number, y1: number, color: string): void {
  const points = bresenhamLine(x0, y0, x1, y1);
  for (const p of points) {
    setPixelWithColor(p.x, p.y, '█', color);
  }
}

function drawRectangle(x0: number, y0: number, x1: number, y1: number, color: string): void {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const points = rectanglePoints(minX, minY, width, height);
  for (const p of points) {
    setPixelWithColor(p.x, p.y, '█', color);
  }
}

function drawCircle(cx: number, cy: number, x1: number, y1: number, color: string): void {
  const dx = x1 - cx;
  const dy = y1 - cy;
  const radius = Math.round(Math.sqrt(dx * dx + dy * dy));
  const points = midpointCircle(cx, cy, radius);
  for (const p of points) {
    setPixelWithColor(p.x, p.y, '█', color);
  }
}

function floodFillWithColor(startX: number, startY: number, fillColor: string): void {
  if (!isInCanvas(startX, startY)) return;
  const targetColor = canvas.getPixelColor(startX, startY);
  if (targetColor === fillColor) return;

  const stack: Point[] = [{ x: startX, y: startY }];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const p = stack.pop()!;
    const key = `${p.x},${p.y}`;
    if (visited.has(key)) continue;
    if (!isInCanvas(p.x, p.y)) continue;
    if (canvas.getPixelColor(p.x, p.y) !== targetColor) continue;

    visited.add(key);
    setPixelWithColor(p.x, p.y, '█', fillColor);
    stack.push({ x: p.x + 1, y: p.y });
    stack.push({ x: p.x - 1, y: p.y });
    stack.push({ x: p.x, y: p.y + 1 });
    stack.push({ x: p.x, y: p.y - 1 });
  }
}

function erasePixel(x: number, y: number): void {
  if (isInCanvas(x, y)) {
    canvas.setPixel(x, y, ' ', null);  // Clear character and color
  }
}

function clearCanvas(): void {
  canvas.clear();  // Now clears both characters and colors
  setCanvasVersion((v) => v + 1);
}

// =============================================================================
// Demo Logo - "tuiuiu.js" pixel art with animation using useInterval
// =============================================================================

const DEMO_COLOR = '#00A5B5'; // tuiuiu.js brand cyan
const PIXEL_DELAY = 25; // ms between each pixel

// Animation state - managed by useInterval
const [demoPixels, setDemoPixels] = createSignal<Point[]>([]);
const [demoPixelIndex, setDemoPixelIndex] = createSignal<number>(0);

// Simple 5x7 pixel font for "tuiuiu.js"
const PIXEL_FONT: Record<string, string[]> = {
  t: [
    '███',
    ' █ ',
    ' █ ',
    ' █ ',
    ' █ ',
  ],
  u: [
    '█ █',
    '█ █',
    '█ █',
    '█ █',
    '███',
  ],
  i: [
    '█',
    ' ',
    '█',
    '█',
    '█',
  ],
  '.': [
    ' ',
    ' ',
    ' ',
    ' ',
    '█',
  ],
  j: [
    '  █',
    '   ',
    '  █',
    '  █',
    '██ ',
  ],
  s: [
    '███',
    '█  ',
    '███',
    '  █',
    '███',
  ],
};

// Calculate pixels for the logo (called once to start animation)
function startDemoAnimation(): void {
  const text = 'tuiuiu.js';
  const charSpacing = 1;
  const letterHeight = 5;

  // Calculate total width
  let totalWidth = 0;
  for (const char of text) {
    const glyph = PIXEL_FONT[char];
    if (glyph) {
      totalWidth += glyph[0]!.length + charSpacing;
    }
  }
  totalWidth -= charSpacing;

  // Center on canvas
  const startX = Math.floor((layout.canvasWidth - totalWidth) / 2);
  const startY = Math.floor((layout.canvasHeight - letterHeight) / 2);

  // Collect all pixels to draw (in order: left to right, top to bottom per char)
  const pixels: Point[] = [];
  let cursorX = startX;

  for (const char of text) {
    const glyph = PIXEL_FONT[char];
    if (!glyph) continue;

    // Draw each character column by column (top to bottom, then next column)
    for (let col = 0; col < glyph[0]!.length; col++) {
      for (let row = 0; row < glyph.length; row++) {
        const line = glyph[row]!;
        if (line[col] === '█') {
          pixels.push({ x: cursorX + col, y: startY + row });
        }
      }
    }

    cursorX += glyph[0]!.length + charSpacing;
  }

  // Start the animation by setting the pixels and resetting index
  setDemoPixelIndex(0);
  setDemoPixels(pixels);
}

// =============================================================================
// Main App
// =============================================================================

function MSPaintApp(): VNode {
  const { exit } = useApp();
  const { columns, rows } = useTerminalSize();

  // Recalculate layout if terminal size changed
  // BUT: don't reinitialize on every render! Only on actual size change.
  const newLayout = calculateLayout(columns, rows);
  const sizeChanged = newLayout.canvasWidth !== layout.canvasWidth || newLayout.canvasHeight !== layout.canvasHeight;
  if (sizeChanged) {
    initCanvas(newLayout);
    // Don't call setCanvasVersion here - it causes infinite re-render loop!
  }

  // Demo logo animation using useInterval (instead of setTimeout)
  // The interval is enabled only when there are pixels left to draw
  useInterval(
    () => {
      const pixels = demoPixels();
      const index = demoPixelIndex();
      if (index < pixels.length) {
        const { x, y } = pixels[index]!;
        setPixelWithColor(x, y, '█', DEMO_COLOR);
        setDemoPixelIndex(index + 1);
        setCanvasVersion((v) => v + 1);
      } else {
        // Animation complete - clear the pixels array to stop interval
        setDemoPixels([]);
      }
    },
    PIXEL_DELAY,
    { enabled: demoPixels().length > 0 && demoPixelIndex() < demoPixels().length }
  );

  // Keyboard shortcuts
  useHotkeys('1', () => setCurrentTool('pencil'));
  useHotkeys('2', () => setCurrentTool('line'));
  useHotkeys('3', () => setCurrentTool('rectangle'));
  useHotkeys('4', () => setCurrentTool('circle'));
  useHotkeys('5', () => setCurrentTool('fill'));
  useHotkeys('6', () => setCurrentTool('eraser'));
  useHotkeys('d', () => startDemoAnimation());
  useHotkeys('c', () => clearCanvas());
  useHotkeys('q', () => exit());

  // Mouse handling
  // API: action = 'click' | 'double-click' | 'drag' | 'release' | 'move'
  useMouse((event) => {
    const { x, y, action, button } = event;

    // Always track raw position
    setRawMousePos({ x, y });

    // Calculate canvas-relative coordinates using layout
    const canvasX = x - layout.canvasOffsetX;
    const canvasY = y - layout.canvasOffsetY;

    setMousePos({ x: canvasX, y: canvasY });

    // Handle clicks (for tool and color selection)
    if (action === 'click') {
      // Always show raw click position first
      const inCanvas = isInCanvas(canvasX, canvasY);
      setLastClick(`raw:${x},${y} cv:${canvasX},${canvasY} ${inCanvas ? 'IN' : 'OUT'}`);

      // All sidebar clicks (x < sidebar width)
      if (x < layout.sidebarWidth) {
        // Check tool clicks (y in tools section)
        if (y >= layout.toolsStartY && y < layout.paletteStartY) {
          const toolIndex = y - layout.toolsStartY - 1; // -1 for "Tools" label
          if (toolIndex >= 0 && toolIndex < TOOLS.length) {
            setCurrentTool(TOOLS[toolIndex]!.id);
            setLastClick(`tool:${TOOLS[toolIndex]!.id}`);
          }
          return;
        }

        // Check palette clicks (y in palette section)
        // Palette: 4 colors per row, each color is 2 chars wide (██)
        // Palette has paddingLeft: 1, so adjust x coordinate
        if (y >= layout.paletteStartY) {
          const paletteRow = y - layout.paletteStartY - 1; // -1 for "Palette" label
          const paletteX = x - 1;  // -1 for paddingLeft
          const paletteCol = Math.floor(paletteX / 2);  // Each color swatch is 2 chars

          if (paletteRow >= 0 && paletteX >= 0 && paletteCol >= 0 && paletteCol < PALETTE_COLS) {
            const colorIndex = paletteRow * PALETTE_COLS + paletteCol;
            if (colorIndex >= 0 && colorIndex < PALETTE_COLORS.length) {
              setPrimaryColor(PALETTE_COLORS[colorIndex]!);
              setLastClick(`color:${colorIndex}=${PALETTE_COLORS[colorIndex]}`);
            }
          }
          return;
        }
        return;
      }

      // Click on canvas - handle single point tools
      if (isInCanvas(canvasX, canvasY)) {
        const tool = currentTool();
        const color = button === 'right' ? secondaryColor() : primaryColor();

        if (tool === 'pencil') {
          setPixelWithColor(canvasX, canvasY, '█', color);
          // Verify it was set using canvas API
          const setChar = canvas.getPixel(canvasX, canvasY);
          const setColor = canvas.getPixelColor(canvasX, canvasY);
          setCanvasVersion((v) => v + 1);
          setLastClick(`★DRAW★ ${canvasX},${canvasY} ch:'${setChar}' col:${setColor ? 'SET' : 'NULL'}`);
        } else if (tool === 'eraser') {
          erasePixel(canvasX, canvasY);
          setCanvasVersion((v) => v + 1);
          setLastClick(`erase@${canvasX},${canvasY}`);
        } else if (tool === 'fill') {
          floodFillWithColor(canvasX, canvasY, color);
          setCanvasVersion((v) => v + 1);
          setLastClick(`fill@${canvasX},${canvasY}`);
        } else {
          // For line, rect, circle - set start point
          setStartPoint({ x: canvasX, y: canvasY });
          setIsDrawing(true);
          setLastClick(`start@${canvasX},${canvasY}`);
        }
      }
      return;
    }

    // Handle drag (for continuous drawing)
    if (action === 'drag') {
      if (isInCanvas(canvasX, canvasY)) {
        const tool = currentTool();
        const color = button === 'right' ? secondaryColor() : primaryColor();

        if (tool === 'pencil') {
          const start = startPoint();
          if (start) {
            drawLine(start.x, start.y, canvasX, canvasY, color);
          } else {
            setPixelWithColor(canvasX, canvasY, '█', color);
          }
          setStartPoint({ x: canvasX, y: canvasY });
          setCanvasVersion((v) => v + 1);
        } else if (tool === 'eraser') {
          const start = startPoint();
          if (start) {
            const pts = bresenhamLine(start.x, start.y, canvasX, canvasY);
            for (const p of pts) erasePixel(p.x, p.y);
          } else {
            erasePixel(canvasX, canvasY);
          }
          setStartPoint({ x: canvasX, y: canvasY });
          setCanvasVersion((v) => v + 1);
        }
      }
      return;
    }

    // Handle release (for shape tools - draw the final shape)
    if (action === 'release') {
      if (isDrawing() && isInCanvas(canvasX, canvasY)) {
        const start = startPoint();
        if (start) {
          const tool = currentTool();
          const color = button === 'right' ? secondaryColor() : primaryColor();

          switch (tool) {
            case 'line':
              drawLine(start.x, start.y, canvasX, canvasY, color);
              setLastClick(`line`);
              break;
            case 'rectangle':
              drawRectangle(start.x, start.y, canvasX, canvasY, color);
              setLastClick(`rect`);
              break;
            case 'circle':
              drawCircle(start.x, start.y, canvasX, canvasY, color);
              setLastClick(`circle`);
              break;
          }
          setCanvasVersion((v) => v + 1);
        }
      }
      setIsDrawing(false);
      setStartPoint(null);
      return;
    }
  });

  // Force re-render on canvas change
  const version = canvasVersion();

  const tool = currentTool();
  const pos = mousePos();
  const primary = primaryColor();



  // Build canvas display using canvas.render() which returns ANSI-colored strings
  // canvas.render() now handles color encoding automatically
  const renderedLines = canvas.render();
  const canvasLines: VNode[] = renderedLines.map((line) =>
    Box({ height: 1 }, Text({}, line))
  );

  // Build sidebar palette (5 colors per row, 2 cells each)
  const paletteRows: VNode[] = [];
  for (let row = 0; row < PALETTE_ROWS; row++) {
    const rowColors: VNode[] = [];
    // Leading space with gray background
    rowColors.push(Text({ backgroundColor: '#C0C0C0' }, ' '));
    for (let col = 0; col < PALETTE_COLS; col++) {
      const colorIndex = row * PALETTE_COLS + col;
      if (colorIndex < PALETTE_COLORS.length) {
        const c = PALETTE_COLORS[colorIndex]!;
        const isSelected = c === primary;
        // Each swatch: 2 chars wide - selected shows []
        rowColors.push(
          Text({
            backgroundColor: c,
            color: isSelected ? '#FFFFFF' : c,
            bold: isSelected,
          }, isSelected ? '[]' : '██')
        );
      }
    }
    // Trailing space with gray background (ensures full width)
    rowColors.push(Text({ backgroundColor: '#C0C0C0' }, ' '));
    paletteRows.push(Box({ height: 1, flexDirection: 'row', backgroundColor: '#C0C0C0' }, ...rowColors));
  }

  return Box(
    { flexDirection: 'column', width: columns, height: rows },

    // Header - Blue title bar (full width)
    Box(
      { height: layout.headerHeight, width: columns, backgroundColor: '#000080' },
      Text({ color: '#FFFFFF', bold: true }, ' Tuiuiu Brush')
    ),

    // Main area: sidebar + canvas
    Box(
      { flexDirection: 'row', flexGrow: 1 },

      // Sidebar: Tools + Palette (full height)
      Box(
        { flexDirection: 'column', width: layout.sidebarWidth, height: layout.canvasHeight, backgroundColor: '#C0C0C0' },

        // Tools section
        Text({ color: '#000000', bold: true, backgroundColor: '#C0C0C0' }, ' Tools'),
        ...TOOLS.map((t) =>
          Box(
            { height: 1, width: layout.sidebarWidth, backgroundColor: tool === t.id ? '#000080' : '#C0C0C0' },
            Text(
              { color: tool === t.id ? '#FFFFFF' : '#000000', bold: tool === t.id },
              ` [${t.key}] ${t.name}`
            )
          )
        ),

        // Divider
        Text({ color: '#808080', backgroundColor: '#C0C0C0' }, '─'.repeat(layout.sidebarWidth)),

        // Palette section
        Text({ color: '#000000', bold: true, backgroundColor: '#C0C0C0' }, ' Palette'),
        Box(
          { flexDirection: 'column', width: layout.sidebarWidth, backgroundColor: '#C0C0C0' },
          ...paletteRows
        ),

        // Spacer fills remaining height with gray background
        Box({ flexGrow: 1, backgroundColor: '#C0C0C0' })
      ),

      // Canvas area - white background, no border
      Box(
        { backgroundColor: '#FFFFFF', width: layout.canvasWidth, height: layout.canvasHeight },
        Box({ flexDirection: 'column' }, ...canvasLines)
      )
    )
  );
}

// =============================================================================
// Main Entry Point
// =============================================================================

setTheme(darkTheme);

const { waitUntilExit } = render(MSPaintApp);
await waitUntilExit();
