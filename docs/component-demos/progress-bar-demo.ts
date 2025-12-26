/**
 * ProgressBar Demo - For documentation GIF
 * Shows multiple animated progress bars with different speeds
 */

import { render, Box, Text, ProgressBar, createSignal, useEffect, useApp, type VNode } from '../../src/index.js';

function ProgressDemo(): VNode {
  const [p1, setP1] = createSignal(0);
  const [p2, setP2] = createSignal(30);
  const [p3, setP3] = createSignal(60);
  const { exit } = useApp();

  useEffect(() => {
    const interval = setInterval(() => {
      setP1(p => (p >= 100 ? 0 : p + 3));
      setP2(p => (p >= 100 ? 0 : p + 2));
      setP3(p => (p >= 100 ? 0 : p + 1));
    }, 80);

    setTimeout(() => exit(), 8000);
    return () => clearInterval(interval);
  });

  return Box(
    { flexDirection: 'column', padding: 1, gap: 1 },
    Text({ color: 'cyan', bold: true }, '📊 Progress Bars'),
    Box({ flexDirection: 'row', gap: 2 },
      Text({ color: 'gray', width: 12 }, 'Download'),
      ProgressBar({ value: p1(), width: 30, color: 'cyan' }),
      Text({ color: 'white', width: 5 }, `${p1()}%`)
    ),
    Box({ flexDirection: 'row', gap: 2 },
      Text({ color: 'gray', width: 12 }, 'Upload'),
      ProgressBar({ value: p2(), width: 30, color: 'green' }),
      Text({ color: 'white', width: 5 }, `${p2()}%`)
    ),
    Box({ flexDirection: 'row', gap: 2 },
      Text({ color: 'gray', width: 12 }, 'Processing'),
      ProgressBar({ value: p3(), width: 30, color: 'yellow' }),
      Text({ color: 'white', width: 5 }, `${p3()}%`)
    )
  );
}

render(() => ProgressDemo());
