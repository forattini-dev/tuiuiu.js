/**
 * Example 01: Basic Counter
 *
 * Demonstrates:
 * - useState for local state
 * - useInput for keyboard handling
 * - Basic Box/Text components
 *
 * Run: pnpm tsx examples/01-basic-counter.ts
 */

import {
  render,
  Box,
  Text,
  useState,
  useInput,
  useApp,
  type VNode,
} from '../src/index.js';
import { KeyIndicator, withKeyIndicator, clearOldKeyPresses } from './_shared/key-indicator.js';
import { TuiuiuHeader, trackFrame, resetFps } from './_shared/tuiuiu-header.js';

function Counter(): VNode {
  const [count, setCount] = useState(0);
  const { exit } = useApp();

  useInput(withKeyIndicator((char, key) => {
    clearOldKeyPresses();
    if (key.upArrow || char === 'k') {
      setCount(c => c + 1);
    }
    if (key.downArrow || char === 'j') {
      setCount(c => c - 1);
    }
    if (char === 'r') {
      setCount(0);
    }
    if (key.escape || (key.ctrl && char === 'c')) {
      exit();
    }
  }));

  // Track frames for FPS
  trackFrame();

  return Box(
    { flexDirection: 'column' },
    // Header
    TuiuiuHeader({
      title: 'counter',
      emoji: '🔢',
      subtitle: 'Basic Example',
    }),
    // Content
    Box(
      { flexDirection: 'column', padding: 1 },
      Box(
        { borderStyle: 'round', borderColor: 'blue', padding: 1 },
        Text({ color: 'yellow', bold: true }, `Count: ${count()}`)
      ),
      Text({}),
      Text({ color: 'gray', dim: true }, '↑/k: increment  ↓/j: decrement  r: reset  ESC: quit')
    ),
    KeyIndicator()
  );
}

const { waitUntilExit } = render(() => Counter());
await waitUntilExit();
