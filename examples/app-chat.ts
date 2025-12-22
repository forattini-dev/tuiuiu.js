/**
 * Reck Example: Enhanced Chat Interface
 *
 * Demonstrates all Reck components working together:
 * - TextInput with full editing capabilities
 * - Spinner with multiple styles
 * - ProgressBar for streaming
 * - Markdown rendering
 * - CodeBlock with syntax highlighting
 * - Select for command palette
 *
 * Run with: pnpm tsx src/cli/reck/examples/enhanced-chat.ts
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
} from '../src/index.js';
import { KeyIndicator, withKeyIndicator, clearOldKeyPresses } from './_shared/key-indicator.js';
import { createTextInput, renderTextInput } from '../src/components/text-input.js';
import { createSpinner, renderSpinner, type SpinnerStyle } from '../src/components/spinner.js';
import { ProgressBar } from '../src/components/progress-bar.js';
import { Markdown } from '../src/components/markdown.js';
import { CodeBlock } from '../src/components/code-block.js';
import { Table, KeyValueTable } from '../src/components/table.js';

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  streaming?: boolean;
  tokens?: number;
}

interface AppState {
  messages: Message[];
  isStreaming: boolean;
  streamProgress: number;
  inputHistory: string[];
  showHelp: boolean;
  theme: 'dark' | 'light';
  spinnerStyle: SpinnerStyle;
}

let messageId = 0;

/**
 * Message Bubble Component
 */
function MessageBubble(props: { message: Message }): VNode {
  const { message } = props;
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // Determine icon and color based on role
  const icon = isUser ? '👤' : isSystem ? '⚙️' : '🤖';
  const nameColor = isUser ? 'blue' : isSystem ? 'yellow' : 'green';
  const name = isUser ? 'You' : isSystem ? 'System' : 'Assistant';

  // Check if content contains markdown elements
  const hasMarkdown = message.content.includes('```') ||
                      message.content.includes('#') ||
                      message.content.includes('**') ||
                      message.content.includes('- ');

  return Box(
    { flexDirection: 'column', marginBottom: 1 },
    // Header
    Box(
      { flexDirection: 'row' },
      Text({ color: nameColor, bold: true }, `${icon} ${name}`),
      Spacer(),
      Text({ color: 'gray', dim: true }, formatTime(message.timestamp)),
      message.tokens
        ? Text({ color: 'gray', dim: true }, ` · ${message.tokens} tokens`)
        : Text({}, '')
    ),
    // Content
    Box(
      { paddingLeft: 3, marginTop: 0 },
      hasMarkdown && !isUser
        ? Markdown({ content: message.content, maxWidth: 80 })
        : Text({}, message.content)
    ),
    // Streaming indicator
    message.streaming
      ? Box(
          { paddingLeft: 3 },
          Text({ color: 'cyan', dim: true }, '▌')
        )
      : Box({})
  );
}

/**
 * Help Panel Component
 */
function HelpPanel(): VNode {
  const shortcuts = [
    { key: 'Enter', value: 'Send message' },
    { key: 'Shift+Enter', value: 'New line' },
    { key: 'Up/Down', value: 'History navigation' },
    { key: 'Ctrl+L', value: 'Clear screen' },
    { key: 'Ctrl+C', value: 'Exit' },
    { key: 'Tab', value: 'Toggle help' },
    { key: 'Esc', value: 'Cancel/Close' },
  ];

  return Box(
    { flexDirection: 'column', borderStyle: 'round', borderColor: 'cyan', padding: 1, marginBottom: 1 },
    Text({ color: 'cyan', bold: true }, '⌨️  Keyboard Shortcuts'),
    Newline(),
    KeyValueTable({
      entries: shortcuts,
      keyColor: 'yellow',
      valueColor: 'white',
    })
  );
}

/**
 * Status Bar Component
 */
