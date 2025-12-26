/**
 * ProgressBar Demo - For documentation GIF
 * Shows animated progress bar filling up
 */

import { render, Box, Text, ProgressBar, createSignal, useEffect, useApp, type VNode } from '../../src/index.js';

function ProgressDemo(): VNode {
  const [progress, setProgress] = createSignal(0);
  const { exit } = useApp();

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          setTimeout(() => setProgress(0), 500); // Reset after reaching 100
          return 100;
        }
        return p + 2;
      });
    }, 50);

    // Auto-exit after 2 loops
    setTimeout(() => exit(), 6000);

    return () => clearInterval(interval);
  });

  return Box(
    { flexDirection: 'column', padding: 1, width: 50 },
    Text({ color: 'cyan', bold: true }, '📊 Progress Bar'),
    Box({ height: 1 }),
    ProgressBar({ value: progress(), width: 40, color: 'cyan' }),
    Box({ height: 1 }),
    Text({ color: 'white' }, `${progress()}%`)
  );
}

render(() => ProgressDemo());
