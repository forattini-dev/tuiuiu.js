/**
 * Button Demo - For documentation GIF
 * Shows button states and interactions
 */

import { render, Box, Text, Button, createSignal, useInput, useApp, type VNode } from '../../src/index.js';

function ButtonDemo(): VNode {
  const [clicks, setClicks] = createSignal(0);
  const [focusIndex, setFocusIndex] = createSignal(0);
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.leftArrow) setFocusIndex(i => Math.max(0, i - 1));
    if (key.rightArrow) setFocusIndex(i => Math.min(2, i + 1));
    if (key.return) setClicks(c => c + 1);
    if (key.escape) exit();
  });

  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({ color: 'cyan', bold: true }, '🔘 Buttons'),
    Box({ height: 1 }),
    Box(
      { flexDirection: 'row', gap: 2 },
      Button({
        label: 'Primary',
        variant: 'primary',
        focused: focusIndex() === 0,
        onClick: () => setClicks(c => c + 1)
      }),
      Button({
        label: 'Secondary',
        variant: 'secondary',
        focused: focusIndex() === 1,
        onClick: () => setClicks(c => c + 1)
      }),
      Button({
        label: 'Danger',
        variant: 'danger',
        focused: focusIndex() === 2,
        onClick: () => setClicks(c => c + 1)
      })
    ),
    Box({ height: 1 }),
    Text({ color: 'gray' }, `Clicks: ${clicks()}`)
  );
}

render(() => ButtonDemo());
