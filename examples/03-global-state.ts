/**
 * Example 03: Global State
 *
 * Demonstrates:
 * - createSignal for global state (outside components)
 * - createEffect for reactive side effects
 * - Sharing state between multiple components
 * - createMemo for derived state
 *
 * Run: pnpm tsx examples/03-global-state.ts
 */

import {
  render,
  Box,
  Text,
  useInput,
  useApp,
  createSignal,
  createEffect,
  createMemo,
  type VNode,
} from '../src/index.js';

// =============================================================================
// GLOBAL STATE - Shared across all components
// =============================================================================

// Global counter
const [globalCount, setGlobalCount] = createSignal(0);

// Global user info
const [currentUser, setCurrentUser] = createSignal({
  name: 'Guest',
  isLoggedIn: false,
});

// Global theme
const [isDarkMode, setIsDarkMode] = createSignal(true);

// Derived state: computed from other signals
const doubledCount = createMemo(() => globalCount() * 2);
const greeting = createMemo(() => {
  const user = currentUser();
  return user.isLoggedIn ? `Welcome, ${user.name}!` : 'Please log in';
});

// =============================================================================
// COMPONENTS
// =============================================================================

function CounterDisplay(): VNode {
  const themeColor = isDarkMode() ? 'cyan' : 'blue';

  return Box(
    { borderStyle: 'single', borderColor: themeColor, padding: 1 },
    Text({ color: themeColor, bold: true }, 'Counter Module'),
    Text({}),
    Text({ color: 'white' }, `Count: ${globalCount()}`),
    Text({ color: 'gray' }, `Doubled: ${doubledCount()}`)
  );
}

function UserDisplay(): VNode {
  const user = currentUser();
  const themeColor = isDarkMode() ? 'green' : 'magenta';

  return Box(
    { borderStyle: 'single', borderColor: themeColor, padding: 1 },
    Text({ color: themeColor, bold: true }, 'User Module'),
    Text({}),
    Text({ color: user.isLoggedIn ? 'green' : 'yellow' }, greeting()),
    Text({ color: 'gray', dim: true }, `Status: ${user.isLoggedIn ? 'Authenticated' : 'Anonymous'}`)
  );
}

function ThemeDisplay(): VNode {
  const mode = isDarkMode() ? 'Dark' : 'Light';
  const bgColor = isDarkMode() ? 'gray' : 'white';
  const fgColor = isDarkMode() ? 'white' : 'black';

  return Box(
    { borderStyle: 'single', borderColor: fgColor, padding: 1 },
    Text({ color: 'magenta', bold: true }, 'Theme Module'),
    Text({}),
    Text({ color: fgColor }, `Mode: ${mode}`),
    Text({ color: 'gray', dim: true }, `BG: ${bgColor}, FG: ${fgColor}`)
  );
}

function GlobalStateDemo(): VNode {
  const { exit } = useApp();

  // Log state changes (side effect)
  createEffect(() => {
    // This runs whenever globalCount changes
    const count = globalCount();
    if (count > 0 && count % 5 === 0) {
      // Milestone reached
    }
  });

  useInput((char, key) => {
    // Counter controls
    if (key.upArrow || char === 'k') {
      setGlobalCount((c) => c + 1);
    }
    if (key.downArrow || char === 'j') {
      setGlobalCount((c) => Math.max(0, c - 1));
    }

    // User controls
    if (char === 'l') {
      setCurrentUser({
        name: 'John Doe',
        isLoggedIn: true,
      });
    }
    if (char === 'o') {
      setCurrentUser({
        name: 'Guest',
        isLoggedIn: false,
      });
    }

    // Theme toggle
    if (char === 't') {
      setIsDarkMode((dark) => !dark);
    }

    // Reset all
    if (char === 'r') {
      setGlobalCount(0);
      setCurrentUser({ name: 'Guest', isLoggedIn: false });
      setIsDarkMode(true);
    }

    if (key.escape || (key.ctrl && char === 'c')) {
      exit();
    }
  });

  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({ color: 'cyan', bold: true }, '🌍 Global State Example'),
    Text({ color: 'gray' }, 'State is shared across all modules'),
    Text({}),

    // Display all modules side by side (conceptually)
    Box(
      { flexDirection: 'column', gap: 1 },
      CounterDisplay(),
      UserDisplay(),
      ThemeDisplay()
    ),

    Text({}),
    Text({ color: 'gray', dim: true }, '↑/k: +1  ↓/j: -1  l: login  o: logout  t: toggle theme  r: reset  ESC: quit')
  );
}

const { waitUntilExit } = render(() => GlobalStateDemo());
await waitUntilExit();
