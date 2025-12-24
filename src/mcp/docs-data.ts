/**
 * Tuiuiu Documentation Data
 *
 * Structured documentation for all components, hooks, and utilities.
 * This data is served via MCP to AI assistants.
 */

import type { ComponentDoc, HookDoc, ThemeDoc } from './types.js';

// =============================================================================
// Primitives
// =============================================================================

export const primitives: ComponentDoc[] = [
  {
    name: 'Box',
    category: 'primitives',
    description: 'Flexbox container for layout. The fundamental building block for all layouts.',
    props: [
      { name: 'flexDirection', type: "'row' | 'column'", required: false, default: "'row'", description: 'Main axis direction' },
      { name: 'justifyContent', type: "'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around'", required: false, default: "'flex-start'", description: 'Alignment along main axis' },
      { name: 'alignItems', type: "'flex-start' | 'center' | 'flex-end' | 'stretch'", required: false, default: "'stretch'", description: 'Alignment along cross axis' },
      { name: 'width', type: "number | string", required: false, description: 'Width in columns or percentage' },
      { name: 'height', type: "number | string", required: false, description: 'Height in rows or percentage' },
      { name: 'padding', type: "number", required: false, default: '0', description: 'Padding on all sides' },
      { name: 'paddingX', type: "number", required: false, description: 'Horizontal padding' },
      { name: 'paddingY', type: "number", required: false, description: 'Vertical padding' },
      { name: 'margin', type: "number", required: false, default: '0', description: 'Margin on all sides' },
      { name: 'gap', type: "number", required: false, description: 'Gap between children' },
      { name: 'flexGrow', type: "number", required: false, description: 'Flex grow factor' },
      { name: 'flexShrink', type: "number", required: false, description: 'Flex shrink factor' },
      { name: 'borderStyle', type: "'single' | 'double' | 'round' | 'bold' | 'none'", required: false, description: 'Border style' },
      { name: 'borderColor', type: "ColorValue", required: false, description: 'Border color' },
      { name: 'backgroundColor', type: "ColorValue", required: false, description: 'Background color' },
    ],
    examples: [
      `Box({ flexDirection: 'column', padding: 1 },\n  Text({}, 'Hello'),\n  Text({}, 'World')\n)`,
      `Box({ borderStyle: 'round', borderColor: 'cyan', padding: 2 },\n  Text({ bold: true }, 'Bordered Box')\n)`,
    ],
  },
  {
    name: 'Text',
    category: 'primitives',
    description: 'Text element with styling support. Renders styled text content.',
    props: [
      { name: 'color', type: "ColorValue", required: false, description: 'Text color (named, hex, or rgb)' },
      { name: 'backgroundColor', type: "ColorValue", required: false, description: 'Background color' },
      { name: 'bold', type: "boolean", required: false, default: 'false', description: 'Bold text' },
      { name: 'italic', type: "boolean", required: false, default: 'false', description: 'Italic text' },
      { name: 'underline', type: "boolean", required: false, default: 'false', description: 'Underlined text' },
      { name: 'strikethrough', type: "boolean", required: false, default: 'false', description: 'Strikethrough text' },
      { name: 'dim', type: "boolean", required: false, default: 'false', description: 'Dimmed text' },
      { name: 'inverse', type: "boolean", required: false, default: 'false', description: 'Inverted colors' },
    ],
    examples: [
      `Text({ color: 'cyan', bold: true }, 'Hello World')`,
      `Text({ color: '#ff6b6b', backgroundColor: 'black' }, 'Custom colors')`,
    ],
  },
  {
    name: 'Spacer',
    category: 'primitives',
    description: 'Flexible spacer that expands to fill available space.',
    props: [
      { name: 'x', type: "number", required: false, description: 'Fixed horizontal size' },
      { name: 'y', type: "number", required: false, description: 'Fixed vertical size' },
    ],
    examples: [
      `Box({ flexDirection: 'row' },\n  Text({}, 'Left'),\n  Spacer(),\n  Text({}, 'Right')\n)`,
    ],
  },
  {
    name: 'Divider',
    category: 'primitives',
    description: 'Horizontal or vertical divider line.',
    props: [
      { name: 'direction', type: "'horizontal' | 'vertical'", required: false, default: "'horizontal'", description: 'Divider direction' },
      { name: 'char', type: "string", required: false, default: "'─'", description: 'Character to use for the line' },
      { name: 'color', type: "ColorValue", required: false, description: 'Line color' },
    ],
    examples: [
      `Divider({ color: 'gray' })`,
      `Divider({ direction: 'vertical', char: '│' })`,
    ],
  },
  {
    name: 'Newline',
    category: 'primitives',
    description: 'Insert blank lines. Useful for vertical spacing without using Box.',
    props: [
      { name: 'count', type: "number", required: false, default: '1', description: 'Number of blank lines' },
    ],
    examples: [
      `Newline()`,
      `Newline({ count: 2 })`,
    ],
  },
  {
    name: 'Fragment',
    category: 'primitives',
    description: 'Group children without a wrapper element (like React Fragment).',
    props: [],
    examples: [
      `Fragment(\n  Text({}, 'Line 1'),\n  Text({}, 'Line 2')\n)`,
    ],
  },
  {
    name: 'When',
    category: 'primitives',
    description: 'Conditional rendering helper. Renders children only when condition is true.',
    props: [
      { name: 'condition', type: "boolean", required: true, description: 'Condition to evaluate' },
    ],
    examples: [
      `When(isLoading,\n  Spinner({ style: 'dots' })\n)`,
      `When(error !== null,\n  Text({ color: 'red' }, error)\n)`,
    ],
  },
  {
    name: 'Each',
    category: 'primitives',
    description: 'Map over items to render a list. Type-safe iteration helper.',
    props: [
      { name: 'items', type: "T[]", required: true, description: 'Array of items to iterate' },
      { name: 'render', type: "(item: T, index: number) => VNode", required: true, description: 'Render function for each item' },
    ],
    examples: [
      `Each(items, (item, i) =>\n  Text({ key: i }, item.name)\n)`,
      `Each(users, (user) =>\n  Box({ key: user.id },\n    Text({ bold: true }, user.name),\n    Text({ color: 'gray' }, user.email)\n  )\n)`,
    ],
  },
  {
    name: 'Static',
    category: 'primitives',
    description: 'Permanently render items above dynamic content. Items stay fixed and never re-render.',
    props: [
      { name: 'items', type: "T[]", required: true, description: 'Array of items to render' },
      { name: 'children', type: "(item: T, index: number) => VNode", required: true, description: 'Render function' },
      { name: 'style', type: "BoxStyle", required: false, description: 'Container styles' },
    ],
    examples: [
      `Static({\n  items: completedTasks,\n  children: (task, i) => Text({ key: i, color: 'green' }, \`✓ \${task.name}\`)\n})`,
    ],
  },
  {
    name: 'Slot',
    category: 'primitives',
    description: 'Reserved layout space for content that may appear/disappear. Prevents layout shifts.',
    props: [
      { name: 'visible', type: "boolean", required: true, description: 'Whether content is visible' },
      { name: 'height', type: "number", required: false, default: '0', description: 'Fixed height when hidden' },
      { name: 'minHeight', type: "number", required: false, description: 'Minimum height' },
      { name: 'flexGrow', type: "number", required: false, description: 'Flex grow factor' },
      { name: 'width', type: "number", required: false, description: 'Fixed width' },
    ],
    examples: [
      `// Reserve 5 lines even when no output\nSlot({ visible: hasOutput, height: 5 },\n  Text({}, output)\n)`,
      `// Conditionally show input without layout shift\nSlot({ visible: showInput, minHeight: 1 },\n  TextInput({ value: input, onChange: setInput })\n)`,
    ],
  },
  {
    name: 'Transform',
    category: 'primitives',
    description: 'Apply a transformation function to rendered text output. Useful for gradients, animations, custom styling.',
    props: [
      { name: 'transform', type: "(text: string, lineIndex: number) => string", required: true, description: 'Transform function' },
      { name: 'accessibilityLabel', type: "string", required: false, description: 'Screen reader label' },
    ],
    examples: [
      `Transform({\n  transform: (text) => text.toUpperCase()\n},\n  Text({}, 'hello world')\n)`,
    ],
  },
];

// =============================================================================
// Atoms
// =============================================================================

