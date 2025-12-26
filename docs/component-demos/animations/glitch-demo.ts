/**
 * Glitch Animation Demo
 */
import { render, Box, Text, AnimatedPicture, createPixelGridFromColors, useApp, useEffect, type VNode } from '../../../src/index.js';

const error = createPixelGridFromColors([
  ['red', 'red', 'red', 'red', 'red', 'red', 'red'],
  ['red', null, null, null, null, null, 'red'],
  ['red', null, 'red', 'red', 'red', null, 'red'],
  ['red', null, 'red', null, 'red', null, 'red'],
  ['red', null, 'red', 'red', 'red', null, 'red'],
  ['red', null, null, null, null, null, 'red'],
  ['red', 'red', 'red', 'red', 'red', 'red', 'red'],
] as (string | null)[][]);

function Demo(): VNode {
  const { exit } = useApp();
  useEffect(() => { setTimeout(() => exit(), 5000); });

  return Box(
    { flexDirection: 'column', padding: 1, alignItems: 'center' },
    Text({ color: 'red', bold: true }, 'GLITCH'),
    Text({ color: 'gray', dim: true }, 'Random distortion/scrambling'),
    Box({ height: 1 }),
    AnimatedPicture({ pixels: error, animation: 'glitch', duration: 500 }),
    Box({ height: 1 }),
    Text({ color: 'gray' }, 'Use: Error states, retro, cyberpunk')
  );
}

render(() => Demo());
