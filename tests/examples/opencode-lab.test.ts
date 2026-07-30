import { describe, expect, it } from 'vitest';

import {
  HomeScreen,
  SessionScreen,
  colors,
  type ConversationMessage,
} from '../../examples/opencode-lab.js';
import {
  Text,
  renderToString,
  stringWidth,
  stripAnsi,
} from '../../src/index.js';

interface Viewport {
  width: number;
  height: number;
}

const viewports: Viewport[] = [
  { width: 80, height: 24 },
  { width: 120, height: 36 },
  { width: 160, height: 42 },
];

const messages: ConversationMessage[] = [
  { id: 1, role: 'user', content: 'Test the responsive OpenCode layout' },
];

function composer(placeholder: string) {
  return Text({ color: colors.muted }, placeholder);
}

function renderFrame(node: ReturnType<typeof HomeScreen>, width: number) {
  return stripAnsi(renderToString(node, width));
}

function expectFrameWithinViewport(
  frame: string,
  viewport: Viewport,
): void {
  const lines = frame.split('\n');
  expect(lines.length).toBeLessThanOrEqual(viewport.height);
  expect(
    lines.every((line) => stringWidth(line) <= viewport.width),
  ).toBe(true);
}

describe('OpenCode lab responsive contracts', () => {
  for (const viewport of viewports) {
    it(`keeps the home screen inside ${viewport.width}x${viewport.height}`, () => {
      const frame = renderFrame(
        HomeScreen({
          ...viewport,
          composer: composer('Ask anything... "Fix broken tests"'),
          agent: 'Build',
          model: 'Big Pickle',
        }),
        viewport.width,
      );

      expectFrameWithinViewport(frame, viewport);
      expect(frame).toContain('Ask anything');
      expect(frame).toContain('ctrl+p');
      expect(frame).toContain('Tip');
      expect(frame).toContain('tuiuiu.js');
      expect(frame).toContain('█▀▀█ █▀▀█ █▀▀█ █▀▀▄ █▀▀▀ █▀▀█ █▀▀█ █▀▀█');
      expect(frame).toContain('▀▀▀▀ █▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀');
    });

    it(`keeps the session composer at the bottom of ${viewport.width}x${viewport.height}`, () => {
      const frame = renderFrame(
        SessionScreen({
          ...viewport,
          composer: composer('Ask a follow-up...'),
          agent: 'Build',
          model: 'Big Pickle',
          sessionTitle: 'Responsive test',
          messages,
          thinking: true,
          sidebarVisible: true,
        }),
        viewport.width,
      );
      const lines = frame.split('\n');
      const composerLine = lines.findIndex((line) =>
        line.includes('Ask a follow-up'),
      );

      expectFrameWithinViewport(frame, viewport);
      expect(frame).toContain('Thinking');
      expect(frame).toContain('ctrl+b');
      expect(composerLine).toBeGreaterThanOrEqual(viewport.height - 5);

      if (viewport.width >= 105) {
        expect(frame).toContain('Context');
        expect(frame).toContain('Getting started');
      } else {
        expect(frame).not.toContain('Context');
        expect(frame).not.toContain('Getting started');
      }
    });

    it(`centers the command overlay inside ${viewport.width}x${viewport.height}`, () => {
      const frame = renderFrame(
        SessionScreen({
          ...viewport,
          composer: composer('Ask a follow-up...'),
          agent: 'Build',
          model: 'Big Pickle',
          commandOpen: true,
        }),
        viewport.width,
      );

      expectFrameWithinViewport(frame, viewport);
      expect(frame).toContain('Commands');
      expect(frame).toContain('New session');
      expect(frame).toContain('Toggle sidebar');
      expect(frame).toContain('Clear transcript');
    });
  }
});
