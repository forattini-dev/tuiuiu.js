/**
 * Atoms Documentation
 */

import type { ComponentDoc } from '../types.js';

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
    name: 'Scrollbar',
    category: 'atoms',
    description: 'Standalone scrollbar component for custom scroll implementations. Renders a visual scrollbar with thumb and track.',
    props: [
      { name: 'height', type: "number", required: true, description: 'Height of the scrollbar area (number of lines)' },
      { name: 'total', type: "number", required: true, description: 'Total height of content' },
      { name: 'current', type: "number", required: true, description: 'Current scroll position (from 0 to maxScroll)' },
      { name: 'color', type: "ColorValue", required: false, default: "'cyan'", description: 'Color of the thumb (scroller)' },
      { name: 'trackColor', type: "ColorValue", required: false, default: "'gray'", description: 'Color of the track' },
      { name: 'thumbChar', type: "string", required: false, description: 'Custom character for the thumb' },
      { name: 'trackChar', type: "string", required: false, description: 'Custom character for the track' },
    ],
    examples: [
      `// Basic scrollbar\nScrollbar({\n  height: 10,\n  total: 50,\n  current: 15,\n})`,
      `// Custom styled scrollbar\nScrollbar({\n  height: 20,\n  total: 100,\n  current: scrollTop(),\n  color: 'primary',\n  trackColor: 'muted',\n})`,
      `// In a custom scroll component\nBox({ flexDirection: 'row' },\n  Box({ width: 40, height: 10 },\n    ...visibleContent\n  ),\n  Scrollbar({\n    height: 10,\n    total: totalContent,\n    current: scrollPosition,\n  })\n)`,
    ],
  },
];
