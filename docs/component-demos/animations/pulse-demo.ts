/**
 * Pulse Animation Demo
 */
import { render, Box, Text, AnimatedPicture, createPixelGridFromColors, useApp, useEffect, type VNode } from '../../../src/index.js';

const heart = createPixelGridFromColors([
  [null, 'red', 'red', null, null, 'red', 'red', null],
  ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
  ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
  ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
  [null, 'red', 'red', 'red', 'red', 'red', 'red', null],
  [null, null, 'red', 'red', 'red', 'red', null, null],
  [null, null, null, 'red', 'red', null, null, null],
] as (string | null)[][]);

function Demo(): VNode {
  const { exit } = useApp();
  useEffect(() => { setTimeout(() => exit(), 5000); });

  return Box(
    { flexDirection: 'column', padding: 1, alignItems: 'center' },
    Text({ color: 'cyan', bold: true }, 'PULSE'),
    Text({ color: 'gray', dim: true }, 'Fast sine wave oscillation'),
    Box({ height: 1 }),
    AnimatedPicture({ pixels: heart, animation: 'pulse', duration: 1000, minBrightness: 0.3 }),
    Box({ height: 1 }),
    Text({ color: 'gray' }, 'Use: Alerts, notifications, attention')
  );
}

render(() => Demo());
