#!/usr/bin/env node
/**
 * Tuiuiu Example: AI Assistant Interface
 *
 * Full-featured AI assistant terminal UI showcasing the complete
 * tuiuiu.js component library:
 *
 * Layout:   Partial borders, border text, dividers, responsive sizing
 * Input:    TextInput with multiline, paste detection, slash commands
 * Menus:    Model selector, theme picker, settings menu with submenus
 * Dialogs:  Help modal, confirm dialog, command palette
 * Feedback: ShimmerText thinking, Spinner stall detection, ProgressBar streaming
 * Data:     Tabs for conversation/settings, KeyValueTable, Badge, Switch
 * Hints:    HintBar with platform-aware shortcuts
 *
 * Run with: pnpm tsx examples/app-ai-assistant.ts
 */

import {
  render,
  Box,
  Text,
  Spacer,
  Newline,
  When,
  Each,
  useState,
  useInput,
  useApp,
  useInterval,
  setTheme,
  useTheme,
  getNextTheme,
  resolveColor,
  measureHeight,
  ChatList,
  useScrollList,
  usePaste,
  type VNode,
} from '../src/index.js';
import { useTerminalSize } from '../src/hooks/index.js';
import { createTextInput, renderTextInput } from '../src/atoms/text-input.js';
import { ShimmerText, resetShimmerStartTime } from '../src/atoms/shimmer-text.js';
import { KeyboardShortcutHint, HintBar } from '../src/atoms/keyboard-shortcut-hint.js';
import { Spinner, createSpinner, renderSpinner } from '../src/atoms/spinner.js';
import { ProgressBar, createProgressBar } from '../src/atoms/progress-bar.js';
import { Badge } from '../src/atoms/badge.js';
import { Menu, type MenuEntry } from '../src/molecules/menu.js';
import { CodeBlock } from '../src/molecules/code-block.js';
import { KeyValueTable } from '../src/molecules/table.js';
import { Divider } from '../src/primitives/divider.js';
// Modal not used — we build overlays with Box + border directly to avoid hook ordering issues
import { wrapText, stringWidth } from '../src/utils/text-utils.js';

// =============================================================================
// Types & Data
// =============================================================================

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  isThinking?: boolean;
  isStreaming?: boolean;
  streamProgress?: number;
  tokens?: number;
  cost?: number;
  duration?: number;
  toolName?: string;
  codeBlock?: { language: string; code: string };
}

interface AppSettings {
  model: string;
  streaming: boolean;
  verbose: boolean;
  maxTokens: number;
  temperature: number;
}

let nextId = 0;

const MODELS = [
  { value: 'opus-4.6', label: 'Opus 4.6', description: 'Most capable, 1M context' },
  { value: 'sonnet-4.6', label: 'Sonnet 4.6', description: 'Fast & capable' },
  { value: 'haiku-4.5', label: 'Haiku 4.5', description: 'Fastest, lightweight' },
];

const SIMULATED_RESPONSES: Array<{ text: string; tool?: string; code?: { language: string; code: string } }> = [
  { text: 'I found the issue. The function is missing a null check on line 42.' },
  {
    text: 'Here\'s the fix:',
    code: {
      language: 'typescript',
      code: 'function processData(input: Data | null) {\n  if (!input) return null;\n  return transform(input);\n}',
    },
  },
  { text: 'Running the test suite...', tool: 'Bash' },
  { text: 'All 376 tests pass. The refactor is complete.' },
  { text: 'I\'ve analyzed the codebase. There are 3 components that need updating for the new API.' },
  {
    text: 'Let me read the configuration file first.',
    tool: 'Read',
  },
  { text: 'The performance bottleneck is in the render loop — an O(n^2) sort that can be replaced with a single pass.' },
  { text: 'Done! Created the new module with full TypeScript types and exported it from the barrel.' },
];

// =============================================================================
// Sub-Components
// =============================================================================

function Logo(): VNode {
  return Box(
    { flexDirection: 'row', gap: 1 },
    Text({ color: resolveColor('primary'), bold: true }, '\u25C6'),
    Text({ bold: true }, 'tuiuiu'),
    Text({ dim: true }, 'assistant'),
  );
}

