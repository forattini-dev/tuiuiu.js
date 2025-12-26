/**
 * FadeIn Animation Demo
 */
import { render, Box, Text, AnimatedPicture, createPixelGridFromColors, useApp, useEffect, createSignal, type VNode } from '../../../src/index.js';

const logo = createPixelGridFromColors([
  ['#00bcd4', '#00bcd4', '#00bcd4', '#00bcd4', '#00bcd4', '#00bcd4', '#00bcd4'],
  ['#00bcd4', null, null, null, null, null, '#00bcd4'],
  ['#00bcd4', null, '#00bcd4', '#00bcd4', '#00bcd4', null, '#00bcd4'],
  ['#00bcd4', null, '#00bcd4', '#00bcd4', '#00bcd4', null, '#00bcd4'],
  ['#00bcd4', null, '#00bcd4', '#00bcd4', '#00bcd4', null, '#00bcd4'],
  ['#00bcd4', null, null, null, null, null, '#00bcd4'],
  ['#00bcd4', '#00bcd4', '#00bcd4', '#00bcd4', '#00bcd4', '#00bcd4', '#00bcd4'],
] as (string | null)[][]);

function Demo(): VNode {
  const { exit } = useApp();
  const [key, setKey] = createSignal(0);

  useEffect(() => {
    const interval = setInterval(() => setKey(k => k + 1), 2000);
    setTimeout(() => exit(), 6000);
    return () => clearInterval(interval);
  });

  return Box(
    { flexDirection: 'column', padding: 1, alignItems: 'center' },
    Text({ color: 'cyan', bold: true }, 'FADE IN'),
    Text({ color: 'gray', dim: true }, 'Gradual appearance'),
    Box({ height: 1 }),
    AnimatedPicture({
      pixels: logo,
      animation: 'fadeIn',
      duration: 1500,
      minBrightness: 0.1,
      loop: false,
      easing: 'ease-out',
    }),
    Box({ height: 1 }),
    Text({ color: 'gray' }, 'Use: Splash screens, entry animations')
  );
}

render(() => Demo());
