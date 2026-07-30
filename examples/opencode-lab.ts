#!/usr/bin/env node
/**
 * OpenCode-inspired assistant shell built entirely with tuiuiu.js.
 *
 * There is no JSX, CSS, browser renderer, or copied OpenCode implementation.
 * The example uses OpenCode only as a visual and interaction reference.
 *
 * Run with: pnpm example opencode-lab
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BigText,
  Box,
  ShimmerText,
  Spacer,
  Text,
  TextInput,
  getVersion,
  render,
  truncateText,
  useApp,
  useInput,
  useState,
  useTerminalSize,
  useTextInputState,
  useTimeout,
  type VNode,
} from '../src/index.js';

export const colors = {
  background: '#050505',
  surface: '#191919',
  surfaceRaised: '#202020',
  sidebar: '#111111',
  border: '#25262d',
  text: '#e8e8ea',
  muted: '#596489',
  subtle: '#343b59',
  accent: '#29b6f6',
  warning: '#f2a343',
  positive: '#70c994',
} as const;

const MODELS = ['Big Pickle', 'GPT-5.6', 'Claude Sonnet'] as const;
const AGENTS = ['Build', 'Plan'] as const;
const version = await getVersion();

export interface ConversationMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

export interface ScreenFrameProps {
  width: number;
  height: number;
  composer: VNode;
  agent: string;
  model: string;
  commandOpen?: boolean;
  sidebarVisible?: boolean;
  sessionTitle?: string;
  messages?: ConversationMessage[];
  thinking?: boolean;
}

let nextMessageId = 1;

function AgentLine(props: { agent: string; model: string }): VNode {
  return Box(
    { flexDirection: 'row' },
    Text({ color: colors.accent, bold: true }, props.agent),
    Text({ color: colors.text }, ' · '),
    Text({ color: colors.text, bold: true }, props.model),
    Text({ color: colors.muted }, '  OpenCode Zen'),
  );
}

function Composer(props: {
  input: VNode;
  width: number;
  agent: string;
  model: string;
}): VNode {
  return Box(
    {
      flexDirection: 'column',
      width: props.width,
      backgroundColor: colors.surface,
      borderStyle: 'single',
      borderTop: false,
      borderRight: false,
      borderBottom: false,
      borderColor: colors.accent,
      paddingLeft: 1,
      paddingRight: 1,
    },
    props.input,
    AgentLine({ agent: props.agent, model: props.model }),
  );
}

function ShortcutBar(props: { compact?: boolean }): VNode {
  return Box(
    { flexDirection: 'row', width: 'fill' },
    Text({ color: colors.text, bold: true }, 'tab'),
    Text({ color: colors.muted }, ' agents'),
    Text({ color: colors.text, bold: true }, '   ctrl+p'),
    Text({ color: colors.muted }, ' commands'),
    props.compact ? Text({}, '') : Spacer(),
    props.compact
      ? Text({}, '')
      : Box(
          { flexDirection: 'row' },
          Text({ color: colors.text, bold: true }, 'ctrl+b'),
          Text({ color: colors.muted }, ' sidebar'),
        ),
  );
}

function Footer(props: { width: number; showVersion?: boolean }): VNode {
  const cwd = process.cwd().replaceAll('\\', '/');
  const versionLabel = `tuiuiu.js ${version}`;
  const pathWidth = Math.max(8, props.width - versionLabel.length - 4);

  return Box(
    {
      flexDirection: 'row',
      width: props.width,
      paddingLeft: 1,
      paddingRight: 1,
    },
    Text(
      { color: colors.subtle },
      truncateText(cwd, pathWidth, { position: 'start' }),
    ),
    Spacer(),
    props.showVersion === false
      ? Text({}, '')
      : Text({ color: colors.subtle }, versionLabel),
  );
}

export function HomeScreen(props: ScreenFrameProps): VNode {
  const cardWidth = Math.max(20, Math.min(68, props.width - 6));

  return Box(
    {
      flexDirection: 'column',
      width: props.width,
      height: props.height,
      backgroundColor: colors.background,
    },
    Box(
      {
        height: Math.max(1, props.height - 1),
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: props.width,
      },
      Box(
        {
          flexDirection: 'column',
          width: cardWidth,
        },
        Box(
          {
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 2,
          },
          BigText({
            text: 'opencode',
            font: 'small',
            gradient: [
              colors.subtle,
              colors.subtle,
              colors.muted,
              colors.text,
              colors.text,
            ],
            letterSpacing: 1,
          }),
        ),
        Composer({
          input: props.composer,
          width: cardWidth,
          agent: props.agent,
          model: props.model,
        }),
        Box(
          { width: cardWidth, paddingTop: 0 },
          ShortcutBar({ compact: true }),
        ),
        Box(
          {
            flexDirection: 'row',
            justifyContent: 'center',
            width: cardWidth,
            marginTop: 2,
          },
          Text({ color: colors.warning }, '● '),
          Text({ color: colors.warning, bold: true }, 'Tip'),
          Text({ color: colors.muted }, '  Type '),
          Text({ color: colors.text }, '/help'),
          Text({ color: colors.muted }, ' to explore this tuiuiu.js example'),
        ),
      ),
    ),
    Footer({ width: props.width }),
  );
}

function MessageTimeline(props: {
  width: number;
  messages: ConversationMessage[];
  thinking: boolean;
  agent: string;
  model: string;
}): VNode {
  if (props.messages.length === 0) {
    return Box(
      { flexDirection: 'column', paddingX: 2, paddingTop: 1 },
      Text(
        { color: colors.muted },
        'Start a session by writing in the composer below.',
      ),
    );
  }

  const nodes: VNode[] = [];

  for (const message of props.messages) {
    if (message.role === 'user') {
      nodes.push(
        Box(
          {
            width: props.width,
            backgroundColor: colors.sidebar,
            borderStyle: 'single',
            borderTop: false,
            borderRight: false,
            borderBottom: false,
            borderColor: colors.accent,
            paddingX: 2,
            paddingY: 1,
          },
          Text({ color: colors.text }, message.content),
        ),
      );
      continue;
    }

    nodes.push(
      Box(
        {
          flexDirection: 'column',
          width: props.width,
          paddingX: 2,
          paddingTop: 1,
        },
        Text({ color: colors.text }, message.content),
      ),
    );
  }

  if (props.thinking) {
    nodes.push(
      Box(
        {
          flexDirection: 'column',
          paddingLeft: 2,
          paddingTop: 1,
        },
        Box(
          { flexDirection: 'row' },
          Text({ color: colors.warning }, '⠿ '),
          ShimmerText({
            text: 'Thinking',
            color: colors.warning,
            shimmerColor: colors.text,
          }),
        ),
        Box(
          { flexDirection: 'row', marginTop: 1 },
          Text({ color: colors.accent }, '▣  '),
          AgentLine({ agent: props.agent, model: props.model }),
        ),
      ),
    );
  }

  return Box(
    {
      flexDirection: 'column',
      width: props.width,
      overflow: 'hidden',
    },
    ...nodes,
  );
}

function GettingStartedCard(): VNode {
  return Box(
    {
      flexDirection: 'column',
      backgroundColor: colors.surface,
      paddingX: 2,
      paddingY: 1,
      width: 'fill',
    },
    Box(
      { flexDirection: 'row' },
      Text({ color: colors.text, bold: true }, '◇ Getting started'),
      Spacer(),
      Text({ color: colors.muted }, '×'),
    ),
    Text({ color: colors.muted }, ''),
    Text({ color: colors.muted }, 'OpenCode includes free models'),
    Text({ color: colors.muted }, 'so you can start immediately.'),
    Text({ color: colors.muted }, ''),
    Text({ color: colors.muted }, 'This example validates layout,'),
    Text({ color: colors.muted }, 'input, async updates and resize.'),
    Text({ color: colors.muted }, ''),
    Box(
      { flexDirection: 'row' },
      Text({ color: colors.text }, 'Try a command'),
      Spacer(),
      Text({ color: colors.muted }, '/help'),
    ),
  );
}

function SessionSidebar(props: {
  width: number;
  height: number;
  title: string;
  messages: ConversationMessage[];
}): VNode {
  const tokenEstimate = Math.ceil(
    props.messages.reduce(
      (total, message) => total + message.content.length,
      0,
    ) / 4,
  );
  const cwd = truncateText(
    process.cwd().replaceAll('\\', '/'),
    Math.max(8, props.width - 4),
    { position: 'start' },
  );

  return Box(
    {
      flexDirection: 'column',
      width: props.width,
      height: props.height,
      backgroundColor: colors.sidebar,
      paddingX: 2,
      paddingY: 1,
    },
    Text({ color: colors.text, bold: true }, props.title || 'New session'),
    Text({ color: colors.text }, ''),
    Text({ color: colors.text, bold: true }, 'Context'),
    Text({ color: colors.muted }, `${tokenEstimate.toLocaleString()} tokens`),
    Text({ color: colors.muted }, '0% used'),
    Text({ color: colors.muted }, '$0.00 spent'),
    Text({ color: colors.text }, ''),
    Text({ color: colors.text, bold: true }, 'LSP'),
    Text({ color: colors.muted }, 'LSPs are disabled'),
    Spacer(),
    GettingStartedCard(),
    Box(
      { flexDirection: 'column', marginTop: 1 },
      Text({ color: colors.text, bold: true }, cwd),
      Text({ color: colors.muted }, '● tuiuiu/opencode lab'),
      Text({ color: colors.subtle }, `  tuiuiu.js ${version}`),
    ),
  );
}

function CommandOverlay(props: { width: number; height: number }): VNode {
  const overlayWidth = Math.max(20, Math.min(70, props.width - 8));
  const commands = [
    ['New session', 'ctrl+n'],
    ['Toggle sidebar', 'ctrl+b'],
    ['Switch agent', 'tab'],
    ['Return home', '/home'],
    ['Clear transcript', '/clear'],
  ] as const;

  return Box(
    {
      width: props.width,
      height: props.height,
      backgroundColor: colors.background,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    Box(
      {
        flexDirection: 'column',
        width: overlayWidth,
        backgroundColor: colors.surface,
        borderStyle: 'single',
        borderColor: colors.border,
        paddingX: 2,
        paddingY: 1,
      },
      Text({ color: colors.text, bold: true }, 'Commands'),
      Text({ color: colors.muted }, 'Type Ctrl+P or Escape to close'),
      Text({}, ''),
      ...commands.map(([label, shortcut], index) =>
        Box(
          {
            flexDirection: 'row',
            backgroundColor:
              index === 0 ? colors.surfaceRaised : colors.surface,
            paddingX: 1,
          },
          Text({ color: index === 0 ? colors.accent : colors.text }, label),
          Spacer(),
          Text({ color: colors.muted }, shortcut),
        ),
      ),
    ),
  );
}

export function SessionScreen(props: ScreenFrameProps): VNode {
  if (props.commandOpen) {
    return CommandOverlay({ width: props.width, height: props.height });
  }

  const showSidebar = (props.sidebarVisible ?? true) && props.width >= 105;
  const sidebarWidth = showSidebar ? 38 : 0;
  const mainWidth = props.width - sidebarWidth;

  const main = Box(
    {
      flexDirection: 'column',
      width: mainWidth,
      height: props.height,
      backgroundColor: colors.background,
    },
    Box(
      {
        flexGrow: 1,
        width: mainWidth,
        overflow: 'hidden',
      },
      MessageTimeline({
        width: mainWidth,
        messages: props.messages ?? [],
        thinking: props.thinking ?? false,
        agent: props.agent,
        model: props.model,
      }),
    ),
    Composer({
      input: props.composer,
      width: mainWidth - 2,
      agent: props.agent,
      model: props.model,
    }),
    Box(
      {
        flexDirection: 'row',
        width: mainWidth,
        height: 1,
        paddingX: 2,
      },
      Text(
        { color: props.thinking ? colors.warning : colors.positive },
        '▮▮▮',
      ),
      Text(
        { color: colors.text, bold: true },
        props.thinking ? '   esc' : '   ready',
      ),
      Text(
        { color: colors.muted },
        props.thinking ? ' interrupt' : '',
      ),
      Spacer(),
      Text({ color: colors.text, bold: true }, 'tab'),
      Text({ color: colors.muted }, ' agents   '),
      Text({ color: colors.text, bold: true }, 'ctrl+p'),
      Text({ color: colors.muted }, ' commands   '),
      Text({ color: colors.text, bold: true }, 'ctrl+b'),
      Text({ color: colors.muted }, ' sidebar'),
    ),
  );

  return Box(
    {
      flexDirection: 'row',
      width: props.width,
      height: props.height,
      backgroundColor: colors.background,
    },
    main,
    showSidebar
      ? SessionSidebar({
          width: sidebarWidth,
          height: props.height,
          title: props.sessionTitle ?? 'New session',
          messages: props.messages ?? [],
        })
      : Text({}, ''),
  );
}

export function OpenCodeLab(): VNode {
  const { exit } = useApp();
  const { columns, rows } = useTerminalSize();
  const [screen, setScreen] = useState<'home' | 'session'>('home');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('New session');
  const [agentIndex, setAgentIndex] = useState(0);
  const [modelIndex] = useState(0);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false);
  const input = useTextInputState({
    multiline: true,
    autoGrow: true,
    maxLines: 5,
    wordWrap: true,
    cursorStyle: 'bar',
  });

  const agent = AGENTS[agentIndex()] ?? AGENTS[0];
  const model = MODELS[modelIndex()] ?? MODELS[0];
  const isHome = screen() === 'home';
  const showSidebar = sidebarVisible() && columns >= 105;
  const sidebarWidth = showSidebar ? 38 : 0;
  const mainWidth = columns - sidebarWidth;
  const homeWidth = Math.max(20, Math.min(68, columns - 6));
  const inputWidth = Math.max(
    20,
    (isHome ? homeWidth : mainWidth - 2) - 4,
  );

  function runCommand(value: string): boolean {
    const command = value.trim().toLowerCase();
    if (command === '/help') {
      setCommandOpen(true);
      return true;
    }
    if (command === '/clear') {
      setMessages([]);
      setThinking(false);
      return true;
    }
    if (command === '/home') {
      setScreen('home');
      setMessages([]);
      setThinking(false);
      setSessionTitle('New session');
      return true;
    }
    if (command === '/sidebar') {
      setSidebarVisible((visible) => !visible);
      return true;
    }
    return false;
  }

  function submit(value: string): void {
    const prompt = value.trim();
    if (!prompt || thinking()) return;
    if (runCommand(prompt)) {
      input.clear();
      return;
    }

    if (screen() === 'home') {
      setScreen('session');
      setSessionTitle(
        prompt.length > 42 ? `${prompt.slice(0, 39)}...` : prompt,
      );
    }

    setMessages((current) => [
      ...current,
      { id: nextMessageId++, role: 'user', content: prompt },
    ]);
    setThinking(true);
    input.clear();
  }

  input.updateOptions({
    placeholder: isHome
      ? 'Ask anything... "Fix broken tests"'
      : 'Ask a follow-up...',
    multiline: true,
    autoGrow: true,
    maxLines: 5,
    wordWrap: true,
    cursorStyle: 'bar',
    isActive: () => !commandOpen(),
    onSubmit: submit,
    onCancel: () => {
      if (commandOpen()) {
        setCommandOpen(false);
      } else if (thinking()) {
        setThinking(false);
      }
    },
  });

  useTimeout(
    () => {
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId++,
          role: 'assistant',
          content:
            'This OpenCode-inspired shell is running entirely on tuiuiu.js. '
            + 'Try resizing the terminal, Ctrl+P, Ctrl+B, Tab, /clear or /home.',
        },
      ]);
      setThinking(false);
    },
    1_800,
    { enabled: thinking() },
  );

  useInput(
    (char, key) => {
      if (key.ctrl && char === 'c') {
        exit();
        return true;
      }
      if ((key.ctrl && char === 'p') || (commandOpen() && key.escape)) {
        setCommandOpen((open) => !open);
        return true;
      }
      if (commandOpen()) return true;
      if (key.ctrl && char === 'b') {
        setSidebarVisible((visible) => !visible);
        return true;
      }
      if (key.ctrl && char === 'n') {
        setScreen('home');
        setMessages([]);
        setThinking(false);
        setSessionTitle('New session');
        input.clear();
        return true;
      }
      if (key.tab && !key.shift) {
        setAgentIndex((index) => (index + 1) % AGENTS.length);
        return true;
      }
      if (key.escape && thinking()) {
        setThinking(false);
        return true;
      }
      return false;
    },
    { priority: 'modal', stopPropagation: true },
  );

  const composer = TextInput({
    state: input,
    placeholder: isHome
      ? 'Ask anything... "Fix broken tests"'
      : 'Ask a follow-up...',
    borderStyle: 'none',
    prompt: '',
    focusedBorderColor: colors.accent,
    foreground: colors.text,
    fullWidth: true,
    multiline: true,
    autoGrow: true,
    maxLines: 5,
    wordWrap: true,
    cursorStyle: 'bar',
    width: inputWidth,
  });

  const frame = {
    width: Math.max(40, columns),
    height: Math.max(16, rows),
    composer,
    agent,
    model,
  };

  return isHome
    ? HomeScreen(frame)
    : SessionScreen({
        ...frame,
        messages: messages(),
        thinking: thinking(),
        sessionTitle: sessionTitle(),
        commandOpen: commandOpen(),
        sidebarVisible: sidebarVisible(),
      });
}

export async function runOpenCodeLab(): Promise<void> {
  const app = render(() => OpenCodeLab(), {
    screenMode: 'alternate',
    autoTabNavigation: false,
    exitOnCtrlC: false,
    maxFps: 30,
  });

  await app.waitUntilExit();
}

function isDirectExecution(): boolean {
  const entryPath = process.argv[1];
  if (!entryPath) return false;

  const resolvedEntry = path.resolve(entryPath);
  const modulePath = fileURLToPath(import.meta.url);
  return process.platform === 'win32'
    ? resolvedEntry.toLowerCase() === modulePath.toLowerCase()
    : resolvedEntry === modulePath;
}

if (isDirectExecution()) {
  await runOpenCodeLab();
}
