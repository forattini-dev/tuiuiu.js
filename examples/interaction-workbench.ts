/** Tuiuiu 2.0 interaction workbench. Run with: pnpm example interaction-workbench */
import {
  Box, Select, Tabs, Text, render, useApp, useState, type VNode,
} from '../src/index.js';
import { prompt } from '../src/interaction/index.js';
import { useCommand, useCommandBinding } from '../src/hooks/index.js';
import { getInteractionRuntime, getOverlayHost } from '../src/interaction/index.js';

function InteractionWorkbench(): VNode {
  const app = useApp();
  const [status, setStatus] = useState('Ready');
  const runtime = getInteractionRuntime();
  const overlays = getOverlayHost<VNode | null>();

  useCommand({
    id: 'workbench.prompt',
    title: 'Open prompt',
    category: 'Workbench',
    run: async () => {
      const answer = await prompt.select(
        'Choose the next interaction:',
        ['inspect', 'overlay', 'continue'] as const,
        { default: 'continue' },
      );
      setStatus(`Prompt resolved: ${answer}`);
    },
  });
  useCommandBinding({ command: 'workbench.prompt', keys: 'p' });

  useCommand({
    id: 'workbench.overlay',
    title: 'Open timed overlay',
    category: 'Workbench',
    run: () => {
      overlays.open({
        content: Box(
          { borderStyle: 'round', borderColor: 'magenta', padding: 1 },
          Text({ bold: true }, 'OverlayHost owns focus and input'),
          Text({}, 'Press Escape to close.'),
        ),
        timeoutMs: 8_000,
      });
      setStatus('Overlay session opened');
    },
  });
  useCommandBinding({ command: 'workbench.overlay', keys: 'o' });

  useCommand({
    id: 'workbench.exit',
    title: 'Exit workbench',
    category: 'Workbench',
    run: () => app.exit(),
  });
  useCommandBinding({ command: 'workbench.exit', keys: 'q' });

  const inspection = runtime.inspect();
  return Box(
    { flexDirection: 'column', padding: 1, width: 'fill', height: 'fill' },
    Text({ bold: true, color: 'cyan' }, 'Tuiuiu 2.0 interaction workbench'),
    Text({ dim: true }, 'P prompt • O overlay • Q quit'),
    Box({ marginTop: 1 }, Tabs({
      tabs: [
        {
          key: 'commands',
          label: 'Commands',
          content: Text({}, `${inspection.commands.length} semantic commands registered`),
        },
        {
          key: 'collections',
          label: 'Collections',
          content: Select({
            items: [
              { value: 'identity', label: 'Identity survives reorder' },
              { value: 'disabled', label: 'Disabled rows are skipped', disabled: true },
              { value: 'viewport', label: 'Viewport follows active key' },
            ],
            initialValue: 'identity',
            onChange: (value) => setStatus(`Collection selected: ${String(value)}`),
          }),
        },
      ],
      style: 'pills',
    })),
    Box({ marginTop: 1 }, Text({ color: 'green' }, status())),
  );
}

const app = render(InteractionWorkbench, { screen: 'fullscreen' });
await app.waitUntilExit();
