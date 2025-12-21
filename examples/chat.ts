/**
 * Reck Example: Chat Interface
 *
 * A simple chat interface similar to grok-cli
 * Run with: pnpm tsx src/cli/reck/examples/chat.ts
 */

import {
  render,
  Box,
  Text,
  Spacer,
  Newline,
  Each,
  When,
  useState,
  useInput,
  useApp,
  type VNode,
} from '../index.js';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

let messageId = 0;

/**
 * Chat Input Component
 */
function ChatInput(props: {
  value: () => string;
  cursorPosition: () => number;
  isProcessing: () => boolean;
}): VNode {
  const { value, cursorPosition, isProcessing } = props;
  const text = value();
  const cursor = cursorPosition();

  const beforeCursor = text.slice(0, cursor);
  const cursorChar = text[cursor] || ' ';
  const afterCursor = text.slice(cursor + 1);

  const borderColor = isProcessing() ? 'yellow' : 'blue';
  const placeholder = text.length === 0 ? 'Ask me anything...' : '';

  return Box(
    { borderStyle: 'round', borderColor, paddingX: 1 },
    Text({ color: 'cyan' }, '❯ '),
    When(
      text.length === 0,
      Text({ color: 'gray', dim: true }, placeholder)
    ),
    When(
      text.length > 0,
      Text({}, beforeCursor),
      Text({ backgroundColor: 'white', color: 'black' }, cursorChar),
      Text({}, afterCursor)
    )
  );
}

/**
 * Message Component
 */
function MessageView(props: { message: Message }): VNode {
  const { message } = props;
  const isUser = message.role === 'user';

  return Box(
    { flexDirection: 'column', marginBottom: 1 },
    Box(
      { flexDirection: 'row' },
      Text(
        { color: isUser ? 'blue' : 'green', bold: true },
        isUser ? '👤 You' : '🤖 Assistant'
      ),
      Spacer(),
      Text(
        { color: 'gray', dim: true },
        formatTime(message.timestamp)
      )
    ),
    Box(
      { paddingLeft: 3 },
      Text({}, message.content)
    )
  );
}

/**
 * Loading Spinner Component
 */
function LoadingSpinner(props: { isActive: () => boolean }): VNode {
  const { isActive } = props;

  if (!isActive()) {
    return Box({});
  }

  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const texts = ['Thinking...', 'Processing...', 'Analyzing...', 'Computing...'];

  // In a real implementation, we'd use a timer to animate
  const frame = frames[0];
  const text = texts[0];

  return Box(
    { marginTop: 1 },
    Text({ color: 'cyan' }, `${frame} ${text} `),
    Text({ color: 'gray', dim: true }, '(esc to cancel)')
  );
}

/**
 * Status Bar Component
 */
function StatusBar(props: { model: string; autoEdit: () => boolean }): VNode {
  const { model, autoEdit } = props;

  return Box(
    { flexDirection: 'row', marginTop: 1 },
    Text({ color: 'cyan' }, autoEdit() ? '▶' : '⏸'),
    Text({ color: 'cyan' }, ` auto-edit: ${autoEdit() ? 'on' : 'off'}`),
    Text({ color: 'gray', dim: true }, ' (shift+tab)'),
    Text({}, '  '),
    Text({ color: 'yellow' }, `≋ ${model}`)
  );
}

/**
 * Tips Component (shown when no messages)
 */
function Tips(): VNode {
  return Box(
    { flexDirection: 'column', marginBottom: 2 },
    Text({ color: 'cyan', bold: true }, 'Tips for getting started:'),
    Newline(),
    Text({ color: 'gray' }, '1. Ask questions, edit files, or run commands.'),
    Text({ color: 'gray' }, '2. Be specific for the best results.'),
    Text({ color: 'gray' }, '3. Press Shift+Tab to toggle auto-edit mode.'),
    Text({ color: 'gray' }, '4. Type /help for more information.')
  );
}

/**
 * Main Chat App
 */
function ChatApp(): VNode {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoEdit, setAutoEdit] = useState(true);

  const { exit } = useApp();

  useInput((char, key) => {
    // Handle special keys
    if (key.escape) {
      if (isProcessing()) {
        setIsProcessing(false);
      }
      return;
    }

    if (key.ctrl && char === 'c') {
      exit();
      return;
    }

    if (key.ctrl && char === 'l') {
      // Clear could be implemented here
      return;
    }

    // Shift+Tab toggles auto-edit
    if (key.tab && key.shift) {
      setAutoEdit((prev) => !prev);
      return;
    }

    // Tab completion could be added here
    if (key.tab) {
      return;
    }

    // Submit message
    if (key.return && input().trim()) {
      const userMessage: Message = {
        id: messageId++,
        role: 'user',
        content: input().trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setCursorPosition(0);
      setIsProcessing(true);

      // Simulate async response
      setTimeout(() => {
        const assistantMessage: Message = {
          id: messageId++,
          role: 'assistant',
          content: `I received your message: "${userMessage.content}"`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsProcessing(false);
      }, 1000);

      return;
    }

    // Cursor movement
    if (key.leftArrow) {
      setCursorPosition((prev) => Math.max(0, prev - 1));
      return;
    }

    if (key.rightArrow) {
      setCursorPosition((prev) => Math.min(input().length, prev + 1));
      return;
    }

    if (key.home) {
      setCursorPosition(0);
      return;
    }

    if (key.end) {
      setCursorPosition(input().length);
      return;
    }

    // Backspace
    if (key.backspace) {
      const pos = cursorPosition();
      if (pos > 0) {
        setInput((prev) => prev.slice(0, pos - 1) + prev.slice(pos));
        setCursorPosition((prev) => prev - 1);
      }
      return;
    }

    // Delete
    if (key.delete) {
      const pos = cursorPosition();
      setInput((prev) => prev.slice(0, pos) + prev.slice(pos + 1));
      return;
    }

    // Regular character input
    if (char && char.length === 1) {
      const pos = cursorPosition();
      setInput((prev) => prev.slice(0, pos) + char + prev.slice(pos));
      setCursorPosition((prev) => prev + 1);
    }
  });

  return Box(
    { flexDirection: 'column', padding: 2 },

    // Header
    Text({ color: 'magenta', bold: true }, '🚀 RECK Chat Demo'),
    Newline(),

    // Tips (only when no messages)
    When(messages().length === 0, Tips()),

    // Instructions
    Text({ color: 'gray' }, "Type your message. Press Enter to send, Ctrl+C to quit."),
    Newline(),

    // Messages
    Each(messages(), (msg) => MessageView({ message: msg })),

    // Loading spinner
    LoadingSpinner({ isActive: isProcessing }),

    // Input
    ChatInput({
      value: input,
      cursorPosition,
      isProcessing,
    }),

    // Status bar
    StatusBar({
      model: 'grok-beta',
      autoEdit,
    })
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

// Run the app - pass a function so context is initialized first
const { waitUntilExit } = render(() => ChatApp());
await waitUntilExit();