/** Tool use indicator — shows what tool is running */
function ToolIndicator(props: { name: string; isRunning: boolean }): VNode {
  const { name, isRunning } = props;
  return Box(
    { flexDirection: 'row', gap: 1, marginLeft: 2, marginBottom: 0 },
    isRunning
      ? Spinner({ style: 'dots', speed: 1.5 })
      : Text({ color: resolveColor('positive'), bold: true }, '\u2714'),
    Text({ dim: true }, name),
  );
}

/** Message bubble with tool calls, code blocks, streaming progress */
function MessageBubble(props: { message: Message; maxWidth: number }): VNode {
  const { message, maxWidth } = props;
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isTool = message.role === 'tool';

  // Thinking state — shimmer animation
  if (message.isThinking) {
    return Box(
      { flexDirection: 'column', marginBottom: 1 },
      Box(
        { flexDirection: 'row', gap: 1 },
        Text({ color: resolveColor('primary'), bold: true }, '\u25C6'),
        ShimmerText({
          text: 'Thinking...',
          color: resolveColor('mutedForeground'),
          shimmerColor: resolveColor('primary'),
          speed: 1,
          width: 3,
        }),
      ),
    );
  }

  // Tool use
  if (isTool && message.toolName) {
    return Box(
      { flexDirection: 'column', marginBottom: 1 },
      ToolIndicator({ name: message.toolName, isRunning: !!message.isStreaming }),
    );
  }

  // Streaming with progress bar
  if (message.isStreaming) {
    return Box(
      { flexDirection: 'column', marginBottom: 1 },
      Box(
        { flexDirection: 'row', gap: 1 },
        Text({ color: resolveColor('primary'), bold: true }, '\u25C6'),
        Text({}, message.content || ''),
        Text({ dim: true }, '\u258C'),
      ),
      Box(
        { marginLeft: 2, marginTop: 0 },
        ProgressBar({
          value: message.streamProgress ?? 0,
          max: 100,
          width: Math.min(30, maxWidth - 4),
          style: 'smooth',
          showPercentage: true,
          color: resolveColor('primary'),
        }),
      ),
    );
  }

  const prefix = isUser ? '\u276F' : isSystem ? '\u25CF' : '\u25C6';
  const prefixColor = isUser
    ? resolveColor('accent')
    : isSystem
      ? resolveColor('warning')
      : resolveColor('primary');

  const contentWidth = Math.max(1, maxWidth - 4);
  const wrapped = wrapText(message.content, contentWidth, { wordWrap: true });
  const lines = wrapped.length > 0 ? wrapped.split('\n') : [''];

  const meta: string[] = [];
  if (message.tokens) meta.push(`${message.tokens} tokens`);
  if (message.cost) meta.push(`$${message.cost.toFixed(4)}`);
  if (message.duration) meta.push(`${(message.duration / 1000).toFixed(1)}s`);

  return Box(
    { flexDirection: 'column', marginBottom: 1 },
    // Text lines
    ...lines.map((line, i) =>
      Box(
        { flexDirection: 'row' },
        Text({ color: prefixColor, bold: i === 0 }, i === 0 ? `${prefix} ` : '  '),
        Text({ color: isSystem ? resolveColor('mutedForeground') : undefined }, line),
      )
    ),
    // Code block
    message.codeBlock
      ? Box(
          { marginLeft: 2, marginTop: 1, width: Math.min(60, maxWidth - 4) },
          CodeBlock({
            code: message.codeBlock.code,
            language: message.codeBlock.language,
            showLineNumbers: true,
            width: Math.min(58, maxWidth - 6),
          }),
        )
      : Text({}, ''),
    // Meta
    meta.length > 0
      ? Box(
          { flexDirection: 'row', marginLeft: 2 },
          Text({ color: resolveColor('mutedForeground'), dim: true }, `(${meta.join(' \u00B7 ')})`),
        )
      : Text({}, ''),
  );
}

