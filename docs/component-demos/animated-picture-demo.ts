/**
 * AnimatedPicture Demo - For documentation GIF
 * Shows multiple animation types side by side
 */

import {
  render,
  Box,
  Text,
  AnimatedPicture,
  createPixelGridFromColors,
  useApp,
  useEffect,
  type VNode,
} from '../../src/index.js';

// Simple pixel art: heart shape
const heartColors = [
  [null, 'red', 'red', null, null, 'red', 'red', null],
  ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
  ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
  ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
  [null, 'red', 'red', 'red', 'red', 'red', 'red', null],
  [null, null, 'red', 'red', 'red', 'red', null, null],
  [null, null, null, 'red', 'red', null, null, null],
  [null, null, null, null, null, null, null, null],
] as (string | null)[][];

// Star shape
const starColors = [
  [null, null, null, 'yellow', null, null, null],
  [null, null, 'yellow', 'yellow', 'yellow', null, null],
  [null, 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', null],
  ['yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow'],
  [null, 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', null],
  [null, null, 'yellow', null, 'yellow', null, null],
  [null, 'yellow', null, null, null, 'yellow', null],
] as (string | null)[][];

// Diamond shape
const diamondColors = [
  [null, null, null, 'cyan', null, null, null],
  [null, null, 'cyan', 'cyan', 'cyan', null, null],
  [null, 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', null],
  ['cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan'],
  [null, 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', null],
  [null, null, 'cyan', 'cyan', 'cyan', null, null],
  [null, null, null, 'cyan', null, null, null],
] as (string | null)[][];

// Loading bar
const barColors = [
  ['#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00', '#00ff00'],
] as (string | null)[][];

function AnimatedPictureDemo(): VNode {
  const { exit } = useApp();

  const heartGrid = createPixelGridFromColors(heartColors);
  const starGrid = createPixelGridFromColors(starColors);
  const diamondGrid = createPixelGridFromColors(diamondColors);
  const barGrid = createPixelGridFromColors(barColors);

  useEffect(() => {
    setTimeout(() => exit(), 10000);
  });

  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({ color: 'cyan', bold: true }, '✨ AnimatedPicture Animations'),
    Box({ height: 1 }),
    Box(
      { flexDirection: 'row', gap: 4 },
      // Pulse animation
      Box(
        { flexDirection: 'column', alignItems: 'center' },
        AnimatedPicture({
          pixels: heartGrid,
          animation: 'pulse',
          duration: 1000,
          minBrightness: 0.3,
        }),
        Text({ color: 'gray', dim: true }, 'pulse')
      ),
      // Breathe animation
      Box(
        { flexDirection: 'column', alignItems: 'center' },
        AnimatedPicture({
          pixels: starGrid,
          animation: 'breathe',
          duration: 2000,
          minBrightness: 0.2,
        }),
        Text({ color: 'gray', dim: true }, 'breathe')
      ),
      // Shimmer animation
      Box(
        { flexDirection: 'column', alignItems: 'center' },
        AnimatedPicture({
          pixels: barGrid,
          animation: 'shimmer',
          duration: 1500,
          minBrightness: 0.3,
        }),
        Text({ color: 'gray', dim: true }, 'shimmer')
      ),
      // Rainbow animation
      Box(
        { flexDirection: 'column', alignItems: 'center' },
        AnimatedPicture({
          pixels: diamondGrid,
          animation: 'rainbow',
          duration: 2000,
        }),
        Text({ color: 'gray', dim: true }, 'rainbow')
      )
    ),
    Box({ height: 1 }),
    Box(
      { flexDirection: 'row', gap: 4 },
      // Blink animation
      Box(
        { flexDirection: 'column', alignItems: 'center' },
        AnimatedPicture({
          pixels: heartGrid,
          animation: 'blink',
          duration: 800,
        }),
        Text({ color: 'gray', dim: true }, 'blink')
      ),
      // Glow animation
      Box(
        { flexDirection: 'column', alignItems: 'center' },
        AnimatedPicture({
          pixels: starGrid,
          animation: 'glow',
          duration: 1500,
          minBrightness: 0.6,
        }),
        Text({ color: 'gray', dim: true }, 'glow')
      ),
      // Glitch animation
      Box(
        { flexDirection: 'column', alignItems: 'center' },
        AnimatedPicture({
          pixels: diamondGrid,
          animation: 'glitch',
          duration: 500,
        }),
        Text({ color: 'gray', dim: true }, 'glitch')
      )
    )
  );
}

render(() => AnimatedPictureDemo());
