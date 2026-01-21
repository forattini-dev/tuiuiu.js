/**
 * Minimal test - demonstrates correct state management
 *
 * Two valid approaches:
 * 1. useState() inside component - RECOMMENDED for component state (persists via hook system)
 * 2. createSignal() at module level - for shared/global state
 *
 * ❌ NEVER use createSignal() inside a component - it will be recreated on every render!
 */
import { render, Box, Text, useState, useHotkeys, useApp, setTheme, darkTheme } from '../src/index.js';

// Set theme BEFORE render (required)
setTheme(darkTheme);

function App() {
  const { exit } = useApp();

  // useState persists across re-renders (it's a hook!)
  const [count, setCount] = useState(0);
  const [lastKey, setLastKey] = useState('none');

  // Number keys
  useHotkeys('1', () => { setLastKey('1'); setCount(c => c + 1); });
  useHotkeys('2', () => { setLastKey('2'); setCount(c => c - 1); });

  // Arrow keys
  useHotkeys('up', () => { setLastKey('up'); setCount(c => c + 10); });
  useHotkeys('down', () => { setLastKey('down'); setCount(c => c - 10); });
  useHotkeys('left', () => { setLastKey('left'); setCount(c => c - 5); });
  useHotkeys('right', () => { setLastKey('right'); setCount(c => c + 5); });

  useHotkeys('q', () => exit());

  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({ bold: true }, 'Minimal Test (useState)'),
    Text({}, `Count: ${count()}`),
    Text({}, `Last key: ${lastKey()}`),
    Text({ color: 'muted' }, '1/2: +1/-1 | Arrows: up+10 down-10 left-5 right+5 | q: quit')
  );
}

const { waitUntilExit } = render(App);
await waitUntilExit();