function StatusBar(props: {
  model: string;
  theme: string;
  spinnerStyle: SpinnerStyle;
  messageCount: number;
}): VNode {
  const { model, theme, spinnerStyle, messageCount } = props;

  return Box(
    { flexDirection: 'row', marginTop: 1, paddingX: 1 },
    Text({ color: 'cyan' }, '▶'),
    Text({ color: 'white' }, ` ${model}`),
    Text({ color: 'gray', dim: true }, ' │ '),
    Text({ color: 'gray' }, `${messageCount} msgs`),
    Text({ color: 'gray', dim: true }, ' │ '),
    Text({ color: 'gray' }, `spinner: ${spinnerStyle}`),
    Spacer(),
    Text({ color: 'gray', dim: true }, 'tab:help')
  );
}

/**
 * Streaming Indicator Component
 */
function StreamingIndicator(props: {
  isActive: boolean;
  progress: number;
  style: SpinnerStyle;
}): VNode {
  const { isActive, progress, style } = props;

  if (!isActive) return Box({});

  const spinner = createSpinner({ style, text: 'Generating response...' });

  return Box(
    { flexDirection: 'column', marginY: 1 },
    renderSpinner(spinner, {
      style,
      showTime: true,
      showTokens: true,
      tokens: Math.floor(progress * 10),
      hint: 'esc to cancel',
    }),
    ProgressBar({
      value: progress,
      max: 100,
      width: 30,
      style: 'smooth',
      showPercentage: true,
      color: 'cyan',
    })
  );
}

/**
 * Welcome Message
 */
function WelcomeMessage(): VNode {
  const exampleCode = `const reck = require('reck');

// Create a reactive signal
const [count, setCount] = reck.createSignal(0);

// Create an effect that runs when count changes
reck.createEffect(() => {
  console.log('Count:', count());
});

setCount(1); // Logs: "Count: 1"`;

  return Box(
    { flexDirection: 'column', marginBottom: 2 },
    Text({ color: 'magenta', bold: true }, '🚀 Welcome to Reck Chat'),
    Newline(),
    Markdown({
      content: `
## Getting Started

This is an **enhanced chat interface** built with Reck - a lightweight reactive terminal UI framework.

### Features

- Full markdown support with \`syntax highlighting\`
- **Bold**, *italic*, and ~~strikethrough~~ text
- Code blocks with language detection
- Interactive input with history
- Multiple spinner styles

### Try These Commands

- \`/help\` - Show keyboard shortcuts
- \`/clear\` - Clear the screen
- \`/spinner <style>\` - Change spinner style
- \`/code\` - Show a code example

---

Type your message and press **Enter** to send.
`,
      maxWidth: 80,
    }),
    Newline(),
    Text({ color: 'gray', dim: true }, 'Example code block:'),
    CodeBlock({
      code: exampleCode,
      language: 'javascript',
      lineNumbers: true,
      borderStyle: 'round',
    })
  );
}

/**
 * Main Chat Application
 */
