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
    description: 'Register keyboard shortcuts with human-readable syntax.',
    signature: 'useHotkeys(bindings: HotkeyBinding[], options?: HotkeyOptions): void',
    params: [
      { name: 'bindings', type: 'HotkeyBinding[]', required: true, description: 'Array of { key, handler, description? }' },
      { name: 'options.scope', type: 'string', required: false, description: 'Hotkey scope for context-specific shortcuts' },
    ],
    returns: 'void',
    examples: [
      `useHotkeys([\n  { key: 'ctrl+s', handler: save, description: 'Save file' },\n  { key: 'ctrl+q', handler: quit, description: 'Quit' },\n  { key: 'cmd+shift+p', handler: openPalette, description: 'Command palette' }\n]);`,
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
    name: 'useScroll',
    description: 'Hook for controlling Scroll component programmatically.',
    signature: 'useScroll(options?: UseScrollOptions): UseScrollReturn',
    params: [
      { name: 'options.height', type: 'number', required: false, description: 'Initial height hint' },
    ],
    returns: 'Object with scroll control methods and bind property for Scroll component',
    examples: [
      `const scroll = useScroll();\n\n// Control\nscroll.scrollToBottom();\nscroll.scrollToTop();\nscroll.scrollTo(10);\nscroll.scrollBy(5);\n\n// Read state\nconst pos = scroll.scrollTop();\nconst max = scroll.maxScroll();\n\n// Bind to component\nScroll({ ...scroll.bind, height: 20 },\n  ...content\n)`,
    ],
  },
  {
    name: 'useScrollList',
    description: 'Hook for controlling ScrollList/ChatList components programmatically.',
    signature: 'useScrollList(options?: UseScrollListOptions): UseScrollListReturn',
    params: [
      { name: 'options.inverted', type: 'boolean', required: false, default: 'false', description: 'Inverted scroll mode' },
    ],
    returns: 'Object with scroll control methods and bind property for ScrollList/ChatList',
    examples: [
      `const list = useScrollList({ inverted: true });\n\n// Control\nlist.scrollToBottom();\nlist.scrollToTop();\nlist.scrollTo(10);\nlist.scrollBy(5);\n\n// Auto-scroll when adding items\nconst addItem = (item) => {\n  items.push(item);\n  list.scrollToBottom();\n};\n\n// Bind to component\nScrollList({\n  ...list.bind,\n  items: items(),\n  children: (item) => Item({ item }),\n  height: 20,\n})`,
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
];
