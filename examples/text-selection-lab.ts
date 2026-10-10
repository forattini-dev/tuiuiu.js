/** Run: pnpm example text-selection-lab */
import { render, component, useConst, useState, useEffect, useTerminalSize, useInteraction, useApp } from '../src/app/index.js';
import { Box, Text, TextView } from '../src/ui/index.js';
import { createTextDocument, createTextSelection } from '../src/interaction/index.js';

const App = component('TextSelectionLab', () => {
  const size = useTerminalSize();
  const { exit } = useApp();
  const [copied, setCopied] = useState('');
  const selection = useConst(() => createTextSelection(createTextDocument({ initialValue: [
    'Source text selection — no JSX, no browser CSS.',
    '',
    'Drag to select text. A drag can finish outside the panel.',
    'Shift + arrows extends the selection; Ctrl+A selects everything.',
    'Ctrl+Shift+C previews copied source text below; Escape clears the selection.',
    'Press q to quit. Resize the terminal: source selection survives reflow.',
    '',
    'Unicode: é · 界 · 👩‍💻 · 🇧🇷',
    'Tabs:\tfirst\tsecond',
    '',
    ...Array.from({ length: 30 }, (_, index) => `Line ${index + 1}: scroll with the mouse wheel; soft wraps never enter copied text.`),
  ].join('\n') })));
  useEffect(() => () => selection.dispose());
  useInteraction(event => {
    if (event.type === 'key' && (event.key.text === 'q'
      || (event.key.modifiers.ctrl && !event.key.modifiers.shift && event.key.text === 'c'))) exit();
  });
  return Box({ flexDirection: 'column' },
    Text({ bold: true, color: 'primary' }, 'Text selection lab'),
    TextView({ selection, width: Math.max(1, size.columns), height: Math.max(1, size.rows - 4),
      isActive: true, onCopy: setCopied, selectionStyle: { backgroundColor: 'blue', color: 'white' } }),
    Text({ dim: true }, 'Copy preview (not a system clipboard write):'),
    Text({ wrap: 'truncate-end' }, JSON.stringify(copied)));
});

await render(() => App(), { screen: 'fullscreen' }).waitUntilExit();
