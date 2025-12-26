/**
 * Shimmer Animation Demo
 */
import { render, Box, Text, AnimatedPicture, createPixelGridFromColors, useApp, useEffect, type VNode } from '../../../src/index.js';

const bar = createPixelGridFromColors([
  ['#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00'],
  ['#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00'],
] as (string | null)[][]);

function Demo(): VNode {
  const { exit } = useApp();
  useEffect(() => { setTimeout(() => exit(), 5000); });

  return Box(
    { flexDirection: 'column', padding: 1, alignItems: 'center' },
    Text({ color: 'green', bold: true }, 'SHIMMER'),
    Text({ color: 'gray', dim: true }, 'Wave of brightness across'),
    Box({ height: 1 }),
    AnimatedPicture({ pixels: bar, animation: 'shimmer', duration: 1500, minBrightness: 0.2 }),
    Box({ height: 1 }),
    Text({ color: 'gray' }, 'Use: Loading bars, progress indicators')
  );
}

render(() => Demo());