function EnhancedChatApp(): VNode {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [spinnerStyle, setSpinnerStyle] = useState<SpinnerStyle>('dots');
  const [showWelcome, setShowWelcome] = useState(true);

  const { exit } = useApp();

  // Create text input state
  const textInput = createTextInput({
    placeholder: 'Type your message...',
    history: inputHistory(),
    multiline: true,
    onChange: () => {
      // Hide welcome on first input
      if (showWelcome()) setShowWelcome(false);
    },
    onSubmit: (value) => {
      if (!value.trim()) return;

      // Handle commands
      if (value.startsWith('/')) {
        handleCommand(value.slice(1));
        textInput.clear();
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
      textInput.clear();
      setShowWelcome(false);

      // Simulate streaming response
      simulateResponse(value);
    },
    onCancel: () => {
      if (isStreaming()) {
        setIsStreaming(false);
        setStreamProgress(0);
      }
    },
    isActive: !isStreaming(),
  });

  // Handle slash commands
  const handleCommand = (cmd: string) => {
    const [command, ...args] = cmd.split(' ');

    switch (command.toLowerCase()) {
      case 'help':
        setShowHelp((h) => !h);
        break;

      case 'clear':
        setMessages([]);
        setShowWelcome(true);
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

  // Simulate streaming response
  const simulateResponse = (userInput: string) => {
    setIsStreaming(true);
    setStreamProgress(0);

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        // Add assistant message
        const response = generateResponse(userInput);
        const assistantMsg: Message = {
          id: messageId++,
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          tokens: Math.floor(response.length / 4),
        };
        setMessages((m) => [...m, assistantMsg]);
        setIsStreaming(false);
        setStreamProgress(0);
      }
      setStreamProgress(progress);
    }, 100);
  };

  // Generate mock response
  const generateResponse = (input: string): string => {
    const lowered = input.toLowerCase();

    if (lowered.includes('hello') || lowered.includes('hi')) {
      return 'Hello! How can I help you today? I can answer questions, generate code, or have a conversation.';
    }

    if (lowered.includes('code') || lowered.includes('example')) {
      return `Here's a simple example:

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

This function takes a name and returns a greeting.`;
    }

    if (lowered.includes('help')) {
      return `## Available Commands

- **/help** - Toggle keyboard shortcuts
- **/clear** - Clear chat history
- **/spinner <style>** - Change spinner animation
- **/code** - Show code example

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Enter | Send message |
| Shift+Enter | New line |
| Up/Down | Navigate history |
| Tab | Toggle help |
| Esc | Cancel |`;
    }

    if (lowered.includes('table')) {
      return `Here's a table example:

| Feature | Status | Priority |
|---------|--------|----------|
| Text Input | ✅ Done | High |
| Spinner | ✅ Done | Medium |
| Progress Bar | ✅ Done | Medium |
| Markdown | ✅ Done | High |`;
    }

    return `I received your message: "${input}"

This is a demo response that shows **markdown formatting**, including:

1. Bold and *italic* text
2. Inline \`code\` snippets
3. Lists and bullet points

> This is a blockquote for emphasis.

Feel free to ask me anything!`;
  };

  // Global key handler
  useInput(withKeyIndicator((char, key) => {
    clearOldKeyPresses();
    if (key.ctrl && char === 'c') {
      exit();
      return;
    }
    if (key.ctrl && char === 'l') {
      setMessages([]);
      setShowWelcome(true);
      return;
    }
    if (key.tab && !key.shift) {
      setShowHelp((h) => !h);
      return;
    }
  }));

  return Box(
    { flexDirection: 'column', padding: 1 },
    // Header
    Box(
      { flexDirection: 'row', marginBottom: 1 },
      Text({ color: 'magenta', bold: true }, '🚀 Reck Chat'),
      Spacer(),
      Text({ color: 'gray', dim: true }, 'v1.0.0')
    ),

    // Help panel (collapsible)
    When(showHelp(), HelpPanel()),

    // Welcome message
    When(showWelcome() && messages().length === 0, WelcomeMessage()),

    // Messages
    Each(messages(), (msg) => MessageBubble({ message: msg })),

    // Streaming indicator
    StreamingIndicator({
      isActive: isStreaming(),
      progress: streamProgress(),
      style: spinnerStyle(),
    }),

    // Input
    When(
      !isStreaming(),
      renderTextInput(textInput, {
        placeholder: 'Type your message... (/ for commands)',
        borderStyle: 'round',
        focusedBorderColor: 'cyan',
        prompt: '❯',
        promptColor: 'cyan',
        isActive: true,
      })
    ),

    // Status bar
    StatusBar({
      model: 'reck-demo',
      theme: 'dark',
      spinnerStyle: spinnerStyle(),
      messageCount: messages().length,
    }),

    // Key indicator
    KeyIndicator()
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
const { waitUntilExit } = render(() => EnhancedChatApp());
await waitUntilExit();
