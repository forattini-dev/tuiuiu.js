/**
 * Example: Loading Styles
 *
 * Demonstrates the different indeterminate loading styles for ProgressBar.
 *
 * Run: pnpm tsx examples/loading-styles.ts
 */

import {
  render,
  Box,
  Text,
  useApp,
  useInput,
  createProgressBar,
  renderProgressBar,
  ProgressBar,
} from '../src/index.js';

function LoadingStylesDemo() {
  const { exit } = useApp();

  useInput((char, key) => {
    if (key.escape || (key.ctrl && char === 'c')) {
      exit();
    }
  });

  // Create state managers for renderProgressBar
  const classicBar = createProgressBar();
  const marqueeBar = createProgressBar();
  const fillClearBar = createProgressBar();

  return Box(
    { flexDirection: 'column', padding: 1, gap: 1 },
    Text({ color: 'cyan', bold: true }, '🔄 Indeterminate Loading Styles'),
    Text({ color: 'gray' }, 'Press ESC to quit'),
    
    Text({}),
    Text({ bold: true }, '1. Classic Style (Frames)'),
    renderProgressBar(classicBar, {
      indeterminate: true,
      indeterminateStyle: 'classic',
      width: 40,
      label: 'Connecting:',
      color: 'blue'
    }),

    Text({}),
    Text({ bold: true }, '2. Marquee Style (Moving Block)'),
    renderProgressBar(marqueeBar, {
      indeterminate: true,
      indeterminateStyle: 'marquee',
      width: 40,
      label: 'Scanning:  ',
      color: 'green'
    }),

    Text({}),
    Text({ bold: true }, '3. Fill & Clear Style'),
    renderProgressBar(fillClearBar, {
      indeterminate: true,
      indeterminateStyle: 'fill-and-clear',
      width: 40,
      label: 'Updating:  ',
      color: 'magenta'
    }),

    Text({}),
    Text({ bold: true }, '4. Standalone Components'),
    ProgressBar({
        indeterminate: true,
        indeterminateStyle: 'marquee',
        width: 30,
        color: 'yellow',
        label: 'Marquee: '
    }),
    ProgressBar({
        indeterminate: true,
        indeterminateStyle: 'fill-and-clear',
        width: 30,
        color: 'red',
        label: 'Fill/Clear:'
    })
  );
}

const { waitUntilExit } = render(() => LoadingStylesDemo());
await waitUntilExit();
