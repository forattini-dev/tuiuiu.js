#!/usr/bin/env node
/**
 * Simple Screen/Header/Main/Footer layout demo.
 *
 * Run with: pnpm tsx examples/app-layout.ts
 */

import {
  render,
  Box,
  Text,
  Spacer,
  Panel,
  useInteraction,
  useApp,
} from '../src/index.js';
import { Caption, Footer, Header, Main, Screen, Title } from '../src/ui/index.js';

function LayoutDemo() {
  const app = useApp();

  useInteraction((event) => {
    if (event.type !== 'key') return;
    const input = event.key.text;
    const key = event.key.native;
    if (input === 'q' || key.escape) {
      app.exit();
    }
  });

  return Screen(
    {},
    Header(
      { backgroundColor: 'muted', width: 'fill', paddingX: 1 },
      Title('Layout Demo', { color: 'foreground' }),
      Spacer(),
      Caption('Screen / Main / Footer')
    ),
    Main(
      { gap: 1, padding: 1 },
      Box(
        { flexDirection: 'row', gap: 1, height: 'fill' },
        Panel({ title: 'Sidebar', flexGrow: 1 }, Text({}, 'Navigation')),
        Panel({ title: 'Content', flexGrow: 2 }, Text({}, 'This area fills the remaining space.'))
      )
    ),
    Footer(
      { backgroundColor: 'muted', width: 'fill', paddingX: 1 },
      Text({ color: 'mutedForeground' }, '[Q] Quit'),
      Spacer(),
      Text({ color: 'mutedForeground' }, 'Status: Ready')
    )
  );
}

const { waitUntilExit } = render(LayoutDemo, { screen: 'fullscreen' });
await waitUntilExit();
