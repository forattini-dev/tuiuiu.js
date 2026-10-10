/** Run: pnpm example text-editor-lab */
import { render, component, useInteraction, useApp, useState, useTerminalSize } from '../src/app/index.js';
import { Box, Text, TextInput, useTextInputState } from '../src/ui/index.js';

const App = component('TextEditorLab', () => {
  const size = useTerminalSize();
  const { exit } = useApp();
  const [submitted, setSubmitted] = useState('');
  const input = useTextInputState({
    initialValue: 'Edit me: é · 界 · 👩‍💻 · 🇧🇷\nSelect text and replace it. Undo also restores attached segments.',
    multiline: true,
    wordWrap: true,
    undoLimit: 100,
    history: ['previous submitted command'],
    onSubmit: setSubmitted,
  });
  useInteraction(event => {
    if (event.type !== 'key' || !event.key.modifiers.ctrl) return;
    if (event.key.text === 'c' && !event.key.modifiers.shift) exit();
    if (event.key.text === 'l') input.selectAll();
    if (event.key.text === 'b') input.insertSegment({ kind: 'file', displayText: '@example.ts', payload: { path: 'example.ts' } });
  });
  return Box({ flexDirection: 'column' },
    Text({ bold: true, color: 'primary' }, 'Text editor lab — no JSX'),
    Text({ dim: true }, 'Shift+arrows / Shift+click: select · Ctrl+Z: undo · Ctrl+Y: redo'),
    Text({ dim: true }, 'Ctrl+L: select all · Ctrl+B: attach a segment · Ctrl+N: newline · Ctrl+C: quit'),
    TextInput({ state: input, width: Math.max(8, size.columns), maxLines: Math.max(1, size.rows - 8),
      selectionStyle: { backgroundColor: 'blue', color: 'white' } }),
    Text({ wrap: 'truncate-end' }, `Selected: ${JSON.stringify(input.selection().text)}`),
    Text({ dim: true }, `Undo: ${input.canUndo()} · Redo: ${input.canRedo()} · Segments: ${input.segments().length}`),
    Text({ wrap: 'truncate-end' }, `Last submitted: ${JSON.stringify(submitted())}`));
});

await render(() => App(), { screen: 'fullscreen' }).waitUntilExit();
