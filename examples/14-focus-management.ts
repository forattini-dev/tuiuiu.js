/**
 * Focus Management Example
 *
 * Showcases focus management capabilities:
 * - Focus state with useFocus hook
 * - Focus manager for navigation
 * - Tab/Shift+Tab navigation
 * - Custom focus indicators
 * - Programmatic focus control
 *
 * Run with: npx tsx examples/14-focus-management.ts
 */

import {
  render,
  Box,
  Text,
  useState,
  useInput,
  useApp,
  useFocus,
  useFocusManager,
  Divider,
  setTheme,
  darkTheme,
} from '../src/index.js';

// Apply dark theme
setTheme(darkTheme);

type DemoType = 'basic' | 'navigation' | 'custom' | 'programmatic';

// Focusable button component using useFocus hook
function FocusableButton(props: {
  id: string;
  label: string;
  color?: string;
  onPress?: () => void;
}) {
  const { isFocused } = useFocus({ id: props.id });

  return Box(
    {
      borderStyle: isFocused ? 'double' : 'single',
      borderColor: isFocused ? props.color ?? 'cyan' : 'gray',
      paddingX: 2,
      paddingY: 0,
    },
    Text(
      {
        color: isFocused ? props.color ?? 'cyan' : 'gray',
        bold: isFocused,
      },
      props.label
    )
  );
}

// Focusable input field component
function FocusableField(props: {
  id: string;
  label: string;
  value: string;
}) {
  const { isFocused } = useFocus({ id: props.id });

  return Box(
    { flexDirection: 'column' },
    Text({ color: 'gray' }, props.label),
    Box(
      {
        borderStyle: 'single',
        borderColor: isFocused ? 'cyan' : 'gray',
        paddingX: 1,
        minWidth: 20,
      },
      Text({ color: isFocused ? 'white' : 'gray' }, props.value || '(empty)'),
      isFocused && Text({ color: 'cyan' }, '│')
    )
  );
}

