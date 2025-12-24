/**
 * Primitives Documentation
 */

import type { ComponentDoc } from '../types.js';

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
  {
    name: 'SplitBox',
    category: 'primitives',
    description: 'Box with internal divisions and connected border characters (┬ ┴). Perfect for headers with logos, status panels with sections.',
    props: [
      { name: 'sections', type: "SplitBoxSection[]", required: true, description: 'Array of sections to render' },
      { name: 'borderStyle', type: "'single' | 'round' | 'double' | 'bold'", required: false, default: "'single'", description: 'Border style' },
      { name: 'borderColor', type: "string", required: false, description: 'Border color' },
      { name: 'width', type: "number", required: false, description: 'Total width (defaults to terminal width)' },
      { name: 'minHeight', type: "number", required: false, default: '1', description: 'Minimum content height' },
      { name: 'padding', type: "number", required: false, default: '0', description: 'Padding inside each section' },
      { name: 'paddingX', type: "number", required: false, description: 'Horizontal padding inside sections' },
      { name: 'paddingY', type: "number", required: false, description: 'Vertical padding inside sections' },
    ],
    examples: [
      `// Header with ASCII logo\nSplitBox({\n  borderStyle: 'round',\n  sections: [\n    { width: 12, content: Logo(), valign: 'middle' },\n    { flexGrow: 1, content: Info() },\n  ],\n  paddingX: 1,\n})`,
      `// Three-section layout\nSplitBox({\n  borderStyle: 'double',\n  width: 60,\n  sections: [\n    { width: 5, content: Icon(), align: 'center' },\n    { flexGrow: 1, content: Title() },\n    { width: 10, content: Status() },\n  ],\n})`,
    ],
  },
];
