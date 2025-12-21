/**
 * Example: Growth Config
 *
 * Demonstrates the 'fillStep' configuration for fill-and-clear animation.
 */

import {
  render,
  Box,
  Text,
  useApp,
  useInput,
  renderProgressBar,
  createProgressBar,
} from '../src/index.js';

function GrowthDemo() {
  const { exit } = useApp();

  useInput((char, key) => {
    if (key.escape || (key.ctrl && char === 'c')) {
      exit();
    }
  });

  const bar1 = createProgressBar();
  const bar2 = createProgressBar();
  const bar3 = createProgressBar();

  return Box(
    { flexDirection: 'column', padding: 1, gap: 1 },
    Text({ color: 'cyan', bold: true }, '📈 Bar Growth (Fill-and-Clear) Configuration'),
    Text({ color: 'gray' }, 'Press ESC to quit'),
    
    Text({}),
    Text({ bold: true }, '1. Default (Step = 1)'),
    renderProgressBar(bar1, {
      indeterminate: true,
      indeterminateStyle: 'fill-and-clear',
      fillStep: 1,
      width: 40,
      color: 'blue'
    }),

    Text({}),
    Text({ bold: true }, '2. Faster/Blockier (Step = 2)'),
    renderProgressBar(bar2, {
      indeterminate: true,
      indeterminateStyle: 'fill-and-clear',
      fillStep: 2,
      width: 40,
      color: 'green'
    }),

    Text({}),
    Text({ bold: true }, '3. Very Fast/Blocky (Step = 4)'),
    renderProgressBar(bar3, {
      indeterminate: true,
      indeterminateStyle: 'fill-and-clear',
      fillStep: 4,
      width: 40,
      color: 'magenta'
    })
  );
}

const { waitUntilExit } = render(() => GrowthDemo());
await waitUntilExit();