export const atoms: ComponentDoc[] = [
  {
    name: 'Button',
    category: 'atoms',
    description: 'Interactive button with multiple variants and states.',
    props: [
      { name: 'label', type: "string", required: true, description: 'Button label text' },
      { name: 'variant', type: "'primary' | 'secondary' | 'danger' | 'ghost'", required: false, default: "'primary'", description: 'Visual variant' },
      { name: 'disabled', type: "boolean", required: false, default: 'false', description: 'Disable interaction' },
      { name: 'focused', type: "boolean", required: false, default: 'false', description: 'Focus state' },
      { name: 'onPress', type: "() => void", required: false, description: 'Press handler' },
      { name: 'width', type: "number", required: false, description: 'Fixed width' },
    ],
    examples: [
      `Button({ label: 'Submit', variant: 'primary', onPress: () => console.log('clicked') })`,
      `Button({ label: 'Cancel', variant: 'ghost' })`,
    ],
  },
  {
    name: 'TextInput',
    category: 'atoms',
    description: 'Single-line text input field with cursor support.',
    props: [
      { name: 'value', type: "string", required: true, description: 'Current value' },
      { name: 'onChange', type: "(value: string) => void", required: true, description: 'Change handler' },
      { name: 'placeholder', type: "string", required: false, description: 'Placeholder text' },
      { name: 'focused', type: "boolean", required: false, default: 'false', description: 'Focus state' },
      { name: 'password', type: "boolean", required: false, default: 'false', description: 'Hide input as password' },
      { name: 'width', type: "number", required: false, default: '20', description: 'Input width' },
    ],
    examples: [
      `TextInput({ value: name(), onChange: setName, placeholder: 'Enter name' })`,
    ],
  },
  {
    name: 'Checkbox',
    category: 'atoms',
    description: 'Checkbox with label.',
    props: [
      { name: 'checked', type: "boolean", required: true, description: 'Checked state' },
      { name: 'onChange', type: "(checked: boolean) => void", required: false, description: 'Change handler' },
      { name: 'label', type: "string", required: false, description: 'Label text' },
      { name: 'disabled', type: "boolean", required: false, default: 'false', description: 'Disable interaction' },
    ],
    examples: [
      `Checkbox({ checked: agreed(), onChange: setAgreed, label: 'I agree to terms' })`,
    ],
  },
  {
    name: 'ProgressBar',
    category: 'atoms',
    description: 'Progress indicator with multiple styles.',
    props: [
      { name: 'value', type: "number", required: true, description: 'Progress value (0-100)' },
      { name: 'width', type: "number", required: false, default: '20', description: 'Bar width' },
      { name: 'showPercentage', type: "boolean", required: false, default: 'false', description: 'Show percentage text' },
      { name: 'color', type: "ColorValue", required: false, default: "'cyan'", description: 'Fill color' },
      { name: 'style', type: "'block' | 'ascii' | 'gradient'", required: false, default: "'block'", description: 'Visual style' },
    ],
    examples: [
      `ProgressBar({ value: 75, width: 30, showPercentage: true })`,
    ],
  },
  {
    name: 'Spinner',
    category: 'atoms',
    description: 'Animated loading spinner.',
    props: [
      { name: 'style', type: "'dots' | 'line' | 'circle' | 'bounce' | 'pong'", required: false, default: "'dots'", description: 'Animation style' },
      { name: 'color', type: "ColorValue", required: false, default: "'cyan'", description: 'Spinner color' },
      { name: 'label', type: "string", required: false, description: 'Loading label' },
    ],
    examples: [
      `Spinner({ style: 'dots', label: 'Loading...' })`,
    ],
  },
  {
    name: 'Badge',
    category: 'atoms',
    description: 'Status badge or label.',
    props: [
      { name: 'text', type: "string", required: true, description: 'Badge text' },
      { name: 'variant', type: "'default' | 'success' | 'warning' | 'error' | 'info'", required: false, default: "'default'", description: 'Color variant' },
    ],
    examples: [
      `Badge({ text: 'NEW', variant: 'success' })`,
    ],
  },
  {
    name: 'Timer',
    category: 'atoms',
    description: 'Display formatted time for countdowns or stopwatches. Use with createTimer() for state management.',
    props: [
      { name: 'time', type: "number", required: true, description: 'Time in milliseconds' },
      { name: 'format', type: "'ss' | 'mm:ss' | 'hh:mm:ss' | 'hh:mm:ss.ms' | 'human'", required: false, default: "'mm:ss'", description: 'Display format' },
      { name: 'color', type: "ColorValue", required: false, default: "'white'", description: 'Text color' },
      { name: 'running', type: "boolean", required: false, default: 'false', description: 'Timer is running' },
      { name: 'paused', type: "boolean", required: false, default: 'false', description: 'Timer is paused' },
      { name: 'runningIndicator', type: "string", required: false, default: "'●'", description: 'Running indicator icon' },
      { name: 'pausedIndicator', type: "string", required: false, default: "'❚❚'", description: 'Paused indicator icon' },
      { name: 'showIndicator', type: "boolean", required: false, default: 'true', description: 'Show status indicator' },
      { name: 'label', type: "string", required: false, description: 'Label prefix' },
      { name: 'bold', type: "boolean", required: false, default: 'true', description: 'Bold text' },
      { name: 'dimWhenPaused', type: "boolean", required: false, default: 'true', description: 'Dim when paused' },
    ],
    examples: [
      `// Stopwatch\nconst timer = createTimer({\n  mode: 'stopwatch',\n  onTick: (elapsed) => setTime(elapsed),\n});\ntimer.start();\n\nTimer({\n  time: time(),\n  format: 'mm:ss',\n  running: timer.isRunning(),\n  paused: timer.isPaused(),\n})`,
      `// Countdown\nconst countdown = createTimer({\n  mode: 'countdown',\n  initialTime: 60000, // 1 minute\n  onComplete: () => console.log('Time up!'),\n});\n\nTimer({\n  time: countdown.elapsed(),\n  format: 'mm:ss',\n  color: countdown.elapsed() < 10000 ? 'red' : 'green',\n})`,
    ],
  },
  {
    name: 'BigText',
    category: 'atoms',
    description: 'Large ASCII art text with multiple font styles and gradient support.',
    props: [
      { name: 'text', type: "string", required: true, description: 'Text to display' },
      { name: 'font', type: "'block' | 'slant' | 'small' | 'standard' | 'banner' | 'mini' | 'shadow' | 'doom' | 'graffiti'", required: false, default: "'block'", description: 'Font style' },
      { name: 'color', type: "ColorValue", required: false, default: "'white'", description: 'Text color' },
      { name: 'gradient', type: "ColorValue[]", required: false, description: 'Gradient colors (per character)' },
      { name: 'align', type: "'left' | 'center' | 'right'", required: false, default: "'left'", description: 'Alignment' },
      { name: 'maxWidth', type: "number", required: false, description: 'Max width for alignment' },
      { name: 'letterSpacing', type: "number", required: false, default: '1', description: 'Spacing between letters' },
    ],
    examples: [
      `BigText({ text: 'HELLO', font: 'block', color: 'cyan' })`,
      `// With gradient\nBigText({\n  text: 'RAINBOW',\n  font: 'banner',\n  gradient: ['red', 'yellow', 'green', 'cyan', 'blue', 'magenta'],\n})`,
      `// Logo with tagline\nLogo({\n  text: 'TUIUIU',\n  font: 'doom',\n  colors: ['cyan', 'blue'],\n  tagline: 'Terminal UI Library',\n})`,
    ],
  },
  {
    name: 'Canvas',
    category: 'atoms',
    description: '2D drawing canvas for terminal. Supports character, braille (2x4), and block (2x2) modes.',
    props: [
      { name: 'width', type: "number", required: true, description: 'Canvas width in characters' },
      { name: 'height', type: "number", required: true, description: 'Canvas height in characters' },
      { name: 'mode', type: "'character' | 'braille' | 'block'", required: false, default: "'character'", description: 'Drawing mode (braille has 8x resolution)' },
      { name: 'foreground', type: "ColorValue", required: false, description: 'Default foreground color' },
      { name: 'background', type: "ColorValue", required: false, description: 'Background color' },
      { name: 'fillChar', type: "string", required: false, default: "'█'", description: 'Fill character' },
    ],
    examples: [
      `const canvas = createCanvas({ width: 40, height: 20, mode: 'braille' });\n\n// Draw shapes\ncanvas.line(0, 0, 39, 19);\ncanvas.circle(20, 10, 8);\ncanvas.rect(5, 5, 10, 8, true);\ncanvas.text(15, 2, 'Hello');\n\n// Render to string\nconst output = canvas.render();`,
      `// High-resolution with braille mode (2x4 dots per character)\nconst canvas = createCanvas({ width: 40, height: 10, mode: 'braille' });\n// Resolution: 80x40 dots\ncanvas.circle(40, 20, 15);`,
    ],
  },
  {
    name: 'Switch',
    category: 'atoms',
    description: 'Toggle switch with on/off states. Supports labels, custom colors, and sizes.',
    props: [
      { name: 'initialValue', type: "boolean", required: false, default: 'false', description: 'Initial on/off state' },
      { name: 'onLabel', type: "string", required: false, default: "'ON'", description: 'Label when on' },
      { name: 'offLabel', type: "string", required: false, default: "'OFF'", description: 'Label when off' },
      { name: 'showLabels', type: "boolean", required: false, default: 'true', description: 'Show on/off labels' },
      { name: 'onColor', type: "ColorValue", required: false, default: "'green'", description: 'Color when on' },
      { name: 'offColor', type: "ColorValue", required: false, default: "'gray'", description: 'Color when off' },
      { name: 'size', type: "'small' | 'medium' | 'large'", required: false, default: "'medium'", description: 'Switch size' },
      { name: 'disabled', type: "boolean", required: false, default: 'false', description: 'Disable interaction' },
      { name: 'onChange', type: "(value: boolean) => void", required: false, description: 'Change handler' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
      { name: 'state', type: "SwitchState", required: false, description: 'External state from createSwitch()' },
    ],
    examples: [
      `Switch({ onChange: (on) => console.log(on) })`,
      `// With labels\nSwitch({\n  onLabel: 'Enabled',\n  offLabel: 'Disabled',\n  onColor: 'cyan'\n})`,
      `// Controlled\nconst sw = createSwitch({ initialValue: true });\nsw.toggle();\n\nSwitch({ state: sw })`,
    ],
  },
  {
    name: 'Slider',
    category: 'atoms',
    description: 'Range slider for numeric values. Shows value and optional min/max.',
    props: [
      { name: 'min', type: "number", required: false, default: '0', description: 'Minimum value' },
      { name: 'max', type: "number", required: false, default: '100', description: 'Maximum value' },
      { name: 'step', type: "number", required: false, default: '1', description: 'Step increment' },
      { name: 'initialValue', type: "number", required: false, description: 'Initial value (defaults to min)' },
      { name: 'width', type: "number", required: false, default: '20', description: 'Slider width' },
      { name: 'showValue', type: "boolean", required: false, default: 'true', description: 'Show current value' },
      { name: 'showMinMax', type: "boolean", required: false, default: 'false', description: 'Show min/max labels' },
      { name: 'formatValue', type: "(value: number) => string", required: false, description: 'Value formatter' },
      { name: 'color', type: "ColorValue", required: false, default: "'cyan'", description: 'Slider color' },
      { name: 'onChange', type: "(value: number) => void", required: false, description: 'Change handler' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
      { name: 'state', type: "SliderState", required: false, description: 'External state from createSlider()' },
    ],
    examples: [
      `Slider({ min: 0, max: 100, onChange: setVolume })`,
      `// With formatting\nSlider({\n  min: 0,\n  max: 1,\n  step: 0.1,\n  formatValue: (v) => \`\${Math.round(v * 100)}%\`,\n})`,
      `// Range slider\nRangeSlider({\n  min: 0,\n  max: 1000,\n  initialRange: [200, 800],\n  onChange: ([min, max]) => console.log(min, max),\n})`,
    ],
  },
];

// =============================================================================
// Molecules
// =============================================================================

export const molecules: ComponentDoc[] = [
  {
    name: 'Collapsible',
    category: 'molecules',
    description: 'Expandable/collapsible section with keyboard support. Space/Enter toggles, arrows expand/collapse.',
    props: [
      { name: 'title', type: "string", required: true, description: 'Section title' },
      { name: 'children', type: "VNode | VNode[]", required: true, description: 'Content when expanded' },
      { name: 'initialExpanded', type: "boolean", required: false, default: 'false', description: 'Initial expanded state' },
      { name: 'collapsedIcon', type: "string", required: false, description: 'Icon when collapsed' },
      { name: 'expandedIcon', type: "string", required: false, description: 'Icon when expanded' },
      { name: 'titleColor', type: "ColorValue", required: false, default: "'white'", description: 'Title color' },
      { name: 'indent', type: "number", required: false, default: '2', description: 'Content indentation' },
      { name: 'disabled', type: "boolean", required: false, default: 'false', description: 'Disable interaction' },
      { name: 'onToggle', type: "(expanded: boolean) => void", required: false, description: 'Toggle callback' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard handling' },
      { name: 'state', type: "CollapsibleState", required: false, description: 'External state from createCollapsible()' },
    ],
    examples: [
      `Collapsible({\n  title: 'Advanced Options',\n  children: Box({}, Text({}, 'Hidden content'))\n})`,
      `// With custom icons\nCollapsible({\n  title: 'Details',\n  collapsedIcon: '📁',\n  expandedIcon: '📂',\n  children: detailsContent\n})`,
      `// With external control\nconst state = createCollapsible({ initialExpanded: true });\nstate.toggle(); // programmatic control\n\nCollapsible({ state, title: 'Controlled', children: content })`,
    ],
  },
  {
    name: 'Accordion',
    category: 'molecules',
    description: 'Multiple collapsible sections with keyboard navigation. Supports single or multiple open sections.',
    props: [
      { name: 'sections', type: "AccordionSection[]", required: true, description: 'Array of { key, title, content, icon?, disabled? }' },
      { name: 'initialExpanded', type: "string", required: false, description: 'Initially expanded section key' },
      { name: 'multiple', type: "boolean", required: false, default: 'false', description: 'Allow multiple sections open' },
      { name: 'gap', type: "number", required: false, default: '0', description: 'Gap between sections' },
      { name: 'titleColor', type: "ColorValue", required: false, default: "'white'", description: 'Section title color' },
      { name: 'activeColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Focused section color' },
      { name: 'onChange', type: "(expanded: string[]) => void", required: false, description: 'Change callback with expanded keys' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard handling' },
      { name: 'state', type: "AccordionState", required: false, description: 'External state from createAccordion()' },
    ],
    examples: [
      `Accordion({\n  sections: [\n    { key: 'general', title: 'General', content: GeneralContent() },\n    { key: 'advanced', title: 'Advanced', content: AdvancedContent() },\n  ],\n})`,
      `// With multiple open + hotkeys\nconst accordion = createAccordion({ sections, multiple: true });\n\nuseHotkeys('1', () => accordion.toggle('section-1'));\nuseHotkeys('2', () => accordion.toggle('section-2'));\nuseHotkeys('ctrl+e', () => accordion.expandAll());\n\nAccordion({ state: accordion, sections })`,
    ],
  },
  {
    name: 'Details',
    category: 'molecules',
    description: 'Simple expandable section like HTML <details> element.',
    props: [
      { name: 'summary', type: "string", required: true, description: 'Summary text (always visible)' },
      { name: 'children', type: "VNode | VNode[]", required: true, description: 'Content when expanded' },
      { name: 'open', type: "boolean", required: false, default: 'false', description: 'Initial open state' },
      { name: 'icon', type: "string", required: false, description: 'Custom icon' },
    ],
    examples: [
      `Details({\n  summary: 'Click to see more',\n  children: Text({}, 'Hidden details here')\n})`,
    ],
  },
  {
    name: 'ExpandableText',
    category: 'molecules',
    description: 'Long text with show more/less toggle. Truncates to maxLines when collapsed.',
    props: [
      { name: 'text', type: "string", required: true, description: 'Full text content' },
      { name: 'maxLines', type: "number", required: false, default: '3', description: 'Max visible lines when collapsed' },
      { name: 'showMoreLabel', type: "string", required: false, default: "'Show more'", description: 'Expand label' },
      { name: 'showLessLabel', type: "string", required: false, default: "'Show less'", description: 'Collapse label' },
      { name: 'color', type: "ColorValue", required: false, default: "'white'", description: 'Text color' },
    ],
    examples: [
      `ExpandableText({\n  text: veryLongText,\n  maxLines: 5,\n  showMoreLabel: 'Read more...',\n})`,
    ],
  },
  {
    name: 'Select',
    category: 'molecules',
    description: 'Dropdown selection with keyboard navigation.',
    props: [
      { name: 'options', type: "SelectOption[]", required: true, description: 'Array of { value, label } options' },
      { name: 'value', type: "string", required: true, description: 'Selected value' },
      { name: 'onChange', type: "(value: string) => void", required: true, description: 'Change handler' },
      { name: 'placeholder', type: "string", required: false, description: 'Placeholder text' },
      { name: 'focused', type: "boolean", required: false, default: 'false', description: 'Focus state' },
    ],
    examples: [
      `Select({\n  options: [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }],\n  value: selected(),\n  onChange: setSelected\n})`,
    ],
  },
  {
    name: 'RadioGroup',
    category: 'molecules',
    description: 'Single selection radio buttons with keyboard navigation.',
    props: [
      { name: 'options', type: "RadioOption[]", required: true, description: 'Array of { value, label, description?, disabled? }' },
      { name: 'initialValue', type: "T", required: false, description: 'Initially selected value' },
      { name: 'direction', type: "'horizontal' | 'vertical'", required: false, default: "'vertical'", description: 'Layout direction' },
      { name: 'gap', type: "number", required: false, description: 'Gap between options' },
      { name: 'activeColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Focused option color' },
      { name: 'selectedColor', type: "ColorValue", required: false, default: "'green'", description: 'Selected option color' },
      { name: 'onChange', type: "(value: T) => void", required: false, description: 'Selection change handler' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
      { name: 'state', type: "RadioGroupState", required: false, description: 'External state from createRadioGroup()' },
    ],
    examples: [
      `RadioGroup({\n  options: [\n    { value: 'small', label: 'Small' },\n    { value: 'medium', label: 'Medium' },\n    { value: 'large', label: 'Large' },\n  ],\n  initialValue: 'medium',\n  onChange: (size) => console.log(size),\n})`,
      `// Horizontal layout\nRadioGroup({\n  options: themes,\n  direction: 'horizontal',\n  gap: 4,\n})`,
    ],
  },
  {
    name: 'Autocomplete',
    category: 'molecules',
    description: 'Text input with fuzzy search suggestions. Supports custom filtering and free text.',
    props: [
      { name: 'items', type: "AutocompleteItem[]", required: true, description: 'Array of { value, label, description?, disabled? }' },
      { name: 'placeholder', type: "string", required: false, description: 'Input placeholder' },
      { name: 'maxSuggestions', type: "number", required: false, default: '5', description: 'Max suggestions shown' },
      { name: 'minChars', type: "number", required: false, default: '1', description: 'Min chars to trigger suggestions' },
      { name: 'filter', type: "(query: string, item: AutocompleteItem) => boolean", required: false, description: 'Custom filter function' },
      { name: 'allowFreeText', type: "boolean", required: false, default: 'false', description: 'Allow non-matching input' },
      { name: 'width', type: "number", required: false, default: '30', description: 'Input width' },
      { name: 'activeColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Active suggestion color' },
      { name: 'onChange', type: "(value: string) => void", required: false, description: 'Value change handler' },
      { name: 'onSelect', type: "(item: AutocompleteItem) => void", required: false, description: 'Item selection handler' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
      { name: 'state', type: "AutocompleteState", required: false, description: 'External state from createAutocomplete()' },
    ],
    examples: [
      `Autocomplete({\n  items: countries,\n  placeholder: 'Search country...',\n  onSelect: (country) => setCountry(country.value),\n})`,
      `// With free text\nAutocomplete({\n  items: suggestions,\n  allowFreeText: true,\n  onChange: (text) => setQuery(text),\n})`,
    ],
  },
  {
    name: 'MultiSelect',
    category: 'molecules',
    description: 'Multi-selection with checkboxes, fuzzy search, and tags display.',
    props: [
      { name: 'items', type: "MultiSelectItem[]", required: true, description: 'Array of { value, label, description?, disabled?, group? }' },
      { name: 'initialValue', type: "T[]", required: false, default: '[]', description: 'Initially selected values' },
      { name: 'maxVisible', type: "number", required: false, default: '10', description: 'Max visible items' },
      { name: 'searchable', type: "boolean", required: false, default: 'true', description: 'Enable fuzzy search' },
      { name: 'searchPlaceholder', type: "string", required: false, description: 'Search placeholder text' },
      { name: 'showCount', type: "boolean", required: false, default: 'true', description: 'Show selected count' },
      { name: 'showTags', type: "boolean", required: false, default: 'false', description: 'Show tags for selected items' },
      { name: 'maxTags', type: "number", required: false, default: '3', description: 'Max tags before +N more' },
      { name: 'minSelections', type: "number", required: false, default: '0', description: 'Min required selections' },
      { name: 'maxSelections', type: "number", required: false, description: 'Max allowed selections' },
      { name: 'activeColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Focused item color' },
      { name: 'selectedColor', type: "ColorValue", required: false, default: "'green'", description: 'Selected item color' },
      { name: 'onChange', type: "(values: T[]) => void", required: false, description: 'Selection change handler' },
      { name: 'onSubmit', type: "(values: T[]) => void", required: false, description: 'Submit handler (Enter)' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
      { name: 'state', type: "MultiSelectState", required: false, description: 'External state from createMultiSelect()' },
    ],
    examples: [
      `MultiSelect({\n  items: [\n    { value: 'react', label: 'React' },\n    { value: 'vue', label: 'Vue' },\n    { value: 'angular', label: 'Angular' },\n  ],\n  showTags: true,\n  onChange: (frameworks) => setSelected(frameworks),\n})`,
      `// With limits\nMultiSelect({\n  items: features,\n  minSelections: 1,\n  maxSelections: 3,\n  searchable: true,\n})`,
    ],
  },
  {
    name: 'Table',
    category: 'molecules',
    description: 'Data table with headers and rows.',
    props: [
      { name: 'columns', type: "TableColumn[]", required: true, description: 'Column definitions { key, header, width }' },
      { name: 'data', type: "Record<string, unknown>[]", required: true, description: 'Row data' },
      { name: 'borderStyle', type: "BorderStyle", required: false, default: "'single'", description: 'Table border style' },
    ],
    examples: [
      `Table({\n  columns: [\n    { key: 'name', header: 'Name', width: 20 },\n    { key: 'age', header: 'Age', width: 5 }\n  ],\n  data: [{ name: 'Alice', age: 30 }]\n})`,
    ],
  },
  {
    name: 'Tabs',
    category: 'molecules',
    description: 'Tabbed navigation container.',
    props: [
      { name: 'tabs', type: "Tab[]", required: true, description: 'Array of { id, label, content } tabs' },
      { name: 'activeTab', type: "string", required: true, description: 'Active tab id' },
      { name: 'onChange', type: "(id: string) => void", required: true, description: 'Tab change handler' },
    ],
    examples: [
      `Tabs({\n  tabs: [\n    { id: 'home', label: 'Home', content: HomePanel },\n    { id: 'settings', label: 'Settings', content: SettingsPanel }\n  ],\n  activeTab: tab(),\n  onChange: setTab\n})`,
    ],
  },
  {
    name: 'Modal',
    category: 'molecules',
    description: 'Modal dialog overlay.',
    props: [
      { name: 'title', type: "string", required: false, description: 'Modal title' },
      { name: 'visible', type: "boolean", required: true, description: 'Visibility state' },
      { name: 'onClose', type: "() => void", required: false, description: 'Close handler' },
      { name: 'width', type: "number", required: false, default: '50', description: 'Modal width' },
      { name: 'children', type: "VNode", required: true, description: 'Modal content' },
    ],
    examples: [
      `Modal({\n  title: 'Confirm',\n  visible: showModal(),\n  onClose: () => setShowModal(false)\n}, Text({}, 'Are you sure?'))`,
    ],
  },
  {
    name: 'Tree',
    category: 'molecules',
    description: 'Hierarchical tree view with keyboard navigation, expansion, and selection.',
    props: [
      { name: 'nodes', type: "TreeNode[]", required: true, description: 'Array of { id, label, icon?, children?, data?, disabled?, color? }' },
      { name: 'initialExpanded', type: "string[]", required: false, default: '[]', description: 'Initially expanded node IDs' },
      { name: 'initialSelected', type: "string[]", required: false, default: '[]', description: 'Initially selected node IDs' },
      { name: 'selectionMode', type: "'none' | 'single' | 'multiple'", required: false, default: "'single'", description: 'Selection mode' },
      { name: 'showGuides', type: "boolean", required: false, default: 'true', description: 'Show tree lines/guides' },
      { name: 'indentSize', type: "number", required: false, default: '2', description: 'Indentation size' },
      { name: 'maxDepth', type: "number", required: false, description: 'Max visible depth' },
      { name: 'activeColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Cursor color' },
      { name: 'selectedColor', type: "ColorValue", required: false, default: "'green'", description: 'Selected node color' },
      { name: 'guideColor', type: "ColorValue", required: false, default: "'gray'", description: 'Guide lines color' },
      { name: 'label', type: "string", required: false, description: 'Tree title' },
      { name: 'onSelect', type: "(node: TreeNode) => void", required: false, description: 'Selection callback' },
      { name: 'onExpand', type: "(node: TreeNode) => void", required: false, description: 'Expand callback' },
      { name: 'onCollapse', type: "(node: TreeNode) => void", required: false, description: 'Collapse callback' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
      { name: 'state', type: "TreeState", required: false, description: 'External state from createTree()' },
    ],
    examples: [
      `Tree({\n  nodes: [\n    {\n      id: 'src',\n      label: 'src',\n      icon: '📁',\n      children: [\n        { id: 'index.ts', label: 'index.ts', icon: '📄' },\n        { id: 'utils.ts', label: 'utils.ts', icon: '📄' },\n      ],\n    },\n  ],\n  showGuides: true,\n  onSelect: (node) => openFile(node.id),\n})`,
      `// With programmatic control\nconst tree = createTree({ nodes, selectionMode: 'multiple' });\ntree.expandAll();\ntree.select('my-node-id');\n\nTree({ state: tree, nodes })`,
    ],
  },
  {
    name: 'Tooltip',
    category: 'atoms',
    description: 'Tooltip with arrow pointing to content. Supports positioning on all sides.',
    props: [
      { name: 'content', type: "string | VNode", required: true, description: 'Tooltip content' },
      { name: 'position', type: "'top' | 'bottom' | 'left' | 'right'", required: false, default: "'top'", description: 'Position relative to target' },
      { name: 'arrow', type: "boolean", required: false, default: 'true', description: 'Show arrow' },
      { name: 'borderStyle', type: "BorderStyle", required: false, default: "'single'", description: 'Border style' },
      { name: 'borderColor', type: "ColorValue", required: false, default: "'gray'", description: 'Border color' },
      { name: 'backgroundColor', type: "ColorValue", required: false, description: 'Background color' },
      { name: 'visible', type: "boolean", required: false, default: 'true', description: 'Visibility state' },
    ],
    examples: [
      `Tooltip({\n  content: 'Press Enter to confirm',\n  position: 'bottom',\n})`,
      `// With rich content\nTooltip({\n  content: VStack({},\n    Text({ bold: true }, 'Keyboard Shortcuts'),\n    Text({}, 'Ctrl+S: Save'),\n    Text({}, 'Ctrl+Q: Quit'),\n  ),\n  position: 'right',\n})`,
    ],
  },
  {
    name: 'Calendar',
    category: 'molecules',
    description: 'Interactive month calendar with date selection, events, and keyboard navigation.',
    props: [
      { name: 'initialDate', type: "Date", required: false, description: 'Initial date (defaults to today)' },
      { name: 'selectedDates', type: "Date[]", required: false, default: '[]', description: 'Initially selected dates' },
      { name: 'events', type: "CalendarEvent[]", required: false, description: 'Events to mark { date: "YYYY-MM-DD", label?, color? }' },
      { name: 'selectionMode', type: "'none' | 'single' | 'range' | 'multiple'", required: false, default: "'single'", description: 'Selection mode' },
      { name: 'firstDayOfWeek', type: "0 | 1", required: false, default: '0', description: '0=Sunday, 1=Monday' },
      { name: 'minDate', type: "Date", required: false, description: 'Minimum selectable date' },
      { name: 'maxDate', type: "Date", required: false, description: 'Maximum selectable date' },
      { name: 'disabledDates', type: "Date[]", required: false, description: 'Disabled dates' },
      { name: 'showWeekNumbers', type: "boolean", required: false, default: 'false', description: 'Show week numbers' },
      { name: 'todayColor', type: "ColorValue", required: false, default: "'green'", description: 'Today highlight color' },
      { name: 'selectedColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Selected date color' },
      { name: 'cellWidth', type: "number", required: false, default: '4', description: 'Day cell width' },
      { name: 'onDateSelect', type: "(date: Date) => void", required: false, description: 'Selection callback' },
      { name: 'onMonthChange', type: "(year: number, month: number) => void", required: false, description: 'Month change callback' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
      { name: 'state', type: "CalendarState", required: false, description: 'External state from createCalendar()' },
    ],
    examples: [
      `Calendar({\n  onDateSelect: (date) => console.log(date),\n})`,
      `// With events and range selection\nCalendar({\n  events: [\n    { date: '2024-03-15', label: 'Meeting', color: 'blue' },\n    { date: '2024-03-20', label: 'Deadline', color: 'red' },\n  ],\n  selectionMode: 'range',\n  showWeekNumbers: true,\n})`,
    ],
  },
  {
    name: 'DatePicker',
    category: 'molecules',
    description: 'Calendar dropdown with input field for date selection.',
    props: [
      { name: 'placeholder', type: "string", required: false, default: "'Select date...'", description: 'Input placeholder' },
      { name: 'inputWidth', type: "number", required: false, default: '20', description: 'Input field width' },
      { name: 'format', type: "string", required: false, default: "'YYYY-MM-DD'", description: 'Date display format' },
      { name: 'selectionMode', type: "'single' | 'range'", required: false, default: "'single'", description: 'Selection mode' },
      { name: 'minDate', type: "Date", required: false, description: 'Minimum date' },
      { name: 'maxDate', type: "Date", required: false, description: 'Maximum date' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
    ],
    examples: [
      `DatePicker({\n  placeholder: 'Pick a date',\n  onDateSelect: (date) => setSelectedDate(date),\n})`,
    ],
  },
];

// =============================================================================
// Data Visualization
// =============================================================================

export const dataViz: ComponentDoc[] = [
  {
    name: 'Sparkline',
    category: 'molecules',
    description: 'Inline mini chart for data trends.',
    props: [
      { name: 'data', type: "number[]", required: true, description: 'Data points' },
      { name: 'width', type: "number", required: false, description: 'Chart width' },
      { name: 'height', type: "number", required: false, default: '1', description: 'Chart height in rows' },
      { name: 'color', type: "ColorValue", required: false, description: 'Line color' },
    ],
    examples: [
      `Sparkline({ data: [1, 5, 3, 9, 2, 7], width: 20 })`,
    ],
  },
  {
    name: 'BarChart',
    category: 'molecules',
    description: 'Horizontal or vertical bar chart.',
    props: [
      { name: 'data', type: "BarData[]", required: true, description: 'Array of { label, value, color? }' },
      { name: 'orientation', type: "'horizontal' | 'vertical'", required: false, default: "'horizontal'", description: 'Bar orientation' },
      { name: 'width', type: "number", required: false, description: 'Chart width' },
      { name: 'showValues', type: "boolean", required: false, default: 'true', description: 'Show value labels' },
    ],
    examples: [
      `BarChart({\n  data: [\n    { label: 'A', value: 30 },\n    { label: 'B', value: 50 },\n    { label: 'C', value: 20 }\n  ]\n})`,
    ],
  },
  {
    name: 'Gauge',
    category: 'molecules',
    description: 'Gauge/meter display for single values.',
    props: [
      { name: 'value', type: "number", required: true, description: 'Current value' },
      { name: 'max', type: "number", required: false, default: '100', description: 'Maximum value' },
      { name: 'width', type: "number", required: false, description: 'Gauge width' },
      { name: 'showValue', type: "boolean", required: false, default: 'true', description: 'Show numeric value' },
      { name: 'zones', type: "GaugeZone[]", required: false, description: 'Color zones { min, max, color }' },
    ],
    examples: [
      `Gauge({ value: 75, max: 100, width: 30 })`,
    ],
  },
  {
    name: 'Heatmap',
    category: 'molecules',
    description: 'Grid-based heatmap visualization.',
    props: [
      { name: 'data', type: "HeatmapCell[][]", required: true, description: '2D array of { value, label? }' },
      { name: 'colorScale', type: "ColorScale", required: false, default: "'blues'", description: 'Color scale name' },
      { name: 'showValues', type: "boolean", required: false, default: 'false', description: 'Show cell values' },
    ],
    examples: [
      `Heatmap({\n  data: [[{ value: 1 }, { value: 5 }], [{ value: 3 }, { value: 8 }]],\n  colorScale: 'greens'\n})`,
    ],
  },
];

// =============================================================================
// Organisms
// =============================================================================

export const organisms: ComponentDoc[] = [
  {
    name: 'CommandPalette',
    category: 'organisms',
    description: 'Command palette with fuzzy search (like VS Code Ctrl+Shift+P).',
    props: [
      { name: 'commands', type: "Command[]", required: true, description: 'Available commands { id, label, shortcut?, action }' },
      { name: 'visible', type: "boolean", required: true, description: 'Visibility state' },
      { name: 'onClose', type: "() => void", required: true, description: 'Close handler' },
      { name: 'onSelect', type: "(command: Command) => void", required: true, description: 'Command selection handler' },
    ],
    examples: [
      `CommandPalette({\n  commands: [\n    { id: 'save', label: 'Save File', shortcut: 'Ctrl+S', action: save },\n    { id: 'quit', label: 'Quit', shortcut: 'Ctrl+Q', action: quit }\n  ],\n  visible: paletteOpen(),\n  onClose: () => setPaletteOpen(false),\n  onSelect: (cmd) => cmd.action()\n})`,
    ],
  },
  {
    name: 'FileManager',
    category: 'organisms',
    description: 'File browser with tree navigation.',
    props: [
      { name: 'root', type: "string", required: true, description: 'Root directory path' },
      { name: 'onSelect', type: "(path: string) => void", required: false, description: 'File selection handler' },
      { name: 'showHidden', type: "boolean", required: false, default: 'false', description: 'Show hidden files' },
    ],
    examples: [
      `FileManager({ root: '/home/user', onSelect: (path) => openFile(path) })`,
    ],
  },
  {
    name: 'DataTable',
    category: 'organisms',
    description: 'Advanced data table with sorting, filtering, and pagination.',
    props: [
      { name: 'columns', type: "DataTableColumn[]", required: true, description: 'Column definitions with sorting/filtering options' },
      { name: 'data', type: "Record<string, unknown>[]", required: true, description: 'Row data' },
      { name: 'pageSize', type: "number", required: false, default: '10', description: 'Rows per page' },
      { name: 'sortable', type: "boolean", required: false, default: 'true', description: 'Enable column sorting' },
      { name: 'filterable', type: "boolean", required: false, default: 'false', description: 'Enable column filtering' },
    ],
    examples: [
      `DataTable({\n  columns: [\n    { key: 'name', header: 'Name', sortable: true },\n    { key: 'email', header: 'Email', width: 30 }\n  ],\n  data: users,\n  pageSize: 20\n})`,
    ],
  },
];

// =============================================================================
// Layout Components
// =============================================================================

export const layouts: ComponentDoc[] = [
  {
    name: 'VStack',
    category: 'primitives',
    description: 'Vertical stack layout (shorthand for Box with column direction).',
    props: [
      { name: 'gap', type: "number", required: false, default: '0', description: 'Gap between children' },
      { name: 'align', type: "'start' | 'center' | 'end' | 'stretch'", required: false, default: "'stretch'", description: 'Cross-axis alignment' },
    ],
    examples: [
      `VStack({ gap: 1 },\n  Text({}, 'Line 1'),\n  Text({}, 'Line 2'),\n  Text({}, 'Line 3')\n)`,
    ],
  },
  {
    name: 'HStack',
    category: 'primitives',
    description: 'Horizontal stack layout (shorthand for Box with row direction).',
    props: [
      { name: 'gap', type: "number", required: false, default: '0', description: 'Gap between children' },
      { name: 'align', type: "'start' | 'center' | 'end' | 'stretch'", required: false, default: "'center'", description: 'Cross-axis alignment' },
    ],
    examples: [
      `HStack({ gap: 2 },\n  Button({ label: 'OK' }),\n  Button({ label: 'Cancel' })\n)`,
    ],
  },
  {
    name: 'Center',
    category: 'primitives',
    description: 'Centers content both horizontally and vertically.',
    props: [],
    examples: [
      `Center({},\n  Text({ bold: true }, 'Centered Content')\n)`,
    ],
  },
  {
    name: 'SplitPanel',
    category: 'molecules',
    description: 'Resizable split panel layout.',
    props: [
      { name: 'direction', type: "'horizontal' | 'vertical'", required: false, default: "'horizontal'", description: 'Split direction' },
      { name: 'initialSize', type: "number", required: false, default: '50', description: 'Initial size percentage' },
      { name: 'minSize', type: "number", required: false, default: '10', description: 'Minimum size percentage' },
      { name: 'left', type: "VNode", required: true, description: 'Left/top panel content' },
      { name: 'right', type: "VNode", required: true, description: 'Right/bottom panel content' },
    ],
    examples: [
      `SplitPanel({\n  direction: 'horizontal',\n  initialSize: 30,\n  left: Sidebar(),\n  right: MainContent()\n})`,
    ],
  },
  {
    name: 'Scroll',
    category: 'primitives',
    description: 'Universal scroll wrapper for any content. Wraps any VNode content and adds scrolling when it exceeds the specified height.',
    props: [
      { name: 'height', type: "number", required: true, description: 'Visible height in lines' },
      { name: 'width', type: "number", required: false, default: '80', description: 'Width for content layout' },
      { name: 'showScrollbar', type: "boolean", required: false, default: 'true', description: 'Show/hide scrollbar' },
      { name: 'keysEnabled', type: "boolean", required: false, default: 'true', description: 'Enable keyboard navigation' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Is component focused' },
      { name: 'scrollbarColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Scrollbar thumb color' },
      { name: 'trackColor', type: "ColorValue", required: false, default: "'gray'", description: 'Scrollbar track color' },
      { name: 'scrollStep', type: "number", required: false, default: '1', description: 'Lines per scroll step' },
      { name: 'state', type: "ScrollState", required: false, description: 'External state for control via useScroll()' },
    ],
    examples: [
      `// Simple content scroll\nScroll({ height: 10 },\n  Text({}, longText),\n)`,
      `// Complex layouts\nScroll({ height: 20, width: 60 },\n  Box({ flexDirection: 'column' },\n    Header(),\n    Content(),\n    Footer(),\n  ),\n)`,
      `// With control hook\nconst scroll = useScroll();\nscroll.scrollToBottom();\n\nScroll({ ...scroll.bind, height: 20 },\n  ...content\n)`,
    ],
  },
  {
    name: 'ScrollList',
    category: 'organisms',
    description: 'Scroll list for rendering arrays of items with automatic height estimation and caching.',
    props: [
      { name: 'items', type: "T[] | (() => T[])", required: true, description: 'Items to display (array or accessor)' },
      { name: 'children', type: "(item: T, index: number) => VNode", required: true, description: 'Render function for each item' },
      { name: 'height', type: "number", required: true, description: 'Visible height in lines' },
      { name: 'width', type: "number", required: false, default: '80', description: 'Width for layout' },
      { name: 'itemHeight', type: "number | ((item: T) => number)", required: false, description: 'Item height (auto-estimated if omitted)' },
      { name: 'inverted', type: "boolean", required: false, default: 'false', description: 'Inverted mode (newest at bottom)' },
      { name: 'showScrollbar', type: "boolean", required: false, default: 'true', description: 'Show/hide scrollbar' },
      { name: 'keysEnabled', type: "boolean", required: false, default: 'true', description: 'Enable keyboard navigation' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Is component focused' },
      { name: 'state', type: "ScrollListState", required: false, description: 'External state for control via useScrollList()' },
    ],
    examples: [
      `// Simple list with auto-height\nScrollList({\n  items: files(),\n  children: (file) => FileRow({ file }),\n  height: 20,\n})`,
      `// With fixed item height (more performant)\nScrollList({\n  items: logs(),\n  children: (log) => Text({}, log),\n  height: 20,\n  itemHeight: 1,\n})`,
      `// With control hook\nconst list = useScrollList({ inverted: true });\nlist.scrollToBottom();\n\nScrollList({\n  ...list.bind,\n  items: messages(),\n  children: (msg) => Message({ msg }),\n  height: 20,\n})`,
    ],
  },
  {
    name: 'ChatList',
    category: 'organisms',
    description: 'Pre-configured ScrollList for chat/messaging UIs with inverted scroll (newest at bottom).',
    props: [
      { name: 'items', type: "T[] | (() => T[])", required: true, description: 'Chat messages to display' },
      { name: 'children', type: "(item: T, index: number) => VNode", required: true, description: 'Render function for each message' },
      { name: 'height', type: "number", required: true, description: 'Visible height in lines' },
      { name: 'width', type: "number", required: false, default: '80', description: 'Width for layout' },
      { name: 'itemHeight', type: "number | ((item: T) => number)", required: false, description: 'Item height (auto-estimated if omitted)' },
      { name: 'showScrollbar', type: "boolean", required: false, default: 'true', description: 'Show/hide scrollbar' },
      { name: 'state', type: "ScrollListState", required: false, description: 'External state for control' },
    ],
    examples: [
      `// Simple chat UI\nChatList({\n  items: messages(),\n  children: (msg) => ChatBubble({ message: msg }),\n  height: 20,\n})`,
      `// With control for auto-scroll\nconst chatList = useScrollList({ inverted: true });\n\n// Scroll to bottom when sending\nconst sendMessage = (text) => {\n  addMessage(text);\n  chatList.scrollToBottom();\n};\n\nChatList({\n  ...chatList.bind,\n  items: messages(),\n  children: (msg) => ChatBubble({ message: msg }),\n  height: 20,\n})`,
    ],
  },
  {
    name: 'Grid',
    category: 'molecules',
    description: 'CSS Grid-like layout for terminal.',
    props: [
      { name: 'columns', type: "number | string", required: true, description: 'Number of columns or template' },
      { name: 'rows', type: "number | string", required: false, description: 'Number of rows or template' },
      { name: 'gap', type: "number", required: false, default: '0', description: 'Gap between cells' },
    ],
    examples: [
      `Grid({ columns: 3, gap: 1 },\n  ...cards.map(card => Card(card))\n)`,
    ],
  },
  {
    name: 'Page',
    category: 'templates',
    description: 'Single page layout with title, content, and footer. Supports borders and full-screen mode.',
    props: [
      { name: 'title', type: "string", required: false, description: 'Page title at top' },
      { name: 'titleColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Title color' },
      { name: 'subtitle', type: "string", required: false, description: 'Subtitle/description' },
      { name: 'border', type: "boolean", required: false, default: 'false', description: 'Show border around page' },
      { name: 'borderStyle', type: "'single' | 'double' | 'round' | 'bold'", required: false, default: "'single'", description: 'Border style' },
      { name: 'borderColor', type: "ColorValue", required: false, default: "'gray'", description: 'Border color' },
      { name: 'header', type: "VNode", required: false, description: 'Custom header (overrides title)' },
      { name: 'footer', type: "VNode", required: false, description: 'Footer content' },
      { name: 'divider', type: "boolean", required: false, default: 'true', description: 'Show dividers' },
      { name: 'padding', type: "number", required: false, default: '1', description: 'Internal padding' },
      { name: 'fullScreen', type: "boolean", required: false, default: 'false', description: 'Fill terminal' },
      { name: 'width', type: "number", required: false, description: 'Page width' },
      { name: 'height', type: "number", required: false, description: 'Page height' },
      { name: 'children', type: "VNode", required: true, description: 'Main content' },
    ],
    examples: [
      `Page({\n  title: 'Settings',\n  subtitle: 'Configure preferences',\n  children: SettingsForm()\n})`,
      `// Full screen with border\nPage({\n  title: 'Dashboard',\n  fullScreen: true,\n  border: true,\n  borderStyle: 'round',\n  children: DashboardContent()\n})`,
    ],
  },
  {
    name: 'AppShell',
    category: 'templates',
    description: 'Complete app layout with header, sidebar, content, aside, and footer. IDE-style structure.',
    props: [
      { name: 'header', type: "VNode", required: false, description: 'Top header bar' },
      { name: 'headerHeight', type: "number", required: false, description: 'Header height' },
      { name: 'sidebar', type: "VNode", required: false, description: 'Left sidebar' },
      { name: 'sidebarWidth', type: "number", required: false, default: '25', description: 'Sidebar width' },
      { name: 'aside', type: "VNode", required: false, description: 'Right panel' },
      { name: 'asideWidth', type: "number", required: false, default: '25', description: 'Aside width' },
      { name: 'footer', type: "VNode", required: false, description: 'Footer/status bar' },
      { name: 'footerHeight', type: "number", required: false, default: '1', description: 'Footer height' },
      { name: 'dividers', type: "boolean", required: false, default: 'true', description: 'Show dividers' },
      { name: 'dividerStyle', type: "'line' | 'double' | 'dotted' | 'dashed' | 'thick'", required: false, default: "'line'", description: 'Divider style' },
      { name: 'dividerColor', type: "ColorValue", required: false, default: "'gray'", description: 'Divider color' },
      { name: 'padding', type: "number", required: false, default: '0', description: 'Content padding' },
      { name: 'children', type: "VNode", required: true, description: 'Main content' },
    ],
    examples: [
      `AppShell({\n  header: Header({ title: 'My App' }),\n  sidebar: Navigation(),\n  sidebarWidth: 25,\n  footer: StatusBar(),\n  children: MainContent()\n})`,
      `// IDE-style layout\nAppShell({\n  header: MenuBar(),\n  sidebar: FileTree(),\n  sidebarWidth: 30,\n  aside: Properties(),\n  asideWidth: 25,\n  footer: StatusBar(),\n  children: Editor()\n})`,
    ],
  },
  {
    name: 'Header',
    category: 'templates',
    description: 'Application header bar with title, subtitle, and action areas.',
    props: [
      { name: 'title', type: "string", required: true, description: 'App title' },
      { name: 'titleColor', type: "ColorValue", required: false, default: "'white'", description: 'Title color' },
      { name: 'subtitle', type: "string", required: false, description: 'Subtitle/version' },
      { name: 'leftActions', type: "VNode", required: false, description: 'Left actions/icons' },
      { name: 'rightActions', type: "VNode", required: false, description: 'Right actions/menu' },
      { name: 'backgroundColor', type: "ColorValue", required: false, description: 'Background color' },
      { name: 'border', type: "boolean", required: false, default: 'false', description: 'Show bottom border' },
      { name: 'borderColor', type: "ColorValue", required: false, default: "'gray'", description: 'Border color' },
    ],
    examples: [
      `Header({\n  title: 'My App',\n  subtitle: 'v1.0.0',\n  rightActions: HStack({ gap: 2 },\n    Text({}, '[H]elp'),\n    Text({}, '[Q]uit'),\n  ),\n  backgroundColor: 'blue'\n})`,
    ],
  },
  {
    name: 'StatusBar',
    category: 'templates',
    description: 'Bottom status bar with left, center, and right sections.',
    props: [
      { name: 'left', type: "VNode", required: false, description: 'Left section content' },
      { name: 'center', type: "VNode", required: false, description: 'Center section content' },
      { name: 'right', type: "VNode", required: false, description: 'Right section content' },
      { name: 'backgroundColor', type: "ColorValue", required: false, description: 'Background color' },
      { name: 'color', type: "ColorValue", required: false, default: "'white'", description: 'Text color' },
      { name: 'separator', type: "string", required: false, default: "' │ '", description: 'Separator character' },
    ],
    examples: [
      `StatusBar({\n  left: Text({}, 'Ready'),\n  center: Text({}, 'file.ts'),\n  right: Text({}, 'Ln 42, Col 8'),\n  backgroundColor: 'blue'\n})`,
    ],
  },
  {
    name: 'Container',
    category: 'templates',
    description: 'Content container with max-width constraint and optional centering.',
    props: [
      { name: 'maxWidth', type: "number", required: false, default: '80', description: 'Maximum width' },
      { name: 'center', type: "boolean", required: false, default: 'true', description: 'Center horizontally' },
      { name: 'padding', type: "number", required: false, default: '0', description: 'Internal padding' },
      { name: 'children', type: "VNode", required: true, description: 'Content' },
    ],
    examples: [
      `Container({\n  maxWidth: 80,\n  center: true,\n  padding: 2,\n  children: Content()\n})`,
    ],
  },
];

// =============================================================================
// Hooks
// =============================================================================

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
];

// =============================================================================
// Theme System
// =============================================================================

export const themeSystem: ComponentDoc = {
  name: 'Theme System',
  category: 'utils',
  description: 'Global theming with 11 built-in themes, semantic colors with auto-contrast, and component tokens.',
  props: [
    { name: 'resolveColor(name)', type: "function", required: false, description: 'Resolve semantic color: primary, success, warning, error, info, background, foreground, muted, mutedForeground' },
    { name: 'primaryForeground', type: "semantic", required: false, description: 'Auto-contrast text color for primary background (returns white or black)' },
    { name: 'successForeground', type: "semantic", required: false, description: 'Auto-contrast text color for success background' },
    { name: 'warningForeground', type: "semantic", required: false, description: 'Auto-contrast text color for warning background' },
    { name: 'dangerForeground', type: "semantic", required: false, description: 'Auto-contrast text color for danger/error background' },
    { name: 'theme.palette.primary[500]', type: "ColorScale", required: false, description: 'Color scales 50-900 for primary, secondary, success, warning, danger, neutral' },
    { name: 'theme.background', type: "hierarchy", required: false, description: 'Background levels: lowest, base, subtle, surface, raised, elevated, popover, overlay' },
    { name: 'theme.foreground', type: "hierarchy", required: false, description: 'Foreground levels: primary, secondary, muted, disabled, inverse' },
    { name: 'theme.accents', type: "object", required: false, description: 'Accent colors: positive, warning, critical, info, highlight' },
    { name: 'theme.components', type: "tokens", required: false, description: 'Component tokens: button, panel, tabs, modal, badge, etc.' },
  ],
  examples: [
    `// Use semantic colors (recommended)\nText({ color: resolveColor('primary') }, 'Primary')\nText({ color: resolveColor('success') }, 'Success')`,
    `// Auto-contrast for text on colored backgrounds\nBox({ backgroundColor: resolveColor('primary') },\n  Text({ color: resolveColor('primaryForeground') }, 'Always readable!')\n)`,
    `// Switch and cycle themes\nsetTheme(themes.dracula);\nconst next = getNextTheme(useTheme());\nsetTheme(next);`,
    `// Direct theme access\nconst theme = useTheme();\ntheme.palette.primary[500]; // Color scale\ntheme.background.surface; // Background hierarchy`,
  ],
};

export const availableThemes: ThemeDoc[] = [
  { name: 'darkTheme', description: 'Default dark theme (slate/blue)', colors: { primary: '#3b82f6', background: '#0f172a' } },
  { name: 'lightTheme', description: 'Clean light theme', colors: { primary: '#2563eb', background: '#ffffff' } },
  { name: 'monokaiTheme', description: 'Classic Monokai (green accents)', colors: { primary: '#a6e22e', background: '#272822' } },
  { name: 'draculaTheme', description: 'Dracula purple-pink theme', colors: { primary: '#bd93f9', background: '#282a36' } },
  { name: 'nordTheme', description: 'Arctic-inspired blue palette', colors: { primary: '#88c0d0', background: '#2e3440' } },
  { name: 'solarizedDarkTheme', description: 'Solarized Dark by Ethan Schoonover', colors: { primary: '#268bd2', background: '#002b36' } },
  { name: 'gruvboxTheme', description: 'Retro groove with warm colors', colors: { primary: '#fabd2f', background: '#282828' } },
  { name: 'tokyoNightTheme', description: 'Tokyo city lights inspired', colors: { primary: '#7aa2f7', background: '#1a1b26' } },
  { name: 'catppuccinTheme', description: 'Catppuccin Mocha (soothing pastel)', colors: { primary: '#cba6f7', background: '#1e1e2e' } },
  { name: 'highContrastDarkTheme', description: 'High contrast for accessibility', colors: { primary: '#00ff00', background: '#000000' } },
  { name: 'monochromeTheme', description: 'Grayscale only, no colors', colors: { primary: '#ffffff', background: '#1a1a1a' } },
];

// =============================================================================
// Custom Theme Creation Guide
// =============================================================================

export const customThemeGuide = `# Creating Custom Themes in Tuiuiu

Tuiuiu provides two approaches for creating custom themes:

## 1. Quick Customization with \`createTheme\`

Extend an existing theme with partial overrides. Perfect for simple color tweaks.

\`\`\`typescript
import { createTheme, darkTheme, setTheme } from 'tuiuiu.js';

// Create a custom theme by extending darkTheme
const myTheme = createTheme(darkTheme, {
  name: 'my-brand',

  // Override just the colors you need
  accents: {
    ...darkTheme.accents,
    positive: '#10b981',  // Custom success color
    highlight: '#8b5cf6', // Custom primary highlight
  },

  // Override background hierarchy
  background: {
    ...darkTheme.background,
    base: '#1a1a2e',
    surface: '#252538',
  },
});

setTheme(myTheme);
\`\`\`

## 2. Full Theme Definition with \`defineTheme\`

Create a complete theme from scratch with full control.

\`\`\`typescript
import { defineTheme } from 'tuiuiu.js/core/theme-loader';
import * as colors from 'tuiuiu.js/core/colors';

// Define custom palette using Tailwind colors
const palette = {
  primary: colors.violet,     // Full color scale (50-900)
  secondary: colors.slate,
  success: colors.emerald,
  warning: colors.amber,
  danger: colors.rose,
  neutral: colors.zinc,
};

export const myBrandTheme = defineTheme({
  name: 'my-brand',
  mode: 'dark',

  meta: {
    version: '1.0.0',
    author: 'Your Name',
    description: 'Custom brand theme',
  },

  palette,

  background: {
    lowest: palette.neutral[950],
    base: palette.neutral[900],
    subtle: palette.neutral[800],
    surface: palette.neutral[700],
    raised: palette.neutral[600],
    elevated: palette.neutral[500],
    popover: palette.neutral[800],
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  foreground: {
    primary: palette.neutral[50],
    secondary: palette.neutral[200],
    muted: palette.neutral[400],
    disabled: palette.neutral[500],
    inverse: {
      base: '#ffffff',
      soft: 'rgba(255, 255, 255, 0.6)',
      subtle: 'rgba(255, 255, 255, 0.35)',
    },
  },

  accents: {
    positive: palette.success[500],
    warning: palette.warning[500],
    critical: palette.danger[500],
    info: colors.cyan[500],
    highlight: palette.primary[500],
  },

  states: {
    hover: { bg: 'rgba(255, 255, 255, 0.05)', fg: null },
    active: { bg: 'rgba(255, 255, 255, 0.1)' },
    focus: {
      border: palette.primary[400],
      ring: { color: palette.primary[500], width: 2 },
    },
    disabled: {
      opacity: 0.4,
      bg: palette.neutral[800],
      fg: palette.neutral[500],
    },
    selected: {
      bg: palette.primary[700],
      fg: '#ffffff',
    },
  },

  borders: {
    default: palette.neutral[700],
    subtle: palette.neutral[800],
    strong: palette.neutral[500],
    accent: palette.primary[500],
    danger: palette.danger[500],
  },

  opacity: {
    disabled: 0.4,
    muted: 0.7,
    overlay: 0.5,
    ghost: 0.2,
  },

  components: {
    button: {
      primary: {
        bg: palette.primary[500],
        fg: '#ffffff',
        hoverBg: palette.primary[400],
        activeBg: palette.primary[600],
        border: 'transparent',
      },
      secondary: {
        bg: palette.neutral[700],
        fg: palette.neutral[50],
        hoverBg: palette.neutral[600],
        activeBg: palette.neutral[800],
        border: 'transparent',
      },
      outline: {
        bg: 'transparent',
        fg: palette.primary[400],
        hoverBg: 'rgba(255, 255, 255, 0.05)',
        activeBg: 'rgba(255, 255, 255, 0.1)',
        border: palette.primary[500],
      },
      ghost: {
        bg: 'transparent',
        fg: palette.neutral[50],
        hoverBg: 'rgba(255, 255, 255, 0.05)',
        activeBg: 'rgba(255, 255, 255, 0.1)',
        border: 'transparent',
      },
    },
    // ... other component tokens (panel, menu, tabs, input, etc.)
    // See src/themes/dark.theme.ts for full component token structure
  },
});
\`\`\`

## 3. Merge Themes with \`mergeThemes\`

Deep merge for more complex overrides including component tokens.

\`\`\`typescript
import { mergeThemes, darkTheme, setTheme } from 'tuiuiu.js';

const customTheme = mergeThemes(darkTheme, {
  name: 'custom-dark',

  // Override component-specific tokens
  components: {
    button: {
      primary: {
        bg: '#8b5cf6',
        hoverBg: '#a78bfa',
      },
    },
    input: {
      focusBorder: '#8b5cf6',
    },
  },
});

setTheme(customTheme);
\`\`\`

### \`createTheme\` vs \`mergeThemes\` - When to Use Each

| | \`createTheme\` | \`mergeThemes\` |
|---|---|---|
| **Component merge** | **Shallow** - replaces entire \`components\` object | **Deep** - merges each component recursively |
| **Best for** | Overriding top-level colors (accents, background, foreground) | Overriding specific component tokens |

**Example of the difference:**

\`\`\`typescript
// createTheme - if you pass components, it REPLACES everything
const theme1 = createTheme(darkTheme, {
  components: {
    button: { primary: { bg: '#8b5cf6' } }  // ❌ Loses secondary, outline, ghost!
  }
});

// mergeThemes - does deep merge, preserves the rest
const theme2 = mergeThemes(darkTheme, {
  components: {
    button: { primary: { bg: '#8b5cf6' } }  // ✅ Keeps secondary, outline, ghost
  }
});
\`\`\`

**Rule of thumb:** Use \`mergeThemes\` if you're changing \`components\`. For everything else, both work the same.

## 4. Applying Themes

### Global Theme

\`\`\`typescript
import { setTheme, useTheme, getTheme, themes } from 'tuiuiu.js';

// Set the global theme (reactive - all components re-render)
setTheme(themes.dracula);
setTheme(myCustomTheme);

// Get current theme (reactive - use inside components)
const theme = useTheme();

// Get current theme (non-reactive - use outside components)
const theme = getTheme();

// Cycle through themes
import { getNextTheme, getPreviousTheme } from 'tuiuiu.js';
setTheme(getNextTheme(useTheme()));  // Next theme
setTheme(getPreviousTheme(useTheme()));  // Previous theme
\`\`\`

### Nested/Temporary Themes (pushTheme/popTheme)

Use theme stacking for temporary theme changes (e.g., modals with different themes):

\`\`\`typescript
import { pushTheme, popTheme, lightTheme } from 'tuiuiu.js';

// Temporarily use a different theme
pushTheme(lightTheme);
// ... render modal or overlay with light theme ...
popTheme();  // Restore previous theme

// Common pattern for themed modals
function ThemedModal({ children }) {
  pushTheme(lightTheme);

  // Cleanup when modal closes
  onCleanup(() => popTheme());

  return Modal({}, children);
}
\`\`\`

### Theme Cycling (Development)

\`\`\`typescript
import { useInput, useTheme, setTheme, getNextTheme } from 'tuiuiu.js';

// Cycle themes with Tab key (great for testing)
useInput((input, key) => {
  if (key.tab) {
    const current = useTheme();
    setTheme(getNextTheme(current));
  }
});
\`\`\`

## Theme Structure Reference

### Palette (Color Scales)
Each color has shades from 50 (lightest) to 900 (darkest):
- \`primary\` - Main brand color
- \`secondary\` - Neutral/secondary actions
- \`success\` - Positive/confirmation states
- \`warning\` - Caution/attention states
- \`danger\` - Error/destructive states
- \`neutral\` - Grayscale for backgrounds/text

### Background Hierarchy (depth levels)
- \`lowest\` - Deepest background (app shell)
- \`base\` - Main app background
- \`subtle\` - Slightly elevated (muted areas)
- \`surface\` - Cards, panels
- \`raised\` - Elevated elements
- \`elevated\` - Highest elevation
- \`popover\` - Popovers, dropdowns
- \`overlay\` - Modal overlays (rgba)

### Foreground Hierarchy (text levels)
- \`primary\` - Main text
- \`secondary\` - Secondary text
- \`muted\` - De-emphasized text
- \`disabled\` - Disabled text
- \`inverse\` - Text on colored backgrounds

### Semantic Colors (resolveColor)
Use these in components for automatic theme integration:
\`\`\`typescript
Text({ color: resolveColor('primary') })     // Theme primary color
Text({ color: resolveColor('success') })     // Success/positive
Text({ color: resolveColor('error') })       // Error/danger
Text({ color: resolveColor('warning') })     // Warning
Text({ color: resolveColor('foreground') })  // Primary text
Text({ color: resolveColor('muted') })       // Muted background
Text({ color: resolveColor('mutedForeground') }) // Muted text

// Auto-contrast (returns white or black based on background)
Box({ backgroundColor: resolveColor('primary') },
  Text({ color: resolveColor('primaryForeground') }, 'Auto-readable!')
)
\`\`\`

## Available Tailwind Colors

Import from \`tuiuiu.js/core/colors\`:
\`\`\`typescript
import {
  slate, gray, zinc, neutral, stone,  // Neutrals
  red, orange, amber, yellow,          // Warm
  lime, green, emerald, teal,          // Greens
  cyan, sky, blue, indigo,             // Blues
  violet, purple, fuchsia, pink, rose, // Purples/Pinks
} from 'tuiuiu.js/core/colors';

// Each color has shades: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900
colors.blue[500] // '#3b82f6'
\`\`\`

## Theme API Reference

| Function | Description |
|----------|-------------|
| \`setTheme(theme)\` | Set the global theme |
| \`useTheme()\` | Get current theme (reactive) |
| \`getTheme()\` | Get current theme (non-reactive) |
| \`pushTheme(theme)\` | Push theme onto stack (temporary) |
| \`popTheme()\` | Pop theme from stack (restore previous) |
| \`getNextTheme(current)\` | Get next theme in cycle |
| \`getPreviousTheme(current)\` | Get previous theme in cycle |
| \`resolveColor(name)\` | Resolve semantic color to hex |
| \`createTheme(base, overrides)\` | Extend theme (shallow merge) |
| \`mergeThemes(base, overrides)\` | Extend theme (deep merge) |
| \`defineTheme(definition)\` | Create complete theme from scratch |

## Tips

1. **Use \`mergeThemes\`** when overriding component tokens
2. **Use \`createTheme\`** for simple color overrides
3. **Use \`defineTheme\`** when you need full control from scratch
4. **Use semantic colors** (\`resolveColor\`) for automatic theme switching
5. **Test with Tab key cycling** using \`getNextTheme()\` during development
6. **Use \`pushTheme/popTheme\`** for temporary theme changes (modals, overlays)
`;

// =============================================================================
// Signals (Core Reactivity)
// =============================================================================

export const signals: HookDoc[] = [
  {
    name: 'createSignal',
    description: 'Create a reactive signal (core primitive for state management).',
    signature: 'createSignal<T>(value: T): [Accessor<T>, Setter<T>]',
    params: [
      { name: 'value', type: 'T', required: true, description: 'Initial value' },
    ],
    returns: 'Tuple of [getter, setter]',
    examples: [
      `const [count, setCount] = createSignal(0);\nconsole.log(count()); // 0\nsetCount(5);\nconsole.log(count()); // 5`,
    ],
  },
  {
    name: 'createEffect',
    description: 'Run a function that auto-tracks signal dependencies and re-runs when they change.',
    signature: 'createEffect(fn: () => void): void',
    params: [
      { name: 'fn', type: '() => void', required: true, description: 'Effect function' },
    ],
    returns: 'void',
    examples: [
      `createEffect(() => {\n  console.log('Count is now:', count());\n});`,
    ],
  },
  {
    name: 'createMemo',
    description: 'Create a derived/computed value that caches and updates automatically.',
    signature: 'createMemo<T>(fn: () => T): Accessor<T>',
    params: [
      { name: 'fn', type: '() => T', required: true, description: 'Computation function' },
    ],
    returns: 'Accessor function returning the memoized value',
    examples: [
      `const doubled = createMemo(() => count() * 2);\nconsole.log(doubled()); // auto-updates when count changes`,
    ],
  },
  {
    name: 'batch',
    description: 'Batch multiple signal updates into a single re-render.',
    signature: 'batch(fn: () => void): void',
    params: [
      { name: 'fn', type: '() => void', required: true, description: 'Function with multiple updates' },
    ],
    returns: 'void',
    examples: [
      `batch(() => {\n  setX(1);\n  setY(2);\n  setZ(3);\n}); // Only one re-render`,
    ],
  },
];

// =============================================================================
// All Documentation Combined
// =============================================================================

export const allComponents: ComponentDoc[] = [
  ...primitives,
  ...atoms,
  ...molecules,
  ...dataViz,
  ...organisms,
  ...layouts,
  themeSystem,
];

export const allHooks: HookDoc[] = [
  ...hooks,
  ...signals,
];

export const allThemes: ThemeDoc[] = availableThemes;

// Category groupings for listing
export const categories = {
  primitives: primitives.map(c => c.name),
  atoms: atoms.map(c => c.name),
  molecules: [...molecules, ...dataViz].map(c => c.name),
  organisms: organisms.map(c => c.name),
  layouts: layouts.map(c => c.name),
  hooks: hooks.map(h => h.name),
  signals: signals.map(s => s.name),
  themes: availableThemes.map(t => t.name),
};
