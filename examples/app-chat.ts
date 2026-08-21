/**
 * Tuiuiu Example: Enhanced Chat Interface
 *
 * Demonstrates all Tuiuiu components working together:
 * - TextInput with full editing capabilities
 * - Spinner with multiple styles
 * - ProgressBar for streaming
 * - Markdown rendering
 * - CodeBlock with syntax highlighting
 * - Theme switching support
 *
 * Run with: pnpm tsx examples/app-chat.ts
 */

import {
  render,
  Box,
  Text,
  Spacer,
  Newline,
  When,
  useState,
  useInteraction,
  useApp,
  setTheme,
  useTheme,
  resolveColor,
  type VNode,
} from '../src/index.js';
import { measureHeight } from '../src/core/index.js';
import { ChatList, getNextTheme, useScrollList } from '../src/ui/index.js';
import { useTerminalSize } from '../src/hooks/index.js';
import { KeyIndicator, withKeyIndicator, clearOldKeyPresses } from './_shared/key-indicator.js';
import { TuiuiuHeader } from './_shared/tuiuiu-header.js';
import { createTextInput, renderTextInput } from '../src/atoms/text-input.js';
import { type SpinnerStyle } from '../src/atoms/spinner.js';
import { KeyValueTable } from '../src/molecules/table.js';
import { wrapText, stringWidth } from '../src/utils/text-utils.js';

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  streaming?: boolean;
  tokens?: number;
}

let messageId = 0;

/**
 * Chat Bubble Component - Clean WhatsApp/iMessage style
 * User messages on the right, assistant/system on the left
 */
function ChatBubble(props: { message: Message; maxWidth?: number }): VNode {
  const { message, maxWidth = 45 } = props;
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const roleLabel = isUser ? '👤 Você' : isSystem ? '⚙️ Sistema' : '🤖 Assistente';
  const timeText = formatTime(message.timestamp);
  const contentMaxWidth = Math.max(1, maxWidth - 4);
  const wrappedContent = wrapText(message.content, contentMaxWidth, { wordWrap: true });
  const lines = wrappedContent.length > 0 ? wrappedContent.split('\n') : [''];
  const maxLineWidth = lines.reduce((max, line) => Math.max(max, stringWidth(line)), 0);
  const headerWidth = stringWidth(roleLabel) + 2 + stringWidth(timeText);
  const resolvedWidth = Math.min(maxWidth, Math.max(maxLineWidth, headerWidth) + 4);

  // Colors based on role
  const bubbleColor = isUser
    ? resolveColor('primary')
    : isSystem
      ? resolveColor('warning')
      : resolveColor('muted');

  // Simple bubble with border
  const bubble = Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: bubbleColor,
      paddingX: 1,
      width: resolvedWidth,
    },
    // Header: name + time
    Box(
      { flexDirection: 'row' },
      Text({ color: bubbleColor, bold: true }, roleLabel),
      Text({ color: resolveColor('muted'), dim: true }, `  ${timeText}`)
    ),
    // Content
    ...lines.map(line => Text({}, line)),
    // Streaming indicator
    message.streaming ? Text({ color: bubbleColor, dim: true }, '▌') : Text({}, '')
  );

  // Align: user right, others left
  return Box(
    { flexDirection: 'row', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 1, flexGrow: 1 },
    bubble
  );
}

/**
 * Help Panel Component
 */
function HelpPanel(): VNode {
  const shortcuts = [
    { key: 'Enter', value: 'Send message' },
    { key: 'Ctrl+N', value: 'New line' },
    { key: 'Up/Down', value: 'History navigation' },
    { key: 'Ctrl+L', value: 'Clear screen' },
    { key: 'Ctrl+C', value: 'Exit' },
    { key: 'Tab', value: 'Cycle theme' },
    { key: 'H', value: 'Toggle help' },
    { key: 'Esc', value: 'Cancel/Close' },
  ];

  return Box(
    { flexDirection: 'column', borderStyle: 'round', borderColor: resolveColor('primary'), padding: 1, marginBottom: 1 },
    Text({ color: resolveColor('primary'), bold: true }, '⌨️  Keyboard Shortcuts'),
    Newline(),
    KeyValueTable({
      entries: shortcuts,
      keyColor: resolveColor('warning'),
      valueColor: resolveColor('foreground'),
    })
  );
}

/**
 * Status Bar Component
 */
function StatusBar(props: {
  model: string;
  themeName: string;
  spinnerStyle: SpinnerStyle;
  messageCount: number;
  width?: number;
}): VNode {
  const { model, themeName, spinnerStyle, messageCount, width } = props;

  return Box(
    { flexDirection: 'row', marginTop: 1, paddingX: 1, width },
    Text({ color: resolveColor('primary') }, '▶'),
    Text({ color: resolveColor('foreground') }, ` ${model}`),
    Text({ color: resolveColor('muted'), dim: true }, ' │ '),
    Text({ color: resolveColor('muted') }, `${messageCount} msgs`),
    Text({ color: resolveColor('muted'), dim: true }, ' │ '),
    Text({ color: resolveColor('muted') }, `spinner: ${spinnerStyle}`),
    Text({ color: resolveColor('muted'), dim: true }, ' │ '),
    Text({ color: resolveColor('accent') }, `theme: ${themeName}`),
    Spacer(),
    Text({ color: resolveColor('muted'), dim: true }, 'tab:theme h:help')
  );
}

/**
 * Main Chat Application
 */
