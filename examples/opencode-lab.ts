#!/usr/bin/env node
/**
 * OpenCode experience lab built entirely with tuiuiu.js v2.
 *
 * This is a local simulation: it does not call an LLM or copy OpenCode's
 * implementation. It reproduces the interaction model with Tuiuiu's public
 * component, interaction, overlay, and rendering contracts.
 *
 * Run with: pnpm example opencode-lab
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  Box,
  Spacer,
  Text,
  TextInput,
  getVersion,
  render,
  useCommand,
  useCommandBinding,
  useConst,
  useInteraction,
  useInteractionMode,
  useInterval,
  useState,
  useTerminalSize,
  useTimeout,
  type VNode,
} from '../src/index.js';
import { useFps } from '../src/app/index.js';
import {
  CompletionDropdown,
  CommandPalette,
  commandItemsFromInteractionRuntime,
  createCommandPalette,
  useTextInputState,
  type CommandItem,
  type CommandPaletteState,
} from '../src/ui/index.js';
import {
  getInteractionRuntime,
  getOverlayHost,
  prompt,
  PromptCancelledError,
} from '../src/interaction/index.js';
import { truncateText } from '../src/utils/text-utils.js';

export const colors = {
  background: '#050505',
  panel: '#101010',
  surface: '#191919',
  surfaceRaised: '#242424',
  sidebar: '#111111',
  border: '#2b2d36',
  text: '#e8e8ea',
  muted: '#7f8496',
  subtle: '#41465d',
  accent: '#65b7ff',
  accentStrong: '#168bd2',
  warning: '#f2a343',
  positive: '#70c994',
  error: '#ec6a6a',
} as const;

const AGENTS = ['Build', 'Plan'] as const;
const COMMAND_PALETTE_ID = 'opencode.command-palette';
const MODEL_PICKER_ID = 'opencode.model-picker';
const INTERRUPT_CONFIRMATION_MS = 5_000;
const version = await getVersion();

export type ModelEffort = 'low' | 'medium' | 'high' | 'xhigh';

interface ModelDefinition {
  id: string;
  name: string;
  efforts: readonly ModelEffort[];
}

interface ProviderDefinition {
  id: string;
  name: string;
  description: string;
  popular: boolean;
  models: readonly ModelDefinition[];
}

export interface SelectedModelConfig {
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
  effort: ModelEffort;
  credentialConfigured: boolean;
}

const PROVIDERS: readonly ProviderDefinition[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Reasoning and general-purpose coding models',
    popular: true,
    models: [
      {
        id: 'gpt-5.6',
        name: 'GPT-5.6',
        efforts: ['low', 'medium', 'high', 'xhigh'],
      },
      {
        id: 'gpt-5.5',
        name: 'GPT-5.5',
        efforts: ['low', 'medium', 'high'],
      },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models for coding and long-context work',
    popular: true,
    models: [
      {
        id: 'claude-sonnet',
        name: 'Claude Sonnet',
        efforts: ['low', 'medium', 'high'],
      },
      {
        id: 'claude-opus',
        name: 'Claude Opus',
        efforts: ['medium', 'high'],
      },
    ],
  },
  {
    id: 'google',
    name: 'Google',
    description: 'Gemini models with broad context windows',
    popular: true,
    models: [
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        efforts: ['low', 'medium', 'high'],
      },
    ],
  },
  {
    id: 'opencode-zen',
    name: 'OpenCode Zen',
    description: 'Curated models exposed through a single provider',
    popular: false,
    models: [
      {
        id: 'big-pickle',
        name: 'Big Pickle',
        efforts: ['low', 'medium', 'high'],
      },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'One account for models from multiple vendors',
    popular: false,
    models: [
      {
        id: 'auto',
        name: 'Auto Router',
        efforts: ['low', 'medium', 'high'],
      },
    ],
  },
] as const;

const INITIAL_MODEL: SelectedModelConfig = {
  providerId: 'opencode-zen',
  providerName: 'OpenCode Zen',
  modelId: 'big-pickle',
  modelName: 'Big Pickle',
  effort: 'medium',
  credentialConfigured: false,
};

const SLASH_COMMANDS = [
  {
    name: '/models',
    commandId: 'model.list',
    description: 'Connect a provider and select model effort',
  },
  {
    name: '/commands',
    commandId: 'command.palette.show',
    description: 'Open the full command palette',
  },
  {
    name: '/new',
    commandId: 'session.new',
    description: 'Start a new session',
  },
  {
    name: '/clear',
    commandId: 'session.clear',
    description: 'Clear the current transcript',
  },
  {
    name: '/sidebar',
    commandId: 'session.sidebar.toggle',
    description: 'Toggle the session sidebar',
  },
  {
    name: '/agent',
    commandId: 'agent.cycle',
    description: 'Switch between Build and Plan',
  },
  {
    name: '/help',
    commandId: 'command.palette.show',
    description: 'Explore every available command',
  },
  {
    name: '/home',
    commandId: 'session.new',
    description: 'Return to the home composer',
  },
] as const;

const OPENCODE_LOGO_WIDTH = 39;
const OPENCODE_LOGO_ACCENT_COLUMN = 33;
const OPENCODE_LOGO_GLYPHS = [
  ['█▀▀█', '█  █', '▀▀▀▀'],
  ['█▀▀█', '█  █', '█▀▀▀'],
  ['█▀▀█', '█▀▀▀', '▀▀▀▀'],
  ['█▀▀▄', '█  █', '▀▀▀▀'],
  ['█▀▀▀', '█   ', '▀▀▀▀'],
  ['█▀▀█', '█  █', '▀▀▀▀'],
  ['█▀▀█', '█  █', '▀▀▀▀'],
  ['█▀▀█', '█▀▀▀', '▀▀▀▀'],
] as const;
const OPENCODE_LOGO_COLORS = [
  colors.subtle,
  colors.subtle,
  colors.subtle,
  colors.muted,
  colors.text,
  colors.text,
  colors.text,
  colors.text,
] as const;

export type RunPhase =
  | 'idle'
  | 'thinking'
  | 'tool'
  | 'answering'
  | 'interrupted';

export interface ConversationMessage {
  id: number;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  detail?: string;
  state?: 'running' | 'complete' | 'interrupted';
}

export interface ScreenFrameProps {
  width: number;
  height: number;
  composer: VNode;
  composerCompletion?: VNode | null;
  agent: string;
  model: string;
  provider?: string;
  effort?: ModelEffort;
  credentialConfigured?: boolean;
  sidebarVisible?: boolean;
  sessionTitle?: string;
  messages?: ConversationMessage[];
  phase?: RunPhase;
  interruptArmed?: boolean;
  statusNotice?: string;
  animationFrame?: number;
  fps?: number;
}

let nextMessageId = 1;

export function isRunningPhase(phase: RunPhase): boolean {
  return phase === 'thinking' || phase === 'tool' || phase === 'answering';
}

function OpenCodeLogo(props: { availableWidth: number }): VNode {
  if (props.availableWidth < OPENCODE_LOGO_WIDTH) {
    return Text({ color: colors.text, bold: true }, 'opencode');
  }

  const rows = [0, 1, 2].map((row) =>
    Box(
      { flexDirection: 'row', width: OPENCODE_LOGO_WIDTH },
      ...OPENCODE_LOGO_GLYPHS.flatMap((glyph, index) => [
        Text({ color: OPENCODE_LOGO_COLORS[index] }, glyph[row]),
        index === OPENCODE_LOGO_GLYPHS.length - 1
          ? Text({}, '')
          : Text({}, ' '),
      ]),
    ),
  );

  return Box(
    { flexDirection: 'column', width: OPENCODE_LOGO_WIDTH },
    Text(
      { color: OPENCODE_LOGO_COLORS[6] },
      `${' '.repeat(OPENCODE_LOGO_ACCENT_COLUMN)}▄`,
    ),
    ...rows,
  );
}

function AgentLine(props: {
  agent: string;
  model: string;
  width: number;
  provider?: string;
  effort?: ModelEffort;
}): VNode {
  return Box(
    { flexDirection: 'row' },
    Text({ color: colors.accent, bold: true }, props.agent),
    Text({ color: colors.text }, ' · '),
    Text({ color: colors.text, bold: true }, props.model),
    props.width >= 28
      ? Text({ color: colors.muted }, ` · ${props.effort ?? 'medium'}`)
      : Text({}, ''),
    props.width >= 44
      ? Text({ color: colors.muted }, `  ${props.provider ?? 'OpenCode Zen'}`)
      : Text({}, ''),
  );
}

function Composer(props: {
  input: VNode;
  completion?: VNode | null;
  width: number;
  agent: string;
  model: string;
  provider?: string;
  effort?: ModelEffort;
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
    ...(props.completion ? [props.completion] : []),
    Box(
      { flexDirection: 'column', minHeight: 3, paddingTop: 1 },
      props.input,
    ),
    AgentLine({
      agent: props.agent,
      model: props.model,
      width: props.width - 2,
      provider: props.provider,
      effort: props.effort,
    }),
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
        { flexDirection: 'column', width: cardWidth },
        Box(
          {
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 2,
          },
          OpenCodeLogo({ availableWidth: cardWidth }),
        ),
        Composer({
          input: props.composer,
          completion: props.composerCompletion,
          width: cardWidth,
          agent: props.agent,
          model: props.model,
          provider: props.provider,
          effort: props.effort,
        }),
        Box({ width: cardWidth }, ShortcutBar({ compact: true })),
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
          Text({ color: colors.muted }, ' to explore the interaction model'),
        ),
      ),
    ),
    Footer({ width: props.width }),
  );
}

const PULSE_FRAMES = ['▰▱▱', '▱▰▱', '▱▱▰', '▱▰▱'] as const;

function AnimatedPulse(props: { frame: number; color: string }): VNode {
  return Text(
    { color: props.color },
    PULSE_FRAMES[props.frame % PULSE_FRAMES.length] ?? PULSE_FRAMES[0],
  );
}

function AnimatedLabel(props: { text: string; frame: number }): VNode {
  const focalPoint = props.frame % Math.max(1, props.text.length);
  return Box(
    { flexDirection: 'row' },
    ...Array.from(props.text, (character, index) => Text(
      { color: Math.abs(index - focalPoint) <= 1 ? colors.text : colors.muted },
      character,
    )),
  );
}

function ActivityLine(props: {
  label: string;
  detail: string;
  color?: string;
  frame: number;
}): VNode {
  const color = props.color ?? colors.warning;
  return Box(
    { flexDirection: 'column', paddingLeft: 3, paddingTop: 1 },
    Box(
      { flexDirection: 'row' },
      AnimatedPulse({ frame: props.frame, color }),
      Text({ color }, ` ${props.label}`),
    ),
    Text({ color: colors.muted }, `  ${props.detail}`),
  );
}

function MessageTimeline(props: {
  width: number;
  messages: ConversationMessage[];
  phase: RunPhase;
  agent: string;
  model: string;
  effort?: ModelEffort;
  animationFrame: number;
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
            key: message.id,
            width: props.width,
            backgroundColor: colors.panel,
            borderStyle: 'single',
            borderTop: false,
            borderRight: false,
            borderBottom: false,
            borderColor: colors.accent,
            paddingX: 2,
            paddingY: 1,
            marginTop: nodes.length === 0 ? 0 : 1,
          },
          Text({ color: colors.text }, message.content),
        ),
      );
      continue;
    }

    if (message.role === 'tool') {
      const running = message.state === 'running';
      const interrupted = message.state === 'interrupted';
      nodes.push(
        Box(
          {
            key: message.id,
            flexDirection: 'row',
            width: props.width,
            paddingLeft: 3,
            paddingTop: 1,
          },
          running
            ? AnimatedPulse({ frame: props.animationFrame, color: colors.accent })
            : Text(
                { color: interrupted ? colors.error : colors.positive },
                interrupted ? '×' : '✓',
              ),
          Text(
            { color: running ? colors.text : colors.muted },
            ` ${message.content}`,
          ),
          message.detail
            ? Text({ color: colors.subtle }, `  ${message.detail}`)
            : Text({}, ''),
        ),
      );
      continue;
    }

    if (message.role === 'system') {
      nodes.push(
        Box(
          { key: message.id, paddingLeft: 3, paddingTop: 1 },
          Text({ color: colors.error }, '■ '),
          Text({ color: colors.muted }, message.content),
        ),
      );
      continue;
    }

    nodes.push(
      Box(
        {
          key: message.id,
          flexDirection: 'column',
          width: props.width,
          paddingX: 3,
          paddingTop: 1,
        },
        Text({ color: colors.text }, message.content),
        Box(
          { flexDirection: 'row', marginTop: 1 },
          Text({ color: colors.accent }, '▣ '),
          Text({ color: colors.text, bold: true }, props.agent),
          Text(
            { color: colors.muted },
            ` · ${props.model} · ${props.effort ?? 'medium'} · 2.4s`,
          ),
        ),
      ),
    );
  }

  if (props.phase === 'thinking') {
    nodes.push(ActivityLine({
      label: 'Thinking',
      detail: 'Understanding the request and locating the relevant code',
      frame: props.animationFrame,
    }));
  } else if (props.phase === 'tool') {
    nodes.push(ActivityLine({
      label: 'Working',
      detail: 'Applying the smallest coherent change',
      color: colors.accent,
      frame: props.animationFrame,
    }));
  } else if (props.phase === 'answering') {
    nodes.push(
      Box(
        { key: 'answering', paddingLeft: 3, paddingTop: 1 },
        AnimatedLabel({
          text: 'Writing response',
          frame: props.animationFrame,
        }),
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
    Text({ color: colors.muted }, 'This local simulation shows'),
    Text({ color: colors.muted }, 'the full agent interaction loop.'),
    Text({ color: colors.muted }, ''),
    Box(
      { flexDirection: 'row' },
      Text({ color: colors.text }, 'Explore commands'),
      Spacer(),
      Text({ color: colors.muted }, 'ctrl+p'),
    ),
  );
}

function SessionSidebar(props: {
  width: number;
  height: number;
  title: string;
  messages: ConversationMessage[];
  phase: RunPhase;
  model: string;
  provider: string;
  effort: ModelEffort;
  credentialConfigured: boolean;
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
    Text({ color: colors.muted }, isRunningPhase(props.phase) ? '● running' : '○ local simulation'),
    Text({ color: colors.text }, ''),
    Text({ color: colors.text, bold: true }, 'Context'),
    Text({ color: colors.muted }, `${tokenEstimate.toLocaleString()} tokens`),
    Text({ color: colors.muted }, '0% used  ·  $0.00'),
    Text({ color: colors.text }, ''),
    Text({ color: colors.text, bold: true }, 'Model'),
    Text({ color: colors.text }, props.model),
    Text({ color: colors.muted }, `${props.provider} · ${props.effort}`),
    Text(
      { color: props.credentialConfigured ? colors.positive : colors.subtle },
      props.credentialConfigured ? '● credential configured' : '○ demo default',
    ),
    Text({ color: colors.text }, ''),
    Text({ color: colors.text, bold: true }, 'Workspace'),
    Text({ color: colors.muted }, 'M  examples/opencode-lab.ts'),
    Text({ color: colors.muted }, 'M  tests/examples/opencode-lab.test.ts'),
    Text({ color: colors.text }, ''),
    Text({ color: colors.text, bold: true }, 'LSP'),
    Text({ color: colors.positive }, '● TypeScript ready'),
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

function paletteNode(
  palette: CommandPaletteState,
  width: number,
  onItemClick: (item: CommandItem, index: number) => void,
): VNode {
  return CommandPalette({
    ...palette.props,
    items: palette.filteredItems(),
    filteredItems: palette.filteredItems(),
    query: palette.query(),
    selectedIndex: palette.selectedIndex(),
    title: 'Commands',
    placeholder: 'Search commands...',
    width,
    maxVisible: 8,
    showCategories: true,
    showShortcuts: true,
    borderStyle: 'round',
    borderColor: colors.border,
    highlightColor: colors.accent,
    selectedBg: colors.surfaceRaised,
    onItemClick,
  });
}

function modelPickerNode(
  picker: CommandPaletteState,
  width: number,
  expanded: boolean,
  showDetails: boolean,
  current: SelectedModelConfig,
  onItemClick: (item: CommandItem, index: number) => void,
): VNode {
  const shortcutNodes = width >= 64
    ? [
        Text({ color: colors.text, bold: true }, 'ctrl+a'),
        Text({ color: colors.muted }, expanded ? ' popular' : ' all'),
        Text({ color: colors.text, bold: true }, '  ctrl+f'),
        Text({ color: colors.muted }, showDetails ? ' less' : ' details'),
        Text({ color: colors.text, bold: true }, '  ctrl+t'),
        Text({ color: colors.muted }, ` effort (${current.effort})`),
        Spacer(),
        Text({ color: colors.muted }, 'esc close'),
      ]
    : width >= 42
      ? [
          Text({ color: colors.text, bold: true }, 'C-a'),
          Text({ color: colors.muted }, ' more  '),
          Text({ color: colors.text, bold: true }, 'C-f'),
          Text({ color: colors.muted }, ' info  '),
          Text({ color: colors.text, bold: true }, 'C-t'),
          Text({ color: colors.muted }, ' effort  esc'),
        ]
      : [
          Text({ color: colors.text, bold: true }, 'C-a'),
          Text({ color: colors.muted }, ' more  '),
          Text({ color: colors.text, bold: true }, 'C-f'),
          Text({ color: colors.muted }, ' info  esc'),
        ];

  return Box(
    { flexDirection: 'column', width },
    CommandPalette({
      ...picker.props,
      items: picker.filteredItems(),
      filteredItems: picker.filteredItems(),
      query: picker.query(),
      selectedIndex: picker.selectedIndex(),
      title: expanded ? 'All providers' : 'Select provider',
      placeholder: 'Search providers...',
      width,
      maxVisible: 8,
      showCategories: false,
      showShortcuts: false,
      borderStyle: 'round',
      borderColor: colors.border,
      highlightColor: colors.accent,
      selectedBg: colors.surfaceRaised,
      onItemClick,
    }),
    Box(
      {
        flexDirection: 'row',
        width,
        backgroundColor: colors.panel,
        paddingX: 1,
      },
      ...shortcutNodes,
    ),
  );
}

function StatusLine(props: {
  width: number;
  phase: RunPhase;
  interruptArmed: boolean;
  notice: string;
  agent: string;
  model: string;
  effort: ModelEffort;
  animationFrame: number;
  fps: number;
}): VNode {
  const running = isRunningPhase(props.phase);
  const modeColor = props.phase === 'interrupted'
    ? colors.error
    : colors.accentStrong;
  const statusColor = props.interruptArmed
    ? colors.warning
    : props.phase === 'interrupted'
      ? colors.error
      : colors.muted;
  const status = props.interruptArmed
    ? 'again to interrupt'
    : running
      ? 'interrupt'
      : props.phase === 'interrupted'
        ? 'interrupted'
        : props.notice;
  const fpsColor = props.fps === 0
    ? colors.muted
    : props.fps >= 30
      ? colors.positive
      : props.fps >= 15
        ? colors.warning
        : colors.error;

  return Box(
    {
      flexDirection: 'row',
      width: props.width,
      height: 1,
      backgroundColor: colors.panel,
    },
    Box(
      {
        backgroundColor: modeColor,
        paddingLeft: 1,
        paddingRight: 1,
      },
      Text({ color: colors.background, bold: true }, 'BUILD'),
    ),
    Box(
      {
        flexDirection: 'row',
        flexGrow: 1,
        flexShrink: 1,
        paddingLeft: 1,
        paddingRight: 1,
      },
      running
        ? AnimatedPulse({ frame: props.animationFrame, color: colors.accent })
        : Text({}, ''),
      running ? Text({ color: statusColor }, ' esc ') : Text({}, ''),
      Text({ color: statusColor }, truncateText(status, Math.max(8, props.width - 42))),
    ),
    props.width >= 72
      ? Box(
          { flexDirection: 'row', paddingRight: 1 },
          Text({ color: colors.text }, props.agent),
          Text({ color: colors.muted }, ` · ${props.model} · ${props.effort}`),
          Text({ color: fpsColor }, ` · ${props.fps} fps`),
        )
      : Text({}, ''),
  );
}

export function SessionScreen(props: ScreenFrameProps): VNode {
  const phase = props.phase ?? 'idle';
  const messages = props.messages ?? [];
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
        messages,
        phase,
        agent: props.agent,
        model: props.model,
        effort: props.effort,
        animationFrame: props.animationFrame ?? 0,
      }),
    ),
    Composer({
      input: props.composer,
      completion: props.composerCompletion,
      width: mainWidth - 2,
      agent: props.agent,
      model: props.model,
      provider: props.provider,
      effort: props.effort,
    }),
    StatusLine({
      width: mainWidth,
      phase,
      interruptArmed: props.interruptArmed ?? false,
      notice: props.statusNotice ?? 'ready',
      agent: props.agent,
      model: props.model,
      effort: props.effort ?? 'medium',
      animationFrame: props.animationFrame ?? 0,
      fps: props.fps ?? 0,
    }),
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
          messages,
          phase,
          model: props.model,
          provider: props.provider ?? 'OpenCode Zen',
          effort: props.effort ?? 'medium',
          credentialConfigured: props.credentialConfigured ?? false,
        })
      : Text({}, ''),
  );
}

export function OpenCodeLab(): VNode {
  const { columns, rows } = useTerminalSize();
  const { fps } = useFps();
  const runtime = getInteractionRuntime();
  const overlays = getOverlayHost<VNode | null>();
  const [screen, setScreen] = useState<'home' | 'session'>('home');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [phase, setPhase] = useState<RunPhase>('idle');
  const [lastPrompt, setLastPrompt] = useState('');
  const [sessionTitle, setSessionTitle] = useState('New session');
  const [agentIndex, setAgentIndex] = useState(0);
  const [selectedModel, setSelectedModel] = useState<SelectedModelConfig>(INITIAL_MODEL);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [expandedProviders, setExpandedProviders] = useState(false);
  const [showProviderDetails, setShowProviderDetails] = useState(false);
  const [interruptArmed, setInterruptArmed] = useState(false);
  const [statusNotice, setStatusNotice] = useState('ready');
  const [animationFrame, setAnimationFrame] = useState(0);
  const paletteViewport = useConst(() => ({ width: columns }));
  paletteViewport.width = columns;

  const input = useTextInputState({
    multiline: true,
    autoGrow: true,
    maxLines: 5,
    wordWrap: true,
    cursorStyle: 'bar',
    completion: {
      resolveAnchor: ({ value, cursorPosition }) => {
        if (
          !value.startsWith('/')
          || value.slice(0, cursorPosition).includes(' ')
          || cursorPosition !== value.length
        ) {
          return null;
        }
        return {
          start: 0,
          end: cursorPosition,
          query: value.slice(1, cursorPosition),
          trigger: '/',
        };
      },
      getItems: ({ anchor }) => {
        const query = anchor.query.toLowerCase();
        return SLASH_COMMANDS
          .filter((command) => command.name.slice(1).includes(query))
          .map((command) => ({
            id: command.name,
            label: command.name,
            detail: command.description,
            replacement: command.name,
          }));
      },
    },
  });

  const agent = AGENTS[agentIndex()] ?? AGENTS[0];
  const modelConfig = selectedModel();
  const currentPhase = phase();
  const busy = isRunningPhase(currentPhase);
  useInterval(
    () => setAnimationFrame((frame) => frame + 1),
    40,
    { enabled: busy },
  );
  const isHome = screen() === 'home';
  const showSidebar = sidebarVisible() && columns >= 105;
  const sidebarWidth = showSidebar ? 38 : 0;
  const mainWidth = columns - sidebarWidth;
  const homeWidth = Math.max(20, Math.min(68, columns - 6));
  const inputWidth = Math.max(
    20,
    (isHome ? homeWidth : mainWidth - 2) - 4,
  );

  const closePalette = () => {
    void overlays.close(COMMAND_PALETTE_ID);
  };

  const palette = useConst(() => createCommandPalette({
    runtime,
    items: commandItemsFromInteractionRuntime(runtime),
    onSelect: closePalette,
    props: {
      title: 'Commands',
      placeholder: 'Search commands...',
      maxVisible: 8,
      showCategories: true,
      showShortcuts: true,
    },
  }));

  const modelPicker = useConst(() => createCommandPalette({
    runtime,
    items: [],
    props: {
      title: 'Select provider',
      placeholder: 'Search providers...',
      maxVisible: 8,
      showCategories: false,
      showShortcuts: false,
    },
  }));

  useInteractionMode(
    { mode: 'opencode' },
    !paletteOpen() && !modelPickerOpen(),
  );

  const openPalette = () => {
    if (overlays.snapshot().entries.some((entry) => entry.id === COMMAND_PALETTE_ID)) return;
    palette.setItems(commandItemsFromInteractionRuntime(runtime));
    palette.clear();
    setPaletteOpen(true);
    overlays.open({
      id: COMMAND_PALETTE_ID,
      blocking: true,
      captureFocus: true,
      backdrop: true,
      closeOnEscape: true,
      closeOnBackdrop: true,
      content: () => paletteNode(
        palette,
        Math.max(30, Math.min(72, paletteViewport.width - 8)),
        (item) => {
          item.action?.();
          closePalette();
        },
      ),
      onClose: () => {
        palette.clear();
        setPaletteOpen(false);
      },
    });
  };

  const resetSession = () => {
    setScreen('home');
    setMessages([]);
    setPhase('idle');
    setInterruptArmed(false);
    setSessionTitle('New session');
    setStatusNotice('ready');
    input.clear();
  };

  const clearTranscript = () => {
    setMessages([]);
    setPhase('idle');
    setInterruptArmed(false);
    setStatusNotice('transcript cleared');
  };

  const cycleAgent = () => {
    setAgentIndex((index) => (index + 1) % AGENTS.length);
    setStatusNotice('agent changed');
  };

  const cycleEffort = () => {
    const current = selectedModel();
    const provider = PROVIDERS.find((item) => item.id === current.providerId);
    const model = provider?.models.find((item) => item.id === current.modelId);
    const efforts = model?.efforts ?? ['low', 'medium', 'high'];
    const currentIndex = efforts.indexOf(current.effort);
    const nextEffort = efforts[(currentIndex + 1) % efforts.length] ?? efforts[0];
    if (!nextEffort) return;
    setSelectedModel({ ...current, effort: nextEffort });
    setStatusNotice(`effort changed to ${nextEffort}`);
  };

  const providerItems = (
    expanded: boolean,
    details: boolean,
  ): CommandItem[] => PROVIDERS
    .filter((provider) => expanded || provider.popular)
    .map((provider) => ({
      id: `provider.${provider.id}`,
      label: provider.name,
      description: details
        ? `${provider.description} · ${provider.models.length} model${provider.models.length === 1 ? '' : 's'}`
        : `${provider.models.length} model${provider.models.length === 1 ? '' : 's'}`,
      icon: provider.id === selectedModel().providerId ? '●' : '○',
      action: () => { void configureProvider(provider); },
    }));

  const refreshModelPicker = (
    expanded = expandedProviders(),
    details = showProviderDetails(),
  ) => {
    modelPicker.setItems(providerItems(expanded, details));
  };

  async function configureProvider(provider: ProviderDefinition): Promise<void> {
    await overlays.close(MODEL_PICKER_ID);
    setStatusNotice(`connecting ${provider.name}`);

    try {
      await prompt.password(`Enter ${provider.name} API key:`, {
        mask: '•',
        validate: (value) => value.trim().length >= 8
          || 'API key must be at least 8 characters',
      });

      const modelName = await prompt.select(
        `Select a ${provider.name} model:`,
        provider.models.map((item) => item.name),
        { default: provider.models[0]?.name },
      );
      const model = provider.models.find((item) => item.name === modelName);
      if (!model) throw new Error(`Unknown model selected: ${modelName}`);

      const preferredEffort = model.efforts.includes(selectedModel().effort)
        ? selectedModel().effort
        : model.efforts.includes('medium')
          ? 'medium'
          : model.efforts[0];
      const effort = await prompt.select(
        `Select effort for ${model.name}:`,
        model.efforts,
        { default: preferredEffort },
      );

      setSelectedModel({
        providerId: provider.id,
        providerName: provider.name,
        modelId: model.id,
        modelName: model.name,
        effort,
        credentialConfigured: true,
      });
      setStatusNotice(`${model.name} · ${effort} configured`);
    } catch (error) {
      if (error instanceof PromptCancelledError) {
        setStatusNotice('model setup cancelled');
        return;
      }
      setStatusNotice('model setup failed');
    }
  }

  const openModelPicker = () => {
    if (overlays.snapshot().entries.some((entry) => entry.id === MODEL_PICKER_ID)) return;
    setExpandedProviders(false);
    setShowProviderDetails(false);
    modelPicker.clear();
    refreshModelPicker(false, false);
    setModelPickerOpen(true);
    overlays.open({
      id: MODEL_PICKER_ID,
      blocking: true,
      captureFocus: true,
      backdrop: true,
      closeOnEscape: true,
      closeOnBackdrop: true,
      content: () => modelPickerNode(
        modelPicker,
        Math.max(30, Math.min(76, paletteViewport.width - 8)),
        expandedProviders(),
        showProviderDetails(),
        selectedModel(),
        (item) => item.action?.(),
      ),
      onClose: () => {
        modelPicker.clear();
        setModelPickerOpen(false);
      },
    });
  };

  const requestInterrupt = () => {
    if (!isRunningPhase(phase())) return;
    if (!interruptArmed()) {
      setInterruptArmed(true);
      setStatusNotice('press esc again to interrupt');
      return;
    }

    setInterruptArmed(false);
    setMessages((current) => [
      ...current.map((message) => message.state === 'running'
        ? { ...message, state: 'interrupted' as const }
        : message),
      {
        id: nextMessageId++,
        role: 'system',
        content: 'Session interrupted by the user.',
      },
    ]);
    setPhase('interrupted');
    setStatusNotice('interrupted');
  };

  useCommand({
    id: 'command.palette.show',
    title: 'Open command palette',
    description: 'Search every command registered in the interaction runtime.',
    category: 'Application',
    run: openPalette,
  });
  useCommandBinding({ command: 'command.palette.show', keys: 'ctrl+p', mode: 'opencode' });

  useCommand({
    id: 'session.new',
    title: 'New session',
    description: 'Return to the centered composer with an empty transcript.',
    category: 'Session',
    run: resetSession,
  });
  useCommandBinding({ command: 'session.new', keys: 'ctrl+n', mode: 'opencode' });

  useCommand({
    id: 'session.clear',
    title: 'Clear transcript',
    category: 'Session',
    run: clearTranscript,
  });
  useCommandBinding({ command: 'session.clear', keys: 'ctrl+l', mode: 'opencode' });

  useCommand({
    id: 'session.sidebar.toggle',
    title: 'Toggle sidebar',
    category: 'View',
    run: () => setSidebarVisible((visible) => !visible),
  });
  useCommandBinding({ command: 'session.sidebar.toggle', keys: 'ctrl+b', mode: 'opencode' });

  useCommand({
    id: 'agent.cycle',
    title: 'Cycle agent',
    description: 'Switch between Build and Plan.',
    category: 'Agent',
    run: cycleAgent,
  });
  useCommandBinding({ command: 'agent.cycle', keys: 'tab', mode: 'opencode' });

  useCommand({
    id: 'model.list',
    title: 'Select model',
    description: 'Connect a provider, choose a model, and set its effort.',
    category: 'Agent',
    run: openModelPicker,
  });
  useCommandBinding({ command: 'model.list', keys: 'ctrl+m', mode: 'opencode' });

  useCommand({
    id: 'model.effort.cycle',
    title: 'Cycle model effort',
    description: 'Move to the next effort supported by the selected model.',
    category: 'Agent',
    run: cycleEffort,
  });
  useCommandBinding({ command: 'model.effort.cycle', keys: 'ctrl+t', mode: 'opencode' });

  useCommand({
    id: 'session.interrupt',
    title: interruptArmed() ? 'Confirm interrupt' : 'Interrupt session',
    description: interruptArmed()
      ? 'Press Escape again to stop the active run.'
      : 'Arms interruption confirmation for five seconds.',
    category: 'Session',
    enabled: () => isRunningPhase(phase()),
    run: requestInterrupt,
  });
  useCommandBinding(
    {
      command: 'session.interrupt',
      keys: 'escape',
      mode: 'opencode',
      priority: 1_000,
    },
    busy && !paletteOpen(),
  );

  useInteraction((event) => {
    if (event.type !== 'key') return;
    const key = event.key.native;
    const text = event.key.text;

    if (key.upArrow) {
      palette.selectPrev();
      return true;
    }
    if (key.downArrow) {
      palette.selectNext();
      return true;
    }
    if (key.return) {
      palette.confirm();
      return true;
    }
    if (key.backspace) {
      palette.backspace();
      return true;
    }
    if (!key.ctrl && !key.meta && text) {
      palette.type(text);
      return true;
    }
    return true;
  }, {
    mode: 'overlay',
    target: COMMAND_PALETTE_ID,
    priority: 300,
  });

  useInteraction((event) => {
    if (event.type !== 'key') return;
    const key = event.key.native;
    const text = event.key.text;

    if (key.ctrl && text?.toLowerCase() === 'a') {
      const next = !expandedProviders();
      setExpandedProviders(next);
      modelPicker.clear();
      refreshModelPicker(next, showProviderDetails());
      return true;
    }
    if (key.ctrl && text?.toLowerCase() === 'f') {
      const next = !showProviderDetails();
      setShowProviderDetails(next);
      refreshModelPicker(expandedProviders(), next);
      return true;
    }
    if (key.ctrl && text?.toLowerCase() === 't') {
      cycleEffort();
      return true;
    }
    if (key.upArrow) {
      modelPicker.selectPrev();
      return true;
    }
    if (key.downArrow) {
      modelPicker.selectNext();
      return true;
    }
    if (key.return) {
      modelPicker.confirm();
      return true;
    }
    if (key.backspace) {
      modelPicker.backspace();
      return true;
    }
    if (!key.ctrl && !key.meta && text) {
      modelPicker.type(text);
      return true;
    }
    return true;
  }, {
    mode: 'overlay',
    target: MODEL_PICKER_ID,
    priority: 300,
  });

  const runSlashCommand = (value: string): boolean => {
    const command = value.trim().toLowerCase();
    const commandId = command === '/model'
      ? 'model.list'
      : SLASH_COMMANDS.find((item) => item.name === command)?.commandId;
    if (!commandId) return false;
    void runtime.execute(commandId, { type: 'command', source: 'slash-command' });
    return true;
  };

  const submit = (value: string) => {
    const activeCompletion = input.completion();
    const selectedCompletion = activeCompletion?.items[
      activeCompletion.selectedIndex
    ];
    const completionCommandId = SLASH_COMMANDS.find(
      (command) => command.name === selectedCompletion?.id,
    )?.commandId;
    if (
      activeCompletion?.anchor.trigger === '/'
      && typeof completionCommandId === 'string'
    ) {
      input.clear();
      void runtime.execute(completionCommandId, {
        type: 'command',
        source: 'slash-completion',
      });
      return;
    }

    const prompt = value.trim();
    if (!prompt) return;
    if (runSlashCommand(prompt)) {
      input.clear();
      return;
    }
    if (isRunningPhase(phase())) {
      setStatusNotice('run active · esc twice to interrupt');
      return;
    }

    if (screen() === 'home') {
      setScreen('session');
      setSessionTitle(
        prompt.length > 42 ? `${prompt.slice(0, 39)}...` : prompt,
      );
    }

    setLastPrompt(prompt);
    setMessages((current) => [
      ...current,
      { id: nextMessageId++, role: 'user', content: prompt },
    ]);
    setInterruptArmed(false);
    setStatusNotice('thinking');
    setPhase('thinking');
    input.clear();
  };

  input.updateOptions({
    placeholder: isHome
      ? 'Ask anything... "Fix broken tests"'
      : 'Ask a follow-up...',
    multiline: true,
    autoGrow: true,
    maxLines: 5,
    wordWrap: true,
    cursorStyle: 'bar',
    isActive: () => !paletteOpen() && !modelPickerOpen(),
    onSubmit: submit,
    onCancel: () => {},
  });

  useTimeout(() => {
    setMessages((current) => [
      ...current,
      {
        id: nextMessageId++,
        role: 'tool',
        content: 'Read examples/opencode-lab.ts',
        detail: 'interaction and layout',
        state: 'running',
      },
    ]);
    setStatusNotice('working');
    setPhase('tool');
  }, 650, { enabled: currentPhase === 'thinking' });

  useTimeout(() => {
    setMessages((current) => current.map((message) =>
      message.state === 'running'
        ? { ...message, state: 'complete' as const }
        : message));
    setStatusNotice('writing response');
    setPhase('answering');
  }, 900, { enabled: currentPhase === 'tool' });

  useTimeout(() => {
    setMessages((current) => [
      ...current,
      {
        id: nextMessageId++,
        role: 'assistant',
        content:
          `Implemented a focused simulation for “${truncateText(lastPrompt(), 46)}”. `
          + 'The transcript, semantic commands, responsive sidebar, animated status line, '
          + 'and guarded interruption are all running on tuiuiu.js v2.',
      },
    ]);
    setInterruptArmed(false);
    setStatusNotice('ready');
    setPhase('idle');
  }, 850, { enabled: currentPhase === 'answering' });

  useTimeout(() => {
    setStatusNotice('ready');
    setPhase('idle');
  }, 900, { enabled: currentPhase === 'interrupted' });

  useTimeout(() => {
    setInterruptArmed(false);
    if (isRunningPhase(phase())) setStatusNotice('running');
  }, INTERRUPT_CONFIRMATION_MS, { enabled: interruptArmed() });

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

  const composerCompletion = input.completion()?.anchor.trigger === '/'
    ? Box(
        { flexDirection: 'column', width: inputWidth, marginBottom: 1 },
        CompletionDropdown({
          state: input.completion,
          width: inputWidth,
          maxVisible: 7,
          borderStyle: 'round',
          borderColor: colors.border,
          highlightColor: colors.accent,
          emptyMessage: 'No matching commands',
        }),
        Text(
          { color: colors.muted },
          inputWidth >= 48
            ? ' ↑↓ navigate  enter run  tab insert  esc close'
            : ' ↑↓ select  enter run  esc',
        ),
      )
    : null;

  const frame = {
    width: Math.max(40, columns),
    height: Math.max(16, rows),
    composer,
    composerCompletion,
    agent,
    model: modelConfig.modelName,
    provider: modelConfig.providerName,
    effort: modelConfig.effort,
    credentialConfigured: modelConfig.credentialConfigured,
    animationFrame: animationFrame(),
    fps,
  };

  return isHome
    ? HomeScreen(frame)
    : SessionScreen({
        ...frame,
        messages: messages(),
        phase: phase(),
        interruptArmed: interruptArmed(),
        statusNotice: statusNotice(),
        sessionTitle: sessionTitle(),
        sidebarVisible: sidebarVisible(),
      });
}

export async function runOpenCodeLab(): Promise<void> {
  const app = render(() => OpenCodeLab(), {
    screen: 'alternate',
    autoTabNavigation: false,
    exitProcess: true,
    maxFps: 60,
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
