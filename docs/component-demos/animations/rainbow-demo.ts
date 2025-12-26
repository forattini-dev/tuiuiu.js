/**
 * Rainbow Animation Demo
 */
import { render, Box, Text, AnimatedPicture, createPixelGridFromColors, useApp, useEffect, type VNode } from '../../../src/index.js';

const diamond = createPixelGridFromColors([
  [null, null, null, 'white', null, null, null],
  [null, null, 'white', 'white', 'white', null, null],
  [null, 'white', 'white', 'white', 'white', 'white', null],
  ['white', 'white', 'white', 'white', 'white', 'white', 'white'],
  [null, 'white', 'white', 'white', 'white', 'white', null],
  [null, null, 'white', 'white', 'white', null, null],
  [null, null, null, 'white', null, null, null],
] as (string | null)[][]);

function Demo(): VNode {
  const { exit } = useApp();
  useEffect(() => { setTimeout(() => exit(), 5000); });

  return Box(
    { flexDirection: 'column', padding: 1, alignItems: 'center' },
    Text({ color: 'magenta', bold: true }, 'RAINBOW'),
    Text({ color: 'gray', dim: true }, 'Cycle through spectrum colors'),
    Box({ height: 1 }),
    AnimatedPicture({ pixels: diamond, animation: 'rainbow', duration: 2000 }),
    Box({ height: 1 }),
    Text({ color: 'gray' }, 'Use: Celebration, fun, success')
  );
}

render(() => Demo());
