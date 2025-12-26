/**
 * Glow Animation Demo
 */
import { render, Box, Text, AnimatedPicture, createPixelGridFromColors, useApp, useEffect, type VNode } from '../../../src/index.js';

const star = createPixelGridFromColors([
  [null, null, null, 'yellow', null, null, null],
  [null, null, 'yellow', 'yellow', 'yellow', null, null],
  [null, 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', null],
  ['yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow'],
  [null, 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', null],
  [null, null, 'yellow', null, 'yellow', null, null],
  [null, 'yellow', null, null, null, 'yellow', null],
] as (string | null)[][]);

function Demo(): VNode {
  const { exit } = useApp();
  useEffect(() => { setTimeout(() => exit(), 5000); });

  return Box(
    { flexDirection: 'column', padding: 1, alignItems: 'center' },
    Text({ color: 'yellow', bold: true }, 'GLOW'),
    Text({ color: 'gray', dim: true }, 'Subtle brightness variation'),
    Box({ height: 1 }),
    AnimatedPicture({ pixels: star, animation: 'glow', duration: 1500, minBrightness: 0.6 }),
    Box({ height: 1 }),
    Text({ color: 'gray' }, 'Use: Ambient highlights, hover states')
  );
}

render(() => Demo());
