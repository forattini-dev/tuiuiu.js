/** Run: pnpm example markdown-selection-lab */
import { component, render, useApp, useConst, useEffect, useShortcut, useState, useTerminalSize } from '../src/app/index.js';
import { Box, Text, MarkdownView, createMarkdownSelection } from '../src/ui/index.js';

const initial = '# Selectable Markdown\n\nDrag across **bold**, *italic*, `inline code`, 界 and 👩‍💻.\n\n'
  + '- [x] Shared source mapping\n- [ ] More streaming content\n\n'
  + '[Documentation](https://github.com/forattini-dev/tuiuiu.js)\n\n```ts\n/* Multiline syntax\nconst insideComment = 42;\n*/\nconst greeting = "Olá 👩‍💻";\nconsole.log(greeting);\n```';

const App = component('MarkdownSelectionLab', () => {
  const size = useTerminalSize();
  const { exit } = useApp();
  const controller = useConst(() => createMarkdownSelection(initial));
  useEffect(() => () => controller.dispose());
  const [copyMode, setCopyMode] = useState<'display' | 'source'>('display');
  const [copied, setCopied] = useState('');
  useShortcut('ctrl+q', exit);
  useShortcut('ctrl+o', () => setCopyMode(mode => mode === 'display' ? 'source' : 'display'));
  useShortcut('ctrl+t', () => { controller.update(controller.snapshot().source + '\n\nMore **streamed** content: 👩‍💻 界 é.'); });
  return Box({ flexDirection: 'column' },
    Text({ bold: true, color: 'primary' }, 'Markdown selection lab — no JSX'),
    Text({ dim: true }, 'Drag / Shift+arrows: select · Ctrl+A: all · Esc: clear · wheel: scroll'),
    Text({ dim: true }, 'Ctrl+O: copy policy · Ctrl+T: append content · Ctrl+Q: quit'),
    Text({ color: 'info' }, `Ctrl+Shift+C previews ${copyMode()} text; no system clipboard write`),
    MarkdownView({ selection: controller, width: Math.max(1, size.columns), height: Math.max(1, size.rows - 6),
      isActive: true, copyMode: copyMode(), onCopy: setCopied }),
    Text({ wrap: 'truncate-end' }, `Copied: ${JSON.stringify(copied())}`));
});

await render(() => App(), { screen: 'fullscreen' }).waitUntilExit();
