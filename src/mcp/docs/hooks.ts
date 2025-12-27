/**
 * Hooks Documentation
 */

import type { HookDoc } from '../types.js';

export const hooks: HookDoc[] = [
  {
    name: 'useState',
    description: 'Create reactive state that triggers re-renders when updated.',
    signature: 'useState<T>(initialValue: T): [Accessor<T>, Setter<T>]',
    params: [
      { name: 'initialValue', type: 'T', required: true, description: 'Initial state value' },
    ],
    returns: 'Tuple of [getter function, setter function]',
    examples: [
      `const [count, setCount] = useState(0);\n// Read: count()\n// Write: setCount(5) or setCount(c => c + 1)`,
    ],
  },
  {
    name: 'useEffect',
    description: 'Run side effects when dependencies change.',
    signature: 'useEffect(fn: () => void | (() => void)): void',
    params: [
      { name: 'fn', type: '() => void | (() => void)', required: true, description: 'Effect function, optionally returning cleanup' },
    ],
    returns: 'void',
    examples: [
      `useEffect(() => {\n  console.log('Count changed:', count());\n  return () => console.log('Cleanup');\n});`,
    ],
  },
  {
    name: 'useInput',
    description: 'Handle keyboard input events.',
    signature: 'useInput(handler: InputHandler): void',
    params: [
      { name: 'handler', type: '(input: string, key: Key) => void', required: true, description: 'Input event handler' },
    ],
    returns: 'void',
    examples: [
      `useInput((input, key) => {\n  if (key.upArrow) setIndex(i => i - 1);\n  if (key.downArrow) setIndex(i => i + 1);\n  if (key.return) select();\n  if (key.escape) cancel();\n});`,
    ],
  },
  {
    name: 'useApp',
    description: 'Access app context for exit control and terminal info.',
    signature: 'useApp(): AppContext',
    params: [],
    returns: 'AppContext with exit() method and terminal dimensions',
    examples: [
      `const app = useApp();\nuseInput((_, key) => {\n  if (key.escape) app.exit();\n});`,
    ],
  },
  {
    name: 'useFocus',
    description: 'Manage focus state for interactive components.',
    signature: 'useFocus(options?: FocusOptions): FocusResult',
    params: [
      { name: 'options.autoFocus', type: 'boolean', required: false, default: 'false', description: 'Auto-focus on mount' },
      { name: 'options.id', type: 'string', required: false, description: 'Focus element ID' },
    ],
    returns: 'Object with isFocused() accessor and focus control methods',
    examples: [
      `const { isFocused, focus } = useFocus({ autoFocus: true });\n// isFocused() returns true/false`,
    ],
  },
  {
    name: 'useMouse',
    description: 'Handle mouse events (click, scroll, move).',
    signature: 'useMouse(handler: MouseHandler): void',
    params: [
      { name: 'handler', type: 'MouseHandler', required: true, description: 'Mouse event handler' },
    ],
    returns: 'void',
    examples: [
      `useMouse((event) => {\n  if (event.type === 'click') handleClick(event.x, event.y);\n  if (event.type === 'scroll') handleScroll(event.direction);\n});`,
    ],
  },
  {
    name: 'useHotkeys',
    description: 'Register a keyboard shortcut with human-readable syntax. Supports scopes to prevent conflicts between components.',
    signature: 'useHotkeys(hotkeys: string | string[], handler: () => void, options?: HotkeyOptions): void',
    params: [
      { name: 'hotkeys', type: 'string | string[]', required: true, description: 'Hotkey string(s) like "ctrl+s" or ["ctrl+z", "cmd+z"]' },
      { name: 'handler', type: '() => void', required: true, description: 'Function to call when hotkey is triggered' },
      { name: 'options.scope', type: 'string', required: false, default: "'global'", description: 'Hotkey scope - only fires when scope matches current scope' },
      { name: 'options.description', type: 'string', required: false, description: 'Description for help screens (via getRegisteredHotkeys)' },
    ],
    returns: 'void',
    examples: [
      `// Simple hotkey\nuseHotkeys('ctrl+s', () => save());`,
      `// Cross-platform (Ctrl on Linux/Windows, Cmd on Mac)\nuseHotkeys(['ctrl+z', 'cmd+z'], () => undo());`,
      `// Scoped hotkey (only fires when scope is 'modal')\nuseHotkeys('escape', () => closeModal(), { scope: 'modal' });`,
      `// With description for help screen\nuseHotkeys('f1', () => showHelp(), { description: 'Show help' });`,
      `// Multiple hotkeys in component\nfunction Editor() {\n  useHotkeys('ctrl+s', save, { description: 'Save' });\n  useHotkeys('ctrl+z', undo, { description: 'Undo' });\n  useHotkeys('ctrl+f', find, { description: 'Find' });\n}`,
    ],
  },
  {
    name: 'useTerminalSize',
    description: 'Get reactive terminal dimensions that update on resize.',
    signature: 'useTerminalSize(): { columns: Accessor<number>, rows: Accessor<number> }',
    params: [],
    returns: 'Object with reactive columns() and rows() accessors',
    examples: [
      `const { columns, rows } = useTerminalSize();\n// columns() and rows() update automatically on terminal resize`,
    ],
  },
  {
    name: 'useModalInput',
    description: 'Convenience hook for modal-like components with higher input priority. Handlers with stopPropagation prevent input from reaching lower-priority handlers.',
    signature: 'useModalInput(handler: InputHandler, options?: Omit<UseInputOptions, "priority">): void',
    params: [
      { name: 'handler', type: '(input: string, key: Key) => boolean | void', required: true, description: 'Input handler. Return true to stop propagation.' },
      { name: 'options.stopPropagation', type: 'boolean', required: false, default: 'true', description: 'Block lower-priority handlers when returning truthy' },
      { name: 'options.isActive', type: 'boolean', required: false, default: 'true', description: 'Enable/disable handler dynamically' },
    ],
    returns: 'void',
    examples: [
      `// Modal that blocks background input\nuseModalInput((input, key) => {\n  if (key.escape) {\n    closeModal();\n    return true; // Stop propagation\n  }\n  if (key.return) {\n    confirm();\n    return true;\n  }\n});`,
    ],
  },
  {
    name: 'useCriticalInput',
    description: 'Convenience hook for critical dialogs (highest priority). Use for error dialogs, system confirmations, etc.',
    signature: 'useCriticalInput(handler: InputHandler, options?: Omit<UseInputOptions, "priority">): void',
    params: [
      { name: 'handler', type: '(input: string, key: Key) => boolean | void', required: true, description: 'Input handler. Return true to stop propagation.' },
      { name: 'options.stopPropagation', type: 'boolean', required: false, default: 'true', description: 'Block lower-priority handlers' },
    ],
    returns: 'void',
    examples: [
      `// Critical error dialog - highest priority\nuseCriticalInput((input, key) => {\n  if (key.return) {\n    acknowledgeError();\n    return true;\n  }\n});`,
    ],
  },
  {
    name: 'useThemeOverride',
    description: 'Temporarily override the theme and automatically restore when component unmounts. Essential for modals or overlays that need a different theme.',
    signature: 'useThemeOverride(theme: Theme): void',
    params: [
      { name: 'theme', type: 'Theme', required: true, description: 'Theme to apply temporarily' },
    ],
    returns: 'void',
    examples: [
      `import { lightTheme } from 'tuiuiu.js/themes';\n\nfunction HighContrastModal() {\n  useThemeOverride(lightTheme); // Pushes theme, pops on unmount\n  return Modal({}, Text({}, 'High contrast content'));\n}`,
    ],
  },
  {
    name: 'useHotkeyScope',
    description: 'Temporarily set a hotkey scope and automatically restore when component unmounts. Essential for modals that should only respond to their own hotkeys.',
    signature: 'useHotkeyScope(scope: string): void',
    params: [
      { name: 'scope', type: 'string', required: true, description: 'Hotkey scope to activate' },
    ],
    returns: 'void',
    examples: [
      `function SettingsModal() {\n  useHotkeyScope('settings-modal'); // Pushes scope, pops on unmount\n  // Now only 'settings-modal' and 'global' hotkeys work\n  return Modal({}, Text({}, 'Settings...'));\n}`,
    ],
  },
  {
    name: 'useCurrentHotkeyScope',
    description: 'Get the current hotkey scope as a reactive accessor.',
    signature: 'useCurrentHotkeyScope(): Accessor<string>',
    params: [],
    returns: 'Reactive accessor returning current scope name',
    examples: [
      `function ScopeIndicator() {\n  const scope = useCurrentHotkeyScope();\n  return Text({}, \`Current scope: \${scope()}\`);\n}`,
    ],
  },
  {
    name: 'useNavigation',
    description: 'Hook for linked list navigation (previous/next). Useful for wizards, carousels, and step-based UIs.',
    signature: 'useNavigation<T>(nodes: T[], options?: NavigationOptions): NavigationState<T>',
    params: [
      { name: 'nodes', type: 'T[]', required: true, description: 'Array of navigation nodes' },
      { name: 'options.loop', type: 'boolean', required: false, default: 'false', description: 'Loop from last to first' },
      { name: 'options.initialIndex', type: 'number', required: false, default: '0', description: 'Starting index' },
    ],
    returns: 'Object with current(), next(), previous(), goTo(), canGoNext(), canGoPrevious()',
    examples: [
      `const nav = useNavigation(['step1', 'step2', 'step3']);\n\n// Navigate\nnav.next();\nnav.previous();\nnav.goTo(2);\n\n// Check state\nnav.current(); // 'step2'\nnav.canGoNext(); // true\nnav.canGoPrevious(); // true`,
    ],
  },
  {
    name: 'useFocusManager',
    description: 'Create and manage a focus zone with multiple focusable elements.',
    signature: 'useFocusManager(options?: FocusManagerOptions): FocusManager',
    params: [
      { name: 'options.loop', type: 'boolean', required: false, default: 'true', description: 'Loop focus from last to first' },
      { name: 'options.orientation', type: '"horizontal" | "vertical"', required: false, default: '"vertical"', description: 'Focus direction' },
    ],
    returns: 'FocusManager with register(), focus(), focusNext(), focusPrevious(), etc.',
    examples: [
      `const focus = useFocusManager({ orientation: 'vertical' });\n\n// Register focusable elements\nButton({ ...focus.register('btn1'), label: 'First' })\nButton({ ...focus.register('btn2'), label: 'Second' })\n\n// Navigate\nfocus.focusNext();\nfocus.focusPrevious();\nfocus.focus('btn2');`,
    ],
  },
  {
    name: 'useFps',
    description: 'Track frames per second for performance monitoring. Automatically tracks frames on each render.',
    signature: 'useFps(): UseFpsResult',
    params: [],
    returns: 'Object with fps (number), metrics (FpsMetrics), and color (green/yellow/red)',
    examples: [
      `const { fps, metrics, color } = useFps();\n\n// Display FPS\nText({ color }, \`\${fps} FPS\`)\n\n// Show detailed metrics\nText({}, \`Avg: \${metrics.avgFps} | Min: \${metrics.minFps} | Max: \${metrics.maxFps}\`)`,
      `// FpsMetrics includes:\n// - fps: current FPS\n// - avgFps: rolling average (10s)\n// - minFps: minimum recorded\n// - maxFps: maximum recorded\n// - totalFrames: total frames rendered\n// - uptime: time since tracking started (ms)\n// - frameTime: ms per frame (1000/fps)`,
    ],
  },
  {
    name: 'useForm',
    description: 'Form state management hook with validation, submission, and field binding.',
    signature: 'useForm<T extends FormValues>(options: UseFormOptions<T>): UseFormResult<T>',
    params: [
      { name: 'options.initialValues', type: 'T', required: true, description: 'Initial form values object' },
      { name: 'options.validate', type: '(values: T) => FormErrors<T>', required: false, description: 'Validation function returning field errors' },
      { name: 'options.onSubmit', type: '(values: T) => void | Promise<void>', required: false, description: 'Submit handler' },
      { name: 'options.onError', type: '(errors: FormErrors<T>) => void', required: false, description: 'Called when validation fails' },
      { name: 'options.validateOnChange', type: 'boolean', required: false, default: 'false', description: 'Validate on value change' },
      { name: 'options.validateOnBlur', type: 'boolean', required: false, default: 'true', description: 'Validate on field blur' },
    ],
    returns: `Object with:
- values() - accessor for current values
- errors() - accessor for validation errors
- touched() - accessor for touched fields
- setValue(key, value) - set field value
- setError(key, error) - set field error
- isValid() - check if form is valid
- isDirty() - check if form has changes
- isSubmitting() - check if submitting
- submit() - validate and submit
- reset() - reset to initial values
- field(key) - get binding props for TextInput`,
    examples: [
      `const form = useForm({\n  initialValues: { email: '', password: '' },\n  validate: (values) => {\n    const errors = {};\n    if (!values.email) errors.email = 'Required';\n    if (!values.email.includes('@')) errors.email = 'Invalid';\n    return errors;\n  },\n  onSubmit: async (values) => {\n    await login(values);\n  },\n});\n\n// Use in components\nFormField({\n  label: 'Email',\n  error: form.errors().email,\n  children: TextInput({ ...form.field('email') }),\n})\n\nButton({\n  label: 'Submit',\n  loading: form.isSubmitting(),\n  onClick: () => form.submit(),\n})`,
      `// Built-in validators\nconst validate = createFormValidator({\n  email: [required(), email()],\n  password: [required(), minLength(8)],\n  confirmPassword: [required(), matchField('password', 'Passwords must match')],\n});`,
    ],
  },
];