/** Help overlay — pure rendering, no hooks */
function HelpOverlay(props: { width: number }): VNode {
  const commands = [
    { key: '/help', value: 'Show this help' },
    { key: '/clear', value: 'Clear conversation' },
    { key: '/model <name>', value: 'Change model' },
    { key: '/theme', value: 'Cycle theme' },
    { key: '/settings', value: 'Open settings panel' },
    { key: '/code <lang>', value: 'Show code example' },
    { key: '/tokens', value: 'Show token usage' },
    { key: '/compact', value: 'Compact conversation' },
  ];

  const shortcuts = [
    { key: 'Enter', value: 'Send message' },
    { key: 'Shift+Enter', value: 'New line' },
    { key: 'Up/Down', value: 'Input history' },
    { key: 'Ctrl+L', value: 'Clear screen' },
    { key: 'Ctrl+M', value: 'Model selector' },
    { key: 'Ctrl+T', value: 'Settings' },
    { key: 'Tab', value: 'Cycle theme' },
    { key: 'Escape', value: 'Close overlay' },
    { key: 'Ctrl+C', value: 'Exit' },
  ];

  const w = Math.min(60, props.width - 4);

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: resolveColor('primary'),
      width: w,
      paddingX: 1,
    },
    // Title bar with [X]
    Box(
      { flexDirection: 'row', marginBottom: 1 },
      Text({ bold: true, color: resolveColor('primary') }, ' Help'),
      Spacer(),
      Text({ color: resolveColor('mutedForeground'), dim: true }, '[X] Esc '),
    ),
    Text({ bold: true, color: resolveColor('primary') }, 'Slash Commands'),
    Newline(),
    KeyValueTable({
      entries: commands,
      keyColor: resolveColor('warning'),
      valueColor: resolveColor('foreground'),
    }),
    Newline(),
    Divider({ title: 'Keyboard', titleColor: resolveColor('primary'), dim: true }),
    Newline(),
    KeyValueTable({
      entries: shortcuts,
      keyColor: resolveColor('accent'),
      valueColor: resolveColor('foreground'),
    }),
  );
}

/** Settings overlay — pure rendering, no hooks */
function SettingsOverlay(props: { settings: AppSettings; width: number }): VNode {
  const { settings, width: parentWidth } = props;
  const w = Math.min(55, parentWidth - 4);

  const settingsKV = [
    { key: 'Model', value: settings.model },
    { key: 'Streaming', value: settings.streaming ? '\u2714 On' : '\u2718 Off' },
    { key: 'Verbose', value: settings.verbose ? '\u2714 On' : '\u2718 Off' },
    { key: 'Max Tokens', value: String(settings.maxTokens) },
    { key: 'Temperature', value: String(settings.temperature) },
  ];

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: resolveColor('accent'),
      width: w,
      paddingX: 1,
    },
    Box(
      { flexDirection: 'row', marginBottom: 1 },
      Text({ bold: true, color: resolveColor('accent') }, ' Settings'),
      Spacer(),
      Text({ color: resolveColor('mutedForeground'), dim: true }, '[X] Esc '),
    ),
    Text({ bold: true, color: resolveColor('accent') }, 'Current Configuration'),
    Newline(),
    KeyValueTable({
      entries: settingsKV,
      keyColor: resolveColor('mutedForeground'),
      valueColor: resolveColor('foreground'),
    }),
    Newline(),
    Divider({ title: 'Commands', titleColor: resolveColor('accent'), dim: true }),
    Newline(),
    Text({ dim: true }, '/model opus-4.6    Change model'),
    Text({ dim: true }, '/model sonnet-4.6  Change model'),
    Text({ dim: true }, '/theme             Cycle theme'),
  );
}

/** Model selector overlay — pure rendering, no hooks */
function ModelSelectorOverlay(props: { currentModel: string }): VNode {
  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: resolveColor('primary'),
      width: 42,
      paddingX: 1,
    },
    Box(
      { flexDirection: 'row', marginBottom: 1 },
      Text({ bold: true, color: resolveColor('primary') }, ' Select Model'),
      Spacer(),
      Text({ color: resolveColor('mutedForeground'), dim: true }, '[X] Esc '),
    ),
    ...MODELS.map((m) => {
      const isCurrent = m.value === props.currentModel;
      const pointer = isCurrent ? '\u276F' : ' ';
      return Box(
        { flexDirection: 'row', gap: 1 },
        Text({ color: isCurrent ? resolveColor('primary') : undefined, bold: isCurrent }, `${pointer} ${m.label}`),
        Text({ dim: true }, `- ${m.description}`),
      );
    }),
    Newline(),
    Text({ dim: true }, 'Use /model <name> to change'),
  );
}

