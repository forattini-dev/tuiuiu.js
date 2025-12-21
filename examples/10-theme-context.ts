/**
 * Example 10: Theme Context
 *
 * Demonstrates using Context API for theme management with light/dark modes.
 *
 * Run: npx tsx examples/10-theme-context.ts
 *
 * Controls:
 * - Tab: Cycle through buttons
 * - Enter: Toggle theme / select
 * - q: Quit
 */

import {
  render,
  createSignal,
  createContext,
  useContext,
  Box,
  Text,
  useInput,
  useFocus,
  useApp,
} from '../src/index.js';

// =============================================================================
// Theme Definition
// =============================================================================

interface Theme {
  name: 'dark' | 'light';
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    muted: string;
    border: string;
  };
}

const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: '#1a1a2e',
    foreground: 'white',
    primary: 'cyan',
    secondary: 'magenta',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    muted: 'gray',
    border: 'gray',
  },
};

const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: '#ffffff',
    foreground: 'black',
    primary: 'blue',
    secondary: 'magenta',
    success: 'greenBright',
    warning: 'yellowBright',
    error: 'redBright',
    muted: 'gray',
    border: 'black',
  },
};

// =============================================================================
// Theme Context
// =============================================================================

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: darkTheme,
  toggleTheme: () => {},
});

function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

// =============================================================================
// Themed Components
// =============================================================================

function ThemedBox(
  props: { title?: string; children?: any },
  ...children: any[]
) {
  const { theme } = useTheme();
  const allChildren = props.children
    ? Array.isArray(props.children)
      ? props.children
      : [props.children]
    : [];
  allChildren.push(...children);

  return Box(
    {
      borderStyle: 'round',
      borderColor: theme.colors.border,
      padding: 1,
      flexDirection: 'column',
    },
    props.title
      ? Text({ color: theme.colors.primary, bold: true }, props.title)
      : null,
    props.title ? Text({}, '') : null, // Spacer
    ...allChildren
  );
}

function ThemedButton(props: { label: string; onPress?: () => void }) {
  const { theme } = useTheme();
  const { isFocused } = useFocus();

  useInput((_, key) => {
    if (key.return && isFocused && props.onPress) {
      props.onPress();
    }
  });

  return Box(
    {
      borderStyle: 'single',
      borderColor: isFocused ? theme.colors.primary : theme.colors.muted,
      paddingX: 2,
    },
    Text(
      {
        color: isFocused ? theme.colors.primary : theme.colors.foreground,
        bold: isFocused,
      },
      isFocused ? `> ${props.label} <` : `  ${props.label}  `
    )
  );
}

function ThemedText(props: { type?: 'primary' | 'secondary' | 'muted' | 'success' | 'error' }, text: string) {
  const { theme } = useTheme();

  const colorMap = {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    muted: theme.colors.muted,
    success: theme.colors.success,
    error: theme.colors.error,
  };

  return Text(
    { color: props.type ? colorMap[props.type] : theme.colors.foreground },
    text
  );
}

// =============================================================================
// Demo Components
// =============================================================================

function Header() {
  const { theme, toggleTheme } = useTheme();

  return Box(
    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
    Text(
      { color: theme.colors.primary, bold: true },
      '🎨 Theme Context Demo'
    ),
    Text(
      { color: theme.colors.muted },
      `Current: ${theme.name === 'dark' ? '🌙 Dark' : '☀️ Light'}`
    )
  );
}

function ThemeToggle() {
  const { toggleTheme, theme } = useTheme();

  return Box({ marginY: 1 },
    ThemedButton({
      label: theme.name === 'dark' ? 'Switch to Light Mode ☀️' : 'Switch to Dark Mode 🌙',
      onPress: toggleTheme,
    })
  );
}

function ColorPalette() {
  const { theme } = useTheme();

  const colors = [
    { name: 'Primary', color: theme.colors.primary },
    { name: 'Secondary', color: theme.colors.secondary },
    { name: 'Success', color: theme.colors.success },
    { name: 'Warning', color: theme.colors.warning },
    { name: 'Error', color: theme.colors.error },
    { name: 'Muted', color: theme.colors.muted },
  ];

  return ThemedBox(
    { title: 'Color Palette' },
    Box(
      { flexDirection: 'column', gap: 0 },
      ...colors.map((c) =>
        Box(
          { flexDirection: 'row', key: c.name },
          Text({ color: c.color }, '████ '),
          Text({ color: theme.colors.foreground }, c.name)
        )
      )
    )
  );
}

function SampleContent() {
  const { theme } = useTheme();

  return ThemedBox(
    { title: 'Sample Content' },
    ThemedText({ type: 'primary' }, 'This is primary text'),
    ThemedText({ type: 'secondary' }, 'This is secondary text'),
    ThemedText({ type: 'muted' }, 'This is muted text'),
    Text({}, ''),
    ThemedText({ type: 'success' }, '✓ Success message'),
    ThemedText({ type: 'error' }, '✗ Error message')
  );
}

function ActionButtons() {
  const { theme } = useTheme();
  const [message, setMessage] = createSignal('');

  return ThemedBox(
    { title: 'Actions' },
    Box(
      { flexDirection: 'row', gap: 2 },
      ThemedButton({
        label: 'Save',
        onPress: () => setMessage('Saved!'),
      }),
      ThemedButton({
        label: 'Cancel',
        onPress: () => setMessage('Cancelled'),
      }),
      ThemedButton({
        label: 'Reset',
        onPress: () => setMessage('Reset done'),
      })
    ),
    message()
      ? Box(
          { marginTop: 1 },
          Text({ color: theme.colors.success }, `→ ${message()}`)
        )
      : null
  );
}

function Footer() {
  const { theme } = useTheme();
  const { exit } = useApp();

  useInput((input) => {
    if (input === 'q') exit();
  });

  return Box(
    { marginTop: 1 },
    Text(
      { color: theme.colors.muted, dim: true },
      'Tab: Navigate • Enter: Select • q: Quit'
    )
  );
}

// =============================================================================
// Main App
// =============================================================================

function App() {
  const [theme, setTheme] = createSignal<Theme>(darkTheme);

  const toggleTheme = () => {
    setTheme((current) => (current.name === 'dark' ? lightTheme : darkTheme));
  };

  const contextValue: ThemeContextValue = {
    get theme() {
      return theme();
    },
    toggleTheme,
  };

  return ThemeContext.Provider(
    { value: contextValue },
    Box(
      { flexDirection: 'column', padding: 1 },
      Header(),
      ThemeToggle(),
      Box(
        { flexDirection: 'row', gap: 2 },
        ColorPalette(),
        SampleContent()
      ),
      ActionButtons(),
      Footer()
    )
  );
}

// =============================================================================
// Run
// =============================================================================

const { waitUntilExit } = render(App);
await waitUntilExit();
