#!/usr/bin/env node
/**
 * AppendList demo - append-only output that stays above interactive UI.
 *
 * Run with: pnpm tsx examples/append-list.ts
 */

import {
  render,
  Box,
  Text,
  AppendList,
  createSignal,
  useInterval,
  useInput,
  useApp,
  Footer,
  Spacer,
} from '../src/index.js';

const MAX_LINES = 200;

function AppendListDemo() {
  const app = useApp();
  const [lines, setLines] = createSignal<string[]>([]);
  const [count, setCount] = createSignal(0);

  useInterval(() => {
    const next = count() + 1;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setCount(next);
    setLines((prev) => [
      ...prev,
      `[${timestamp}] event ${String(next).padStart(4, '0')}`,
    ].slice(-MAX_LINES));
  }, 250);

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      app.exit();
    }
  });

  return Box(
    { flexDirection: 'column' },
    AppendList({
      items: lines(),
      children: (line) => Text({ color: 'mutedForeground' }, line),
    }),
    Footer(
      { backgroundColor: 'muted', width: 'fill', paddingX: 1 },
      Text({ color: 'foreground' }, `Lines: ${lines().length}`),
      Spacer(),
      Text({ color: 'mutedForeground' }, '[Q] Quit')
    )
  );
}

const { waitUntilExit } = render(AppendListDemo, { fullHeight: true });
await waitUntilExit();
