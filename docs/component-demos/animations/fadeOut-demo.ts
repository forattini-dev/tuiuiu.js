/**
 * FadeOut Animation Demo
 */
import { render, Box, Text, AnimatedPicture, createPixelGridFromColors, useApp, useEffect, createSignal, type VNode } from '../../../src/index.js';

const logo = createPixelGridFromColors([
  ['magenta', 'magenta', 'magenta', 'magenta', 'magenta', 'magenta', 'magenta'],
  ['magenta', null, null, null, null, null, 'magenta'],
  ['magenta', null, 'magenta', 'magenta', 'magenta', null, 'magenta'],
  ['magenta', null, 'magenta', 'magenta', 'magenta', null, 'magenta'],
  ['magenta', null, 'magenta', 'magenta', 'magenta', null, 'magenta'],
  ['magenta', null, null, null, null, null, 'magenta'],
  ['magenta', 'magenta', 'magenta', 'magenta', 'magenta', 'magenta', 'magenta'],
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
    Text({ color: 'magenta', bold: true }, 'FADE OUT'),
    Text({ color: 'gray', dim: true }, 'Gradual disappearance'),
    Box({ height: 1 }),
    AnimatedPicture({
      pixels: logo,
      animation: 'fadeOut',
      duration: 1500,
      minBrightness: 0.1,
      loop: false,
      easing: 'ease-in',
    }),
    Box({ height: 1 }),
    Text({ color: 'gray' }, 'Use: Exit animations, dismissals')
  );
}

render(() => Demo());
