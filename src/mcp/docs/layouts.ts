/**
 * Layouts Documentation
 */

import type { ComponentDoc } from '../types.js';

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