function FocusManagementDemo() {
  const app = useApp();
  const [activeDemo, setActiveDemo] = useState<DemoType>('basic');
  const [focusLog, setFocusLog] = useState<string[]>([]);
  const focusManager = useFocusManager();

  const logFocus = (message: string) => {
    setFocusLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      app.exit();
    }
    if (input === '1') setActiveDemo('basic');
    if (input === '2') setActiveDemo('navigation');
    if (input === '3') setActiveDemo('custom');
    if (input === '4') setActiveDemo('programmatic');

    // Navigation
    if (key.tab) {
      if (key.shift) {
        focusManager.focusPrevious();
        logFocus('Focused previous');
      } else {
        focusManager.focusNext();
        logFocus('Focused next');
      }
    }

    // Demo-specific inputs
    if (activeDemo() === 'programmatic') {
      if (input === 'f') {
        focusManager.focusFirst();
        logFocus('Focused first');
      }
      if (input === 'l') {
        focusManager.focusLast();
        logFocus('Focused last');
      }
    }
  });

  const renderDemo = () => {
    switch (activeDemo()) {
      case 'basic':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'cyan', bold: true, marginBottom: 1 }, 'Basic Focus'),
          Text({ color: 'gray', marginBottom: 1 },
            'Press Tab to move focus, Shift+Tab to go back'),

          Box(
            { flexDirection: 'row', gap: 2, marginBottom: 1 },
            FocusableButton({ id: 'btn1', label: 'Button 1', color: 'cyan' }),
            FocusableButton({ id: 'btn2', label: 'Button 2', color: 'green' }),
            FocusableButton({ id: 'btn3', label: 'Button 3', color: 'yellow' }),
          ),

          Text({ color: 'gray' }, 'Focus behavior:'),
          Text({ color: 'gray', dim: true }, '  • Double border when focused'),
          Text({ color: 'gray', dim: true }, '  • Color changes to active color'),
          Text({ color: 'gray', dim: true }, '  • Bold text for focused element'),
        );

      case 'navigation':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'magenta', bold: true, marginBottom: 1 }, 'Navigation Pattern'),
          Text({ color: 'gray', marginBottom: 1 },
            'Form-like navigation with multiple field types'),

          Box(
            { flexDirection: 'column', gap: 1, marginBottom: 1 },
            FocusableField({ id: 'name', label: 'Name:', value: 'John Doe' }),
            FocusableField({ id: 'email', label: 'Email:', value: 'john@example.com' }),
            FocusableField({ id: 'phone', label: 'Phone:', value: '+1 555-1234' }),
          ),

          Box(
            { flexDirection: 'row', gap: 2, marginTop: 1 },
            FocusableButton({ id: 'cancel', label: 'Cancel', color: 'red' }),
            FocusableButton({ id: 'submit', label: 'Submit', color: 'green' }),
          ),
        );

      case 'custom':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'green', bold: true, marginBottom: 1 }, 'Custom Focus Indicators'),
          Text({ color: 'gray', marginBottom: 1 },
            'Different visual styles for focus states'),

          Box(
            { flexDirection: 'column', gap: 1, marginBottom: 1 },
            // Custom indicator styles
            Box(
              { flexDirection: 'row', gap: 2 },
              Box(
                {},
                Text({ color: focusManager.focusedId === 'arrow1' ? 'cyan' : 'gray' },
                  focusManager.focusedId === 'arrow1' ? '▶ ' : '  '),
                FocusableButton({ id: 'arrow1', label: 'Arrow Style', color: 'cyan' }),
              ),
            ),
            Box(
              { flexDirection: 'row', gap: 2 },
              Box(
                {},
                Text({ color: focusManager.focusedId === 'dot2' ? 'green' : 'gray' },
                  focusManager.focusedId === 'dot2' ? '● ' : '○ '),
                FocusableButton({ id: 'dot2', label: 'Dot Style', color: 'green' }),
              ),
            ),
            Box(
              { flexDirection: 'row', gap: 2 },
              Box(
                {},
                Text({ color: focusManager.focusedId === 'bracket3' ? 'yellow' : 'gray' },
                  focusManager.focusedId === 'bracket3' ? '[ ' : '  '),
                FocusableButton({ id: 'bracket3', label: 'Bracket Style', color: 'yellow' }),
                Text({ color: focusManager.focusedId === 'bracket3' ? 'yellow' : 'gray' },
                  focusManager.focusedId === 'bracket3' ? ' ]' : '  '),
              ),
            ),
          ),

          Text({ color: 'gray', marginTop: 1 }, 'Indicator types shown:'),
          Text({ color: 'gray', dim: true }, '  ▶ Arrow indicator'),
          Text({ color: 'gray', dim: true }, '  ● Filled/empty dot'),
          Text({ color: 'gray', dim: true }, '  [ ] Bracket style'),
        );

      case 'programmatic':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'yellow', bold: true, marginBottom: 1 }, 'Programmatic Focus'),
          Text({ color: 'gray', marginBottom: 1 },
            'Control focus with keyboard shortcuts'),

          Box(
            { flexDirection: 'row', gap: 2, marginBottom: 1 },
            FocusableButton({ id: 'prog1', label: 'First', color: 'cyan' }),
            FocusableButton({ id: 'prog2', label: 'Second', color: 'green' }),
            FocusableButton({ id: 'prog3', label: 'Third', color: 'yellow' }),
            FocusableButton({ id: 'prog4', label: 'Fourth', color: 'magenta' }),
          ),

          Box(
            { flexDirection: 'column', marginTop: 1 },
            Text({ color: 'white' }, 'Shortcuts:'),
            Text({ color: 'gray', dim: true }, '  [F] Focus first element'),
            Text({ color: 'gray', dim: true }, '  [L] Focus last element'),
            Text({ color: 'gray', dim: true }, '  [Tab] Focus next'),
            Text({ color: 'gray', dim: true }, '  [Shift+Tab] Focus previous'),
          ),

          Box(
            { marginTop: 1, padding: 1, borderStyle: 'single', borderColor: 'gray' },
            Text({ color: 'gray' }, `Current focus: `),
            Text({ color: 'cyan', bold: true }, focusManager.focusedId || 'none'),
          ),
        );

      default:
        return Text({}, 'Select a demo');
    }
  };

  return Box(
    {
      flexDirection: 'column',
      padding: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    },
    // Header
    Box(
      { marginBottom: 1 },
      Text({ color: 'cyan', bold: true }, ' Focus Management Demo ')
    ),

    // Navigation
    Box(
      { marginBottom: 1 },
      Text({ color: activeDemo() === 'basic' ? 'cyan' : 'gray' }, '[1] Basic  '),
      Text({ color: activeDemo() === 'navigation' ? 'magenta' : 'gray' }, '[2] Navigation  '),
      Text({ color: activeDemo() === 'custom' ? 'green' : 'gray' }, '[3] Custom  '),
      Text({ color: activeDemo() === 'programmatic' ? 'yellow' : 'gray' }, '[4] Programmatic')
    ),

    Divider({}),

    // Demo content
    Box({ marginTop: 1, minHeight: 12 }, renderDemo()),

    // Focus log
    Divider({ title: 'Focus Log' }),
    Box(
      { flexDirection: 'column', height: 5, padding: 1, borderStyle: 'single', borderColor: 'gray' },
      ...focusLog().map((log, i) =>
        Text({ color: i === focusLog().length - 1 ? 'white' : 'gray', dim: i < focusLog().length - 1 }, log)
      ),
      focusLog().length === 0 && Text({ color: 'gray', dim: true }, 'Press Tab to navigate between elements')
    ),

    // Footer
    Box(
      { marginTop: 1 },
      Text({ color: 'gray', dim: true }, '[1-4] Switch demo  [Tab/Shift+Tab] Navigate  [Q] Exit')
    )
  );
}

// Run the demo
const { waitUntilExit } = render(FocusManagementDemo);
await waitUntilExit();
