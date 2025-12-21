/**
 * Example: Spinner Pong Test
 *
 * Visualizes the current 'pong' spinner animation.
 */

import {
  render,
  Box,
  Text,
  useApp,
  useInput,
  Spinner,
} from '../src/index.js';

function SpinnerTest() {
  const { exit } = useApp();

  useInput((char, key) => {
    if (key.escape || (key.ctrl && char === 'c')) {
      exit();
    }
  });

  return Box(
    { flexDirection: 'column', padding: 1, gap: 1 },
    Text({ color: 'cyan', bold: true }, '🏓 Pong Spinner Test'),
    Text({ color: 'gray' }, 'Press ESC to quit'),
    
    Text({}),
    Text({ bold: true }, 'Current Pong:'),
    Spinner({ style: 'pong', color: 'green' })
  );
}

const { waitUntilExit } = render(() => SpinnerTest());
await waitUntilExit();