function EnhancedChatApp(): VNode {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [spinnerStyle, setSpinnerStyle] = useState<SpinnerStyle>('dots');

  const { exit } = useApp();
  const currentTheme = useTheme();

  // Use terminal size
  const { columns: width, rows: height } = useTerminalSize();

  // Determine bubble max width
  const bubbleMaxWidth = Math.floor(width * 0.65);

  // NEW: Simple scroll list hook for control
  const chatList = useScrollList({ inverted: true });

  // Create text input state (persisted across renders)
  const [textInputState] = useState(createTextInput({
    placeholder: 'Type your message...',
    history: inputHistory(),
    multiline: true,
    onChange: () => { },
    onSubmit: (value) => {
      if (!value.trim()) return;

      // Reset scroll on new message (scroll to bottom in chat)
      chatList.scrollToBottom();

      // Handle commands
      if (value.startsWith('/')) {
        handleCommand(value.slice(1));
        textInputState().clear();
        return;
      }

      // Add to history
      setInputHistory((h) => [...h, value]);

      // Add user message
      const userMsg: Message = {
        id: messageId++,
        role: 'user',
        content: value,
        timestamp: new Date(),
      };
      setMessages((m) => [...m, userMsg]);
      textInputState().clear();

      // Simulate streaming response
      simulateResponse(value);
    },
    onCancel: () => { },
    isActive: true,
  }));

  const textInput = textInputState();

  const inputNode = renderTextInput(textInput, {
    placeholder: 'Type your message... (/ for commands)',
    borderStyle: 'round',
    focusedBorderColor: resolveColor('primary'),
    prompt: '❯',
    foreground: resolveColor('primary'),
    fullWidth: true,
    multiline: true,
    wordWrap: true,
    autoGrow: true,
    maxLines: 5,
    showScrollbar: true,
    width: width - 2, // Minus outer padding; renderTextInput subtracts 6 more internally
  });
  const inputHeight = measureHeight(inputNode, width - 2);

  // Messages area height = total - header(3) - status(1) - input - padding(2)
  const messagesHeight = Math.max(3, height - 6 - inputHeight);

  // Handle slash commands
  const handleCommand = (cmd: string) => {
    const [command, ...args] = cmd.split(' ');

    switch (command.toLowerCase()) {
      case 'help':
        setShowHelp((h) => !h);
        break;

      case 'clear':
        setMessages([]);
        chatList.scrollToBottom();
        break;

      case 'spinner':
        const style = args[0] as SpinnerStyle;
        if (style) {
          setSpinnerStyle(style);
          addSystemMessage(`Spinner style changed to: ${style}`);
        } else {
          addSystemMessage('Available styles: dots, dots2, dots3, line, arc, circle, bounce, arrow, clock, earth, moon, hearts');
        }
        break;

      case 'theme':
        const nextTheme = getNextTheme(currentTheme);
        setTheme(nextTheme);
        addSystemMessage(`Theme changed to: ${nextTheme}`);
        break;

      case 'code':
        addSystemMessage('Here\'s an example code block:');
        break;

      default:
        addSystemMessage(`Unknown command: /${command}. Type /help for available commands.`);
    }
  };

  // Add system message
  const addSystemMessage = (content: string) => {
    const msg: Message = {
      id: messageId++,
      role: 'system',
      content,
      timestamp: new Date(),
    };
    setMessages((m) => [...m, msg]);
  };

  // Respond immediately (no typing delay)
  const simulateResponse = (userInput: string) => {
    // Add assistant message immediately
    const assistantMsg: Message = {
      id: messageId++,
      role: 'assistant',
      content: `Your last message has ${userInput.length} chars`,
      timestamp: new Date(),
    };
    setMessages((m) => [...m, assistantMsg]);
  };


  // Global key handler
  useInteraction(withKeyIndicator((char, key) => {
    clearOldKeyPresses();
    if (key.ctrl && char === 'c') {
      exit();
      return;
    }
    if (key.ctrl && char === 'l') {
      setMessages([]);
      chatList.scrollToBottom();
      return;
    }
    // Tab cycles theme
    if (key.tab && !key.shift) {
      const nextTheme = getNextTheme(currentTheme);
      setTheme(nextTheme);
      return;
    }
    // H toggles help
    if (char === 'h' && !key.ctrl) {
      setShowHelp((h) => !h);
      return;
    }
  }));

  return Box(
    { flexDirection: 'column', padding: 1 },
    // Header
    TuiuiuHeader({
      title: 'chat',
      emoji: '💬',
      subtitle: 'Interactive Chat Demo',
      showFps: false,
      width: width - 2,
    }),

    // Help panel (collapsible)
    When(showHelp(), HelpPanel()),

    // Messages Area - NEW simplified API!
    ChatList({
      ...chatList.bind,
      items: messages(),
      children: (msg) => ChatBubble({ message: msg, maxWidth: bubbleMaxWidth }),
      height: messagesHeight,
      width: width - 2,
    }),

    // Input (multiline auto-expands)
    inputNode,

    // Status bar
    StatusBar({
      model: 'tuiuiu-demo',
      themeName: currentTheme.name,
      spinnerStyle: spinnerStyle(),
      messageCount: messages().length,
      width: width - 2,
    }),

    // Key indicator
    KeyIndicator({ width: width - 2 })
  );
}

/**
 * Format timestamp
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Run the app
const { waitUntilExit } = render(() => EnhancedChatApp(), { autoTabNavigation: false });
await waitUntilExit();
