/**
 * Test input example - demonstrates correct state management with useState
 *
 * IMPORTANT: Use useState() for component state - it persists across re-renders!
 * See CLAUDE.md "Critical Requirements" section for details.
 */
import {
  render,
  Box,
  Text,
  useHotkeys,
  useApp,
  useState,
  setTheme,
  darkTheme,
} from '../src/index.js';

// Set theme BEFORE render (required)
setTheme(darkTheme);

function TestApp() {
  const { exit } = useApp();

  // useState persists across re-renders (it's a hook!)
  const [count, setCount] = useState(0);

  useHotkeys('q', () => exit());
  useHotkeys('up', () => setCount(c => c + 1));
  useHotkeys('down', () => setCount(c => c - 1));

  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({}, 'Count: ' + count()),
    Text({ color: 'muted' }, 'Up/Down to change, Q to quit')
  );
}

const { waitUntilExit } = render(TestApp);
await waitUntilExit();
