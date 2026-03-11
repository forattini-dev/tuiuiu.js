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
    description: 'Access the live app context for exit control, raw mode coordination, terminal streams, and app-level toggles.',
    signature: 'useApp(): AppContext',
    params: [],
    returns: `AppContext with:
- exit(error?) - terminate the app
- stdin / stdout - raw terminal streams
- onExit(cb) - register cleanup
- autoTabNavigation / setAutoTabNavigation() - manage built-in Tab navigation
- setRawMode() / rawModeEnabledCount / isRawModeEnabled() - coordinate raw mode references
- clearScreen?() - reset renderer state when available`,
    examples: [
      `const app = useApp();\nconst { focused } = useTerminalFocus();\n\nuseInput((_, key) => {\n  if (key.escape) app.exit();\n});\n\nText({}, focused ? 'Focused' : 'Backgrounded')`,
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
    signature: 'useTerminalSize(): { columns: number, rows: number }',
    params: [],
    returns: 'Object with numeric columns and rows. Components re-render automatically when the terminal is resized.',
    examples: [
      `const { columns, rows } = useTerminalSize();\nreturn Text({}, \`Terminal: \${columns}x\${rows}\`);`,
    ],
  },
  {
    name: 'useTerminalFocus',
    description: 'Read the current terminal focus state. Updates reactively when focus reporting is enabled for the terminal.',
    signature: 'useTerminalFocus(): { focused: boolean }',
    params: [],
    returns: 'Object with a boolean focused flag.',
    examples: [
      `const { focused } = useTerminalFocus();\nreturn Text({}, focused ? 'Active' : 'Paused while unfocused');`,
    ],
  },
  {
    name: 'useCompositor',
    description: 'Bind post-layout motion transforms to a component without changing its layout box.',
    signature: 'useCompositor(): { bind(props), slide(), fade(), shimmer(), spring(), reveal(), clear() }',
    params: [],
    returns: `Controller with:
- bind(props) - inject hidden compositor metadata into component props
- slide(options) - animate x/y offset
- fade(options) - animate opacity approximation
- shimmer(options) - animate a moving highlight band
- spring(options) - animate offsets with spring physics
- reveal(options) - animate clip progress from one direction
- clear() - remove active transforms`,
    examples: [
      `function AnimatedPanel() {\n  const compositor = useCompositor();\n\n  useInput((_, key) => {\n    if (key.rightArrow) compositor.slide({ toX: 4, duration: 160 });\n  });\n\n  return Box(\n    compositor.bind({ width: 20, borderStyle: 'single' }),\n    Text({}, 'Slides without relayout')\n  );\n}`,
      `const compositor = useCompositor();\ncompositor.fade({ from: 0, to: 1, duration: 120 });\ncompositor.reveal({ direction: 'left', from: 0, to: 1, duration: 180 });`,
    ],
  },
  {
    name: 'useLayoutRef',
    description: 'Measure the computed layout bounds of a Box after render.',
    signature: 'useLayoutRef(initial?: Partial<LayoutRect>): LayoutRef',
    params: [
      { name: 'initial', type: 'Partial<LayoutRect>', required: false, description: 'Initial bounds before first layout' },
    ],
    returns: 'LayoutRef with x(), y(), width(), height() accessors',
    examples: [
      `const ref = useLayoutRef();\nreturn Box({ layoutRef: ref }, Text({}, String(ref.height())));`,
    ],
  },
  {
    name: 'createLayoutRef',
    description: 'Create a layout ref for measurement outside hooks.',
    signature: 'createLayoutRef(initial?: Partial<LayoutRect>): LayoutRef',
    params: [
      { name: 'initial', type: 'Partial<LayoutRect>', required: false, description: 'Initial bounds before first layout' },
    ],
    returns: 'LayoutRef with x(), y(), width(), height() accessors',
    examples: [
      `const ref = createLayoutRef();\nBox({ layoutRef: ref }, Text({}, String(ref.width())));`,
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
    description: 'Track frames per second for performance monitoring. Automatically tracks frames on each render and reflects focus-aware runtime throttling.',
    signature: 'useFps(): UseFpsResult',
    params: [],
    returns: 'Object with fps (number), metrics (FpsMetrics), and color (green/yellow/red)',
    examples: [
      `const { fps, metrics, color } = useFps();\n\n// Display FPS\nText({ color }, \`\${fps} FPS\`)\n\n// Show detailed metrics\nText({}, \`Avg: \${metrics.avgFps} | Min: \${metrics.minFps} | Max: \${metrics.maxFps}\`)`,
      `// FpsMetrics includes:\n// - fps: current FPS\n// - avgFps: rolling average (10s)\n// - minFps: minimum recorded\n// - maxFps: maximum recorded\n// - totalFrames: total frames rendered\n// - uptime: time since tracking started (ms)\n// - frameTime: ms per frame (1000/fps)`,
    ],
  },
  {
    name: 'useInterval',
    description: 'Create a recurring timer with automatic cleanup on unmount. Perfect for animations, polling, and periodic updates.',
    signature: 'useInterval(callback: () => void, delay: number, options?: UseIntervalOptions): UseIntervalReturn',
    params: [
      { name: 'callback', type: '() => void', required: true, description: 'Function to call on each interval tick' },
      { name: 'delay', type: 'number', required: true, description: 'Delay between ticks in milliseconds' },
      { name: 'options.enabled', type: 'boolean', required: false, default: 'true', description: 'Start/stop timer reactively' },
      { name: 'options.immediate', type: 'boolean', required: false, default: 'false', description: 'Execute callback immediately on mount' },
    ],
    returns: 'Object with start(), stop(), and isRunning() controls',
    examples: [
      `// Basic usage - animate every 100ms\nconst [frame, setFrame] = useState(0);\nuseInterval(() => setFrame(f => f + 1), 100);`,
      `// With controls\nconst { start, stop, isRunning } = useInterval(\n  () => fetchData(),\n  5000,\n  { enabled: isPolling() }\n);\n\n// Manual control\nButton({ label: isRunning() ? 'Stop' : 'Start', onClick: isRunning() ? stop : start })`,
      `// Immediate execution\nuseInterval(() => tick(), 1000, { immediate: true }); // Runs immediately, then every 1s`,
    ],
  },
  {
    name: 'useClipboard',
    description: 'Copy text to the system clipboard through OSC 52 when the current terminal supports it.',
    signature: 'useClipboard(): { copy: (text: string) => void, supported: boolean }',
    params: [],
    returns: 'Object with copy(text) and a supported boolean.',
    examples: [
      `const { copy, supported } = useClipboard();\nuseHotkeys('ctrl+y', () => copy(JSON.stringify(data())));\nreturn Text({}, supported ? 'Ctrl+Y copies' : 'Clipboard unavailable');`,
    ],
  },
  {
    name: 'useNotification',
    description: 'Send terminal notifications through the best supported OSC channel. Becomes a no-op on unsupported terminals.',
    signature: 'useNotification(): { notify: (title: string, body?: string) => void, supported: boolean }',
    params: [],
    returns: 'Object with notify(title, body?) and a supported boolean.',
    examples: [
      `const { notify, supported } = useNotification();\nButton({\n  label: supported ? 'Notify' : 'No notifications',\n  onClick: () => notify('Build complete', 'All checks passed'),\n})`,
    ],
  },
  {
    name: 'useTimeout',
    description: 'Create a delayed execution with automatic cleanup on unmount. Perfect for debouncing, auto-hide, and delayed actions.',
    signature: 'useTimeout(callback: () => void, delay: number, options?: UseTimeoutOptions): UseTimeoutReturn',
    params: [
      { name: 'callback', type: '() => void', required: true, description: 'Function to call after delay' },
      { name: 'delay', type: 'number', required: true, description: 'Delay in milliseconds before execution' },
      { name: 'options.enabled', type: 'boolean', required: false, default: 'true', description: 'Start/cancel timer reactively' },
    ],
    returns: 'Object with start(), cancel(), and isPending() controls',
    examples: [
      `// Auto-hide notification after 3 seconds\nconst [visible, setVisible] = useState(true);\nuseTimeout(() => setVisible(false), 3000, { enabled: visible() });`,
      `// With controls\nconst { cancel, isPending } = useTimeout(\n  () => saveChanges(),\n  1000\n);\n\n// Cancel on user input\nuseInput(() => cancel());`,
      `// Restart timeout\nconst { start, cancel } = useTimeout(() => logout(), 300000); // 5min\n\n// Reset on activity\nuseInput(() => { cancel(); start(); });`,
    ],
  },
  {
    name: 'useLocalMouse',
    description: 'Transform terminal-absolute mouse coordinates to component-relative coordinates. Essential for canvas drawing, drag-and-drop, and hit testing.',
    signature: 'useLocalMouse(bounds: Bounds | () => Bounds, handler: LocalMouseHandler, options?: UseLocalMouseOptions): void',
    params: [
      { name: 'bounds', type: 'Bounds | () => Bounds', required: true, description: 'Component bounds {x, y, width, height} or getter function' },
      { name: 'handler', type: 'LocalMouseHandler', required: true, description: 'Handler receiving LocalMouseEvent with local coordinates' },
      { name: 'options.onlyInside', type: 'boolean', required: false, default: 'false', description: 'Only fire handler for events inside bounds' },
      { name: 'options.isActive', type: 'boolean', required: false, default: 'true', description: 'Enable/disable handler dynamically' },
      { name: 'options.enableTracking', type: 'boolean', required: false, default: 'true', description: 'Enable mouse tracking mode' },
    ],
    returns: 'void',
    examples: [
      `// Basic usage - canvas drawing\nconst bounds = { x: 10, y: 5, width: 80, height: 24 };\n\nuseLocalMouse(bounds, (event) => {\n  // event.x, event.y - relative to bounds (0,0 is top-left of component)\n  // event.globalX, event.globalY - terminal absolute coordinates\n  // event.isInside - true if click is within bounds\n  if (event.isInside && event.action === 'click') {\n    canvas.setPixel(event.x, event.y, '█', color);\n  }\n});`,
      `// Only handle inside clicks\nuseLocalMouse(bounds, (event) => {\n  // Only fires when mouse is inside bounds\n  handleDraw(event.x, event.y);\n}, { onlyInside: true });`,
      `// Reactive bounds (follows component position)\nconst [position, setPosition] = createSignal({ x: 0, y: 0 });\nuseLocalMouse(\n  () => ({ ...position(), width: 40, height: 20 }),\n  handleMouse\n);`,
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
  {
    name: 'useThresholdColor',
    description: 'Reactive color resolution based on numeric thresholds.',
    signature: 'useThresholdColor(value: number | (() => number), thresholds: ExtendedThresholdConfig, defaultColor?: string): () => string',
    params: [
      { name: 'value', type: 'number | (() => number)', required: true, description: 'Value or reactive getter' },
      { name: 'thresholds', type: 'ExtendedThresholdConfig', required: true, description: 'Threshold ranges by semantic or custom color keys' },
      { name: 'defaultColor', type: 'string', required: false, default: "'foreground'", description: 'Fallback color when no range matches' },
    ],
    returns: 'Signal that returns the resolved color string. Helper functions: getThresholdColor() and getThresholdColorName().',
    examples: [
      `const latencyColor = useThresholdColor(latency, {\n  success: [0, 100],\n  warning: [100, 500],\n  error: [500, Infinity],\n});\n\nText({ color: latencyColor() }, 'Latency: ' + latency() + 'ms')`,
      `// Custom ranges\nconst scoreColor = useThresholdColor(score, {\n  red: [0, 40],\n  yellow: [40, 70],\n  green: [70, 100],\n});`,
    ],
  },
];