/** Status line with stats + hints */
function StatusLine(props: {
  model: string;
  messageCount: number;
  totalTokens: number;
  totalCost: number;
  streaming: boolean;
  width: number;
}): VNode {
  const { model, messageCount, totalTokens, totalCost, streaming, width } = props;
  const narrow = width < 70;

  return Box(
    {
      flexDirection: 'row',
      borderStyle: 'single',
      borderBottom: false,
      borderLeft: false,
      borderRight: false,
      borderColor: resolveColor('border'),
      paddingX: 1,
      width,
    },
    // Left: model + stats
    Text({ color: resolveColor('primary'), bold: true }, `\u25C6 ${model}`),
    streaming
      ? Badge({ label: 'stream', color: resolveColor('positive') })
      : Text({}, ''),
    Text({ dim: true }, '  \u2502  '),
    Text({ dim: true }, `${messageCount} msgs`),
    Text({ dim: true }, '  \u2502  '),
    Text({ dim: true }, `${totalTokens} tok`),
    Text({ dim: true }, '  \u2502  '),
    Text({ color: resolveColor('warning'), dim: true }, `$${totalCost.toFixed(4)}`),
    Spacer(),
    // Right: hints (hide some on narrow terminals)
    narrow
      ? KeyboardShortcutHint({ shortcut: '?', action: 'help' })
      : HintBar({
          hints: [
            { shortcut: 'ctrl+m', action: 'model' },
            { shortcut: 'ctrl+t', action: 'settings' },
            { shortcut: '?', action: 'help' },
          ],
        }),
  );
}

// =============================================================================
// Main App
// =============================================================================

