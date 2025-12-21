/**
 * Graphics & Braille Example
 *
 * Showcases graphics capabilities:
 * - Braille character rendering (2x4 dot matrix)
 * - Image creation and scaling
 * - Gradient generation
 * - Pattern rendering
 * - ASCII art visualization
 *
 * Run with: npx tsx examples/16-graphics-braille.ts
 */

import {
  render,
  Box,
  Text,
  useState,
  useEffect,
  useInput,
  useApp,
  brailleGraphics,
  createImageData,
  createSolidImage,
  createGradientImage,
  scaleImage,
  Divider,
  setTheme,
  darkTheme,
} from '../src/index.js';

// Apply dark theme
setTheme(darkTheme);

type DemoType = 'shapes' | 'gradient' | 'wave' | 'pattern' | 'animation';

// Braille dots for a 2x4 grid
// The Unicode braille block starts at 0x2800
// Dot pattern:
// 1 4
// 2 5
// 3 6
// 7 8
const BRAILLE_BASE = 0x2800;

// Custom braille rendering function using getPixel callback
function renderBraille(width: number, height: number, getPixel: (x: number, y: number) => boolean): string {
  const charWidth = Math.ceil(width / 2);
  const charHeight = Math.ceil(height / 4);
  const lines: string[] = [];

  for (let cy = 0; cy < charHeight; cy++) {
    let line = '';
    for (let cx = 0; cx < charWidth; cx++) {
      const px = cx * 2;
      const py = cy * 4;

      // Build the braille character from 8 dots
      let dots = 0;

      // Left column: dots 1, 2, 3, 7
      if (getPixel(px, py)) dots |= 0x01;
      if (getPixel(px, py + 1)) dots |= 0x02;
      if (getPixel(px, py + 2)) dots |= 0x04;
      if (getPixel(px, py + 3)) dots |= 0x40;

      // Right column: dots 4, 5, 6, 8
      if (getPixel(px + 1, py)) dots |= 0x08;
      if (getPixel(px + 1, py + 1)) dots |= 0x10;
      if (getPixel(px + 1, py + 2)) dots |= 0x20;
      if (getPixel(px + 1, py + 3)) dots |= 0x80;

      line += String.fromCharCode(BRAILLE_BASE + dots);
    }
    lines.push(line);
  }

  return lines.join('\n');
}

