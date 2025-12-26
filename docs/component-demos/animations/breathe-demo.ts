/**
 * Breathe Animation Demo
 */
import { render, Box, Text, AnimatedPicture, createPixelGridFromColors, useApp, useEffect, type VNode } from '../../../src/index.js';

const circle = createPixelGridFromColors([
  [null, null, 'cyan', 'cyan', 'cyan', null, null],
  [null, 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', null],
  ['cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan'],
  ['cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan'],
  ['cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan'],
  [null, 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', null],
  [null, null, 'cyan', 'cyan', 'cyan', null, null],
] as (string | null)[][]);

function Demo(): VNode {
  const { exit } = useApp();
  useEffect(() => { setTimeout(() => exit(), 6000); });

  return Box(
    { flexDirection: 'column', padding: 1, alignItems: 'center' },
    Text({ color: 'cyan', bold: true }, 'BREATHE'),
    Text({ color: 'gray', dim: true }, 'Slow, smooth breathing'),
    Box({ height: 1 }),
    AnimatedPicture({ pixels: circle, animation: 'breathe', duration: 3000, minBrightness: 0.3 }),
    Box({ height: 1 }),
    Text({ color: 'gray' }, 'Use: Idle states, ambient, loading')
  );
}

render(() => Demo());
