/**
 * Blink Animation Demo
 */
import { render, Box, Text, AnimatedPicture, createPixelGridFromColors, useApp, useEffect, type VNode } from '../../../src/index.js';

const warning = createPixelGridFromColors([
  [null, null, null, 'yellow', null, null, null],
  [null, null, 'yellow', 'yellow', 'yellow', null, null],
  [null, 'yellow', 'yellow', '#000', 'yellow', 'yellow', null],
  ['yellow', 'yellow', 'yellow', '#000', 'yellow', 'yellow', 'yellow'],
  ['yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow'],
  ['yellow', 'yellow', 'yellow', '#000', 'yellow', 'yellow', 'yellow'],
  ['yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow'],
] as (string | null)[][]);

function Demo(): VNode {
  const { exit } = useApp();
  useEffect(() => { setTimeout(() => exit(), 5000); });

  return Box(
    { flexDirection: 'column', padding: 1, alignItems: 'center' },
    Text({ color: 'yellow', bold: true }, 'BLINK'),
    Text({ color: 'gray', dim: true }, 'Hard on/off toggle'),
    Box({ height: 1 }),
    AnimatedPicture({ pixels: warning, animation: 'blink', duration: 800 }),
    Box({ height: 1 }),
    Text({ color: 'gray' }, 'Use: Warnings, critical alerts')
  );
}

render(() => Demo());