function AiAssistantApp(): VNode {
  // State
  const [messages, setMessages] = useState<Message[]>([
    { id: nextId++, role: 'system', content: 'Welcome! Type a message or /help for commands.', timestamp: new Date() },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    model: 'opus-4.6',
    streaming: true,
    verbose: false,
    maxTokens: 4096,
    temperature: 0.7,
  });
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [inputHistory, setInputHistory] = useState<string[]>([]);

  // Overlays
  const [overlay, setOverlay] = useState<'none' | 'help' | 'settings' | 'model-selector'>('none');

  const { exit } = useApp();
  const currentTheme = useTheme();
  const { columns: width, rows: height } = useTerminalSize();
  const chatList = useScrollList({ inverted: true });

  // Text input
  const [textInputState] = useState(createTextInput({
    placeholder: 'Message tuiuiu assistant...',
    history: inputHistory(),
    multiline: true,
    onChange: () => {},
    onSubmit: (value) => {
      if (!value.trim() || isThinking()) return;
      handleSubmit(value);
      textInputState().clear();
    },
    onCancel: () => {
      if (overlay() !== 'none') setOverlay('none');
    },
    isActive: () => overlay() === 'none',
  }));

  // Paste
  usePaste((event) => {
    if (event.text.trim() && overlay() === 'none') {
      textInputState().paste(event.text);
    }
  });

  // Submit logic
  function handleSubmit(value: string) {
    if (value.startsWith('/')) {
      handleCommand(value.slice(1));
      return;
    }

    setInputHistory((h) => [...h, value]);
    chatList.scrollToBottom();

    const userTokens = Math.ceil(value.length / 4);
    addMessage({ role: 'user', content: value, tokens: userTokens });
    setTotalTokens((t) => t + userTokens);

    // Start thinking
    setIsThinking(true);
    resetShimmerStartTime();
    addMessage({ role: 'assistant', content: '', isThinking: true });

    // Pick a random response
    const resp = SIMULATED_RESPONSES[Math.floor(Math.random() * SIMULATED_RESPONSES.length)]!;
    const totalDelay = 600 + Math.random() * 2000;

    // Optional: simulate tool use
    if (resp.tool) {
      setTimeout(() => {
        setMessages((m) => {
          const filtered = m.filter((msg) => !msg.isThinking);
          return [...filtered, {
            id: nextId++, role: 'tool', content: '', timestamp: new Date(),
            toolName: resp.tool, isStreaming: true,
          }];
        });
      }, totalDelay * 0.3);

      setTimeout(() => {
        // Mark tool as done
        setMessages((m) =>
          m.map((msg) => msg.toolName === resp.tool && msg.isStreaming
            ? { ...msg, isStreaming: false }
            : msg
          )
        );
      }, totalDelay * 0.7);
    }

    // Simulate streaming response
    if (settings().streaming) {
      const words = resp.text.split(' ');
      let built = '';
      let streamMsgId = -1;

      setTimeout(() => {
        // Remove thinking, start streaming
        streamMsgId = nextId++;
        setMessages((m) => {
          const filtered = m.filter((msg) => !msg.isThinking);
          return [...filtered, {
            id: streamMsgId, role: 'assistant', content: '', timestamp: new Date(),
            isStreaming: true, streamProgress: 0,
          }];
        });
        setIsThinking(false);

        // Stream word by word
        words.forEach((word, i) => {
          setTimeout(() => {
            built += (i > 0 ? ' ' : '') + word;
            const progress = Math.floor(((i + 1) / words.length) * 100);
            setMessages((m) =>
              m.map((msg) => msg.id === streamMsgId
                ? { ...msg, content: built, streamProgress: progress }
                : msg
              )
            );

            // Finalize on last word
            if (i === words.length - 1) {
              const respTokens = Math.ceil(built.length / 4);
              const cost = (userTokens * 0.000003) + (respTokens * 0.000015);
              setMessages((m) =>
                m.map((msg) => msg.id === streamMsgId
                  ? {
                      ...msg,
                      isStreaming: false,
                      streamProgress: undefined,
                      tokens: respTokens,
                      cost,
                      duration: totalDelay + (i * 80),
                      codeBlock: resp.code,
                    }
                  : msg
                )
              );
              setTotalTokens((t) => t + respTokens);
              setTotalCost((c) => c + cost);
              chatList.scrollToBottom();
            }
          }, i * 80);
        });
      }, totalDelay);
    } else {
      // Non-streaming: just show final result
      setTimeout(() => {
        const respTokens = Math.ceil(resp.text.length / 4);
        const cost = (userTokens * 0.000003) + (respTokens * 0.000015);
        setMessages((m) => {
          const filtered = m.filter((msg) => !msg.isThinking);
          return [...filtered, {
            id: nextId++, role: 'assistant', content: resp.text, timestamp: new Date(),
            tokens: respTokens, cost, duration: totalDelay, codeBlock: resp.code,
          }];
        });
        setTotalTokens((t) => t + respTokens);
        setTotalCost((c) => c + cost);
        setIsThinking(false);
        chatList.scrollToBottom();
      }, totalDelay);
    }
  }

  function handleCommand(cmd: string) {
    const [command, ...args] = cmd.split(' ');
    switch (command?.toLowerCase()) {
      case 'help':
      case '?':
        setOverlay('help');
        break;
      case 'clear':
        setMessages([]);
        chatList.scrollToBottom();
        break;
      case 'model':
        if (args[0]) {
          const m = MODELS.find((x) => x.value === args[0] || x.label.toLowerCase() === args[0]!.toLowerCase());
          if (m) {
            setSettings((s) => ({ ...s, model: m.value }));
            addSystem(`Model changed to ${m.label}`);
          } else {
            addSystem(`Unknown model. Available: ${MODELS.map((x) => x.value).join(', ')}`);
          }
        } else {
          setOverlay('model-selector');
        }
        break;
      case 'theme':
        const next = getNextTheme(currentTheme);
        setTheme(next);
        addSystem(`Theme: ${next}`);
        break;
      case 'settings':
        setOverlay('settings');
        break;
      case 'code': {
        const lang = args[0] || 'typescript';
        addMessage({
          role: 'assistant',
          content: 'Here\'s an example:',
          codeBlock: {
            language: lang,
            code: lang === 'python'
              ? 'def greet(name: str) -> str:\n    return f"Hello, {name}!"'
              : 'function greet(name: string): string {\n  return `Hello, ${name}!`;\n}',
          },
        });
        break;
      }
      case 'tokens':
        addSystem(`Total tokens: ${totalTokens()} | Cost: $${totalCost().toFixed(4)} | Messages: ${messages().length}`);
        break;
      case 'compact':
        const count = messages().length;
        setMessages((m) => m.slice(-6));
        addSystem(`Compacted: removed ${count - 6} old messages`);
        chatList.scrollToBottom();
        break;
      default:
        addSystem(`Unknown command: /${command}. Try /help`);
    }
  }

  function addMessage(partial: Omit<Message, 'id' | 'timestamp'>) {
    setMessages((m) => [...m, { id: nextId++, timestamp: new Date(), ...partial }]);
  }

  function addSystem(content: string) {
    addMessage({ role: 'system', content });
  }

  // Single input handler for everything — stable hook count, no isActive toggling
  useInput((char, key) => {
    if (key.ctrl && char === 'c') { exit(); return true; }

    // When overlay is open: only Escape works
    if (overlay() !== 'none') {
      if (key.escape) { setOverlay('none'); return true; }
      return true; // block all other input while overlay is open
    }

    // Normal mode shortcuts
    if (key.ctrl && char === 'l') { setMessages([]); chatList.scrollToBottom(); return; }
    if (key.ctrl && char === 'm') { setOverlay('model-selector'); return; }
    if (key.ctrl && char === 't') { setOverlay('settings'); return; }
    if (key.tab && !key.shift) {
      const next = getNextTheme(currentTheme);
      setTheme(next);
      return;
    }
    if (char === '?' && !key.ctrl && !key.meta) {
      if (!textInputState().value()) { setOverlay('help'); return; }
    }
  }, { priority: 'modal', stopPropagation: true });

  // Render
  const textInput = textInputState();
  const currentSettings = settings();
  const currentOverlay = overlay();

  const inputNode = renderTextInput(textInput, {
    placeholder: isThinking()
      ? 'Wait for response...'
      : 'Message tuiuiu assistant...  (/help for commands)',
    borderStyle: 'round',
    focusedBorderColor: isThinking() ? resolveColor('warning') : resolveColor('primary'),
    prompt: '\u276F',
    foreground: resolveColor('primary'),
    fullWidth: true,
    multiline: true,
    wordWrap: true,
    autoGrow: true,
    maxLines: 5,
    showScrollbar: true,
    width: width - 2,
  });

  const inputLabel = isThinking() ? '\u25CF thinking' : `\u25CF ${currentSettings.model}`;
  const inputLabelColor = isThinking() ? resolveColor('warning') : resolveColor('primary');
  const inputHeight = measureHeight(inputNode, width - 2);
  // header(2) + label(1) + input + status(2) + padding(2)
  const messagesHeight = Math.max(3, height - 7 - inputHeight);

  return Box(
    { flexDirection: 'column', padding: 1 },

    // ── Header ──
    Box(
      {
        flexDirection: 'row',
        borderStyle: 'single',
        borderTop: false,
        borderLeft: false,
        borderRight: false,
        borderColor: resolveColor('border'),
        width: width - 2,
      },
      Logo(),
      Spacer(),
      Badge({ label: currentSettings.model, color: resolveColor('primary') }),
      Text({ dim: true }, `  ${formatTime(new Date())}`),
    ),

    // ── Overlay (occupies same slot, only when active) ──
    currentOverlay === 'help'
      ? Box({ height: messagesHeight, width: width - 2, overflow: 'hidden' },
          HelpOverlay({ width: width - 2 }))
      : currentOverlay === 'settings'
        ? Box({ height: messagesHeight, width: width - 2, overflow: 'hidden' },
            SettingsOverlay({ settings: currentSettings, width: width - 2 }))
        : currentOverlay === 'model-selector'
          ? Box({ height: messagesHeight, width: width - 2, overflow: 'hidden' },
              ModelSelectorOverlay({ currentModel: currentSettings.model }))
          : Text({}, ''),

    // ── Messages (ALWAYS rendered to keep hook count stable) ──
    ChatList({
      ...chatList.bind,
      items: messages(),
      children: (msg) => MessageBubble({ message: msg, maxWidth: width - 6 }),
      height: currentOverlay === 'none' ? messagesHeight : 0,
      width: width - 2,
    }),

    // ── Input label + input ──
    Text({ color: inputLabelColor, dim: true }, `  ${inputLabel}`),
    inputNode,

    // ── Status Line ──
    StatusLine({
      model: currentSettings.model,
      messageCount: messages().filter((m) => m.role !== 'system').length,
      totalTokens: totalTokens(),
      totalCost: totalCost(),
      streaming: currentSettings.streaming,
      width: width - 2,
    }),
  );
}

// =============================================================================
// Helpers
// =============================================================================

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// =============================================================================
// Run
// =============================================================================

const { waitUntilExit } = render(() => AiAssistantApp(), { autoTabNavigation: false });
await waitUntilExit();