function GraphicsDemo() {
  const app = useApp();
  const [activeDemo, setActiveDemo] = useState<DemoType>('shapes');
  const [animFrame, setAnimFrame] = useState(0);

  // Animation loop
  useEffect(() => {
    if (activeDemo() !== 'animation') return;

    const interval = setInterval(() => {
      setAnimFrame(f => (f + 1) % 60);
    }, 50);

    return () => clearInterval(interval);
  });

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      app.exit();
    }
    if (input === '1') setActiveDemo('shapes');
    if (input === '2') setActiveDemo('gradient');
    if (input === '3') setActiveDemo('wave');
    if (input === '4') setActiveDemo('pattern');
    if (input === '5') setActiveDemo('animation');
  });

  // Draw a circle
  const drawCircle = (cx: number, cy: number, r: number) => (x: number, y: number) => {
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= r * r;
  };

  // Draw a rectangle
  const drawRect = (rx: number, ry: number, rw: number, rh: number) => (x: number, y: number) => {
    return x >= rx && x < rx + rw && y >= ry && y < ry + rh;
  };

  // Draw a line
  const drawLine = (x1: number, y1: number, x2: number, y2: number, thickness: number = 1) => (x: number, y: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return false;

    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (length * length)));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);

    return dist <= thickness;
  };

  // Combine shapes
  const combineShapes = (...shapes: ((x: number, y: number) => boolean)[]) => (x: number, y: number) => {
    return shapes.some(shape => shape(x, y));
  };

  const renderDemo = () => {
    switch (activeDemo()) {
      case 'shapes': {
        const width = 80;
        const height = 32;

        // Draw multiple shapes
        const circle1 = drawCircle(15, 16, 12);
        const circle2 = drawCircle(45, 16, 10);
        const rect1 = drawRect(60, 4, 16, 24);
        const line1 = drawLine(25, 8, 35, 24, 2);

        const combined = combineShapes(circle1, circle2, rect1, line1);
        const output = renderBraille(width, height, combined);

        return Box(
          { flexDirection: 'column' },
          Text({ color: 'cyan', bold: true, marginBottom: 1 }, 'Braille Shapes'),
          Text({ color: 'gray', marginBottom: 1 }, 'Circles, rectangles, and lines rendered with 2x4 dot matrix'),
          Box(
            { borderStyle: 'single', borderColor: 'gray', padding: 1, flexDirection: 'column' },
            ...output.split('\n').map((line, i) =>
              Text({ key: `line-${i}`, color: 'cyan' }, line)
            )
          ),
          Text({ color: 'gray', dim: true, marginTop: 1 }, `Resolution: ${width}x${height} pixels = ${width / 2}x${height / 4} braille chars`)
        );
      }

      case 'gradient': {
        const width = 60;
        const height = 24;

        // Horizontal gradient with dithering
        const horizontalGradient = (x: number, y: number) => {
          const threshold = (x / width) * 255;
          return Math.random() * 255 < threshold;
        };

        // Radial gradient
        const cx = width / 2;
        const cy = height / 2;
        const maxDist = Math.sqrt(cx * cx + cy * cy);
        const radialGradient = (x: number, y: number) => {
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          const threshold = (1 - dist / maxDist) * 255;
          return Math.random() * 255 < threshold;
        };

        const hOutput = renderBraille(width, height, horizontalGradient);
        const rOutput = renderBraille(width, height, radialGradient);

        return Box(
          { flexDirection: 'column' },
          Text({ color: 'magenta', bold: true, marginBottom: 1 }, 'Dithered Gradients'),

          Text({ color: 'gray' }, 'Horizontal:'),
          Box(
            { borderStyle: 'single', borderColor: 'gray', padding: 0, marginBottom: 1, flexDirection: 'column' },
            ...hOutput.split('\n').map((line, i) => Text({ key: `h-${i}`, color: 'magenta' }, line))
          ),

          Text({ color: 'gray' }, 'Radial:'),
          Box(
            { borderStyle: 'single', borderColor: 'gray', padding: 0, flexDirection: 'column' },
            ...rOutput.split('\n').map((line, i) => Text({ key: `r-${i}`, color: 'yellow' }, line))
          )
        );
      }

      case 'wave': {
        const width = 80;
        const height = 32;

        // Sine wave
        const sineWave = (x: number, y: number) => {
          const waveY = height / 2 + Math.sin(x * 0.15) * 10;
          return Math.abs(y - waveY) < 2;
        };

        // Cosine wave (offset)
        const cosineWave = (x: number, y: number) => {
          const waveY = height / 2 + Math.cos(x * 0.15) * 8;
          return Math.abs(y - waveY) < 1.5;
        };

        // Axis
        const axis = (x: number, y: number) => {
          return y === Math.floor(height / 2) || x === 0;
        };

        const combined = combineShapes(axis, sineWave, cosineWave);
        const output = renderBraille(width, height, combined);

        return Box(
          { flexDirection: 'column' },
          Text({ color: 'green', bold: true, marginBottom: 1 }, 'Wave Functions'),
          Text({ color: 'gray', marginBottom: 1 }, 'Sine and cosine waves with axis'),
          Box(
            { borderStyle: 'single', borderColor: 'gray', padding: 1, flexDirection: 'column' },
            ...output.split('\n').map((line, i) => Text({ key: `w-${i}`, color: 'green' }, line))
          ),
          Text({ color: 'gray', dim: true, marginTop: 1 }, 'sin(x * 0.15) and cos(x * 0.15)')
        );
      }

      case 'pattern': {
        const width = 60;
        const height = 32;

        // Checkerboard pattern
        const checkerboard = (x: number, y: number) => {
          const size = 6;
          return (Math.floor(x / size) + Math.floor(y / size)) % 2 === 0;
        };

        // Diagonal stripes
        const diagonalStripes = (x: number, y: number) => {
          return ((x + y) % 8) < 4;
        };

        // Dots pattern
        const dots = (x: number, y: number) => {
          const size = 8;
          const cx = (x % size) - size / 2;
          const cy = (y % size) - size / 2;
          return cx * cx + cy * cy < 4;
        };

        const checkOutput = renderBraille(width, height, checkerboard);
        const stripeOutput = renderBraille(width, height, diagonalStripes);

        return Box(
          { flexDirection: 'column' },
          Text({ color: 'yellow', bold: true, marginBottom: 1 }, 'Patterns'),

          Box(
            { flexDirection: 'row', gap: 2 },
            Box(
              { flexDirection: 'column' },
              Text({ color: 'gray' }, 'Checkerboard:'),
              Box(
                { borderStyle: 'single', borderColor: 'gray', flexDirection: 'column' },
                ...checkOutput.split('\n').map((line, i) => Text({ key: `c-${i}`, color: 'yellow' }, line))
              )
            ),
            Box(
              { flexDirection: 'column' },
              Text({ color: 'gray' }, 'Stripes:'),
              Box(
                { borderStyle: 'single', borderColor: 'gray', flexDirection: 'column' },
                ...stripeOutput.split('\n').map((line, i) => Text({ key: `s-${i}`, color: 'cyan' }, line))
              )
            )
          )
        );
      }

      case 'animation': {
        const width = 60;
        const height = 24;
        const frame = animFrame();

        // Bouncing ball
        const ballX = width / 2 + Math.cos(frame * 0.1) * 20;
        const ballY = height / 2 + Math.sin(frame * 0.15) * 8;
        const ball = drawCircle(ballX, ballY, 5);

        // Rotating line
        const angle = frame * 0.1;
        const lineX1 = width / 2;
        const lineY1 = height / 2;
        const lineX2 = lineX1 + Math.cos(angle) * 15;
        const lineY2 = lineY1 + Math.sin(angle) * 8;
        const rotateLine = drawLine(lineX1, lineY1, lineX2, lineY2, 1);

        // Pulsing circle
        const pulseRadius = 8 + Math.sin(frame * 0.2) * 3;
        const pulseCircle = (x: number, y: number) => {
          const cx = width / 4;
          const cy = height / 2;
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          return Math.abs(dist - pulseRadius) < 1.5;
        };

        const combined = combineShapes(ball, rotateLine, pulseCircle);
        const output = renderBraille(width, height, combined);

        return Box(
          { flexDirection: 'column' },
          Text({ color: 'red', bold: true, marginBottom: 1 }, 'Animation'),
          Text({ color: 'gray', marginBottom: 1 }, `Frame: ${frame}/60 - Bouncing ball, rotating line, pulsing circle`),
          Box(
            { borderStyle: 'single', borderColor: 'gray', padding: 1, flexDirection: 'column' },
            ...output.split('\n').map((line, i) => Text({ key: `a-${i}`, color: 'red' }, line))
          ),
          Text({ color: 'gray', dim: true, marginTop: 1 }, 'Real-time animation at ~20 FPS')
        );
      }

      default:
        return Text({}, 'Select a demo');
    }
  };

  return Box(
    {
      flexDirection: 'column',
      padding: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    },
    // Header
    Box(
      { marginBottom: 1 },
      Text({ color: 'cyan', bold: true }, ' Graphics & Braille Demo ')
    ),

    // Navigation
    Box(
      { marginBottom: 1 },
      Text({ color: activeDemo() === 'shapes' ? 'cyan' : 'gray' }, '[1] Shapes  '),
      Text({ color: activeDemo() === 'gradient' ? 'magenta' : 'gray' }, '[2] Gradient  '),
      Text({ color: activeDemo() === 'wave' ? 'green' : 'gray' }, '[3] Wave  '),
      Text({ color: activeDemo() === 'pattern' ? 'yellow' : 'gray' }, '[4] Pattern  '),
      Text({ color: activeDemo() === 'animation' ? 'red' : 'gray' }, '[5] Animation')
    ),

    Divider({}),

    // Demo content
    Box({ marginTop: 1 }, renderDemo()),

    // Footer
    Box(
      { marginTop: 1 },
      Text({ color: 'gray', dim: true }, '[1-5] Switch demo  [Q] Exit')
    )
  );
}

// Run the demo
const { waitUntilExit } = render(GraphicsDemo);
await waitUntilExit();
