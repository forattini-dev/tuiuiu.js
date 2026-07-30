/**
 * Layouts Documentation
 */

import type { ComponentDoc } from '../types.js';

export const layouts: ComponentDoc[] = [
  {
    name: 'Screen',
    category: 'templates',
    description: 'Top-level terminal container that fills the screen and uses column layout by default.',
    props: [
      { name: 'padding', type: "number", required: false, description: 'Padding on all sides' },
      { name: 'backgroundColor', type: "ColorValue", required: false, description: 'Background color' },
      { name: 'width', type: "number | string | 'auto' | 'fill'", required: false, description: 'Override width' },
      { name: 'height', type: "number | string | 'auto' | 'fill'", required: false, description: 'Override height' },
    ],
    examples: [
      `Screen({},\n  Header({}, Title('Dashboard')),\n  Main({}, Content()),\n  Footer({}, StatusBar())\n)`,
    ],
  },
  {
    name: 'Main',
    category: 'templates',
    description: 'Primary content area that fills remaining space in a Screen layout.',
    props: [
      { name: 'height', type: "number | string | 'auto' | 'fill'", required: false, default: "'fill'", description: 'Main area height' },
    ],
    examples: [
      `Main({},\n  Content()\n)`,
    ],
  },
  {
    name: 'Footer',
    category: 'templates',
    description: 'Footer row with auto height by default.',
    props: [
      { name: 'height', type: "number | string | 'auto' | 'fill'", required: false, default: "'auto'", description: 'Footer height' },
    ],
    examples: [
      `Footer({},\n  Text({}, 'Ready')\n)`,
    ],
  },
  {
    name: 'Sidebar',
    category: 'templates',
    description: 'Sidebar column with fill height and auto width by default.',
    props: [
      { name: 'width', type: "number | string | 'auto' | 'fill'", required: false, default: "'auto'", description: 'Sidebar width' },
      { name: 'height', type: "number | string | 'auto' | 'fill'", required: false, default: "'fill'", description: 'Sidebar height' },
    ],
    examples: [
      `Box({ flexDirection: 'row', height: 'fill' },\n  Sidebar({ width: 24 }, Nav()),\n  Main({}, Content())\n)`,
    ],
  },
  {
    name: 'Panel',
    category: 'templates',
    description: 'Bordered container with optional title and padding.',
    props: [
      { name: 'title', type: "string", required: false, description: 'Panel title' },
      { name: 'borderStyle', type: "BoxStyle['borderStyle']", required: false, default: "'round'", description: 'Border style' },
      { name: 'borderColor', type: "ColorValue", required: false, default: "'muted'", description: 'Border color' },
      { name: 'padding', type: "number", required: false, default: '1', description: 'Inner padding' },
    ],
    examples: [
      `Panel({ title: 'Stats' },\n  Text({}, 'OK')\n)`,
    ],
  },
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
      { name: 'scrollbarColor', type: "ColorValue", required: false, default: "'primary'", description: 'Scrollbar thumb color (theme-aware)' },
      { name: 'trackColor', type: "ColorValue", required: false, default: "'muted'", description: 'Scrollbar track color (theme-aware)' },
      { name: 'scrollStep', type: "number", required: false, default: '1', description: 'Lines per scroll step' },
      { name: 'state', type: "ScrollState", required: false, description: 'External state for control via useScroll()' },
    ],
    examples: [
      `// Simple content scroll\nScroll({ height: 10 },\n  Text({}, longText),\n)`,
      `// Complex layouts\nScroll({ height: 20, width: 60 },\n  Box({ flexDirection: 'column' },\n    Header(),\n    Content(),\n    Footer(),\n  ),\n)`,
      `// With shared stable control\nconst scroll = useScroll();\nscroll.scrollToBottom();\n\nScroll({ ...scroll.bind, height: 20 },\n  ...content\n)`,
    ],
  },
  {
    name: 'Page',
    category: 'templates',
    description: 'Single page layout with title, content, and footer. Supports borders and full-screen mode.',
    props: [
      { name: 'title', type: "string", required: false, description: 'Page title at top' },
      { name: 'subtitle', type: "string", required: false, description: 'Subtitle/description' },
      { name: 'variant', type: "'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'", required: false, default: "'default'", description: 'Semantic page color variant' },
      { name: 'color', type: "ColorValue", required: false, description: 'Custom page background color' },
      { name: 'border', type: "boolean", required: false, default: 'false', description: 'Show border around page' },
      { name: 'borderStyle', type: "'single' | 'double' | 'round' | 'bold'", required: false, default: "'single'", description: 'Border style' },
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
      { name: 'dividerColor', type: "ColorValue", required: false, default: "'border'", description: 'Divider color (theme-aware)' },
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
    description: 'Application header bar with title, subtitle, and action areas. Supports two modes: **Styled mode** (with title prop) or **Layout mode** (with children). Use lowercase `header()` shorthand for cleaner layout code.',
    props: [
      { name: 'title', type: "string", required: false, description: 'App title (styled mode)' },
      { name: 'subtitle', type: "string", required: false, description: 'Subtitle/version' },
      { name: 'variant', type: "HeaderVariant", required: false, default: "'default'", description: 'Theme variant' },
      { name: 'color', type: "string", required: false, description: 'Custom background color (auto-contrast text)' },
      { name: 'leftActions', type: "string | VNode", required: false, description: 'Left actions/icons' },
      { name: 'rightActions', type: "string | VNode", required: false, description: 'Right actions/menu' },
      { name: 'border', type: "boolean", required: false, default: 'false', description: 'Show bottom border' },
      { name: 'height', type: "number | string | 'auto' | 'fill'", required: false, default: "'auto'", description: 'Layout mode height override' },
      { name: 'width', type: "number | string | 'auto' | 'fill'", required: false, default: "'fill'", description: 'Layout mode width (fills by default)' },
      { name: 'children', type: "VNode[]", required: false, description: 'Layout mode children (row layout)' },
    ],
    examples: [
      `// Styled mode (with title prop)\nHeader({\n  title: 'My App',\n  subtitle: 'v1.0.0',\n  rightActions: HStack({ gap: 2 },\n    Text({}, '[H]elp'),\n    Text({}, '[Q]uit'),\n  ),\n  color: 'blue'\n})`,
      `// Layout mode (with children)\nHeader({},\n  Title('Dashboard'),\n  Spacer(),\n  Caption('v1.2.0')\n)`,
      `// Shorthand helper\nheader(\n  Title('Dashboard'),\n  Spacer(),\n  Caption('v1.2.0')\n)`,
    ],
  },
  {
    name: 'screen',
    category: 'templates',
    description: 'Shorthand helper for Screen. Accepts children directly without props object.',
    props: [],
    examples: [
      `screen(\n  header(Title('Dashboard')),\n  main(Content()),\n  footer(StatusText())\n)`,
    ],
  },
  {
    name: 'header',
    category: 'templates',
    description: 'Shorthand helper for Header in layout mode. Row layout with auto height and fill width.',
    props: [],
    examples: [
      `header(\n  Title('My App'),\n  Spacer(),\n  Caption('v1.0')\n)`,
    ],
  },
  {
    name: 'main',
    category: 'templates',
    description: 'Shorthand helper for Main. Column layout that fills remaining height.',
    props: [],
    examples: [
      `main(\n  Content()\n)`,
    ],
  },
  {
    name: 'footer',
    category: 'templates',
    description: 'Shorthand helper for Footer. Row layout with auto height.',
    props: [],
    examples: [
      `footer(\n  Caption('[Q] Quit'),\n  Spacer(),\n  Caption('Ready')\n)`,
    ],
  },
  {
    name: 'sidebar',
    category: 'templates',
    description: 'Shorthand helper for Sidebar. Column layout with fill height and auto width.',
    props: [],
    examples: [
      `sidebar(\n  Navigation()\n)`,
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
      { name: 'color', type: "ColorValue", required: false, description: 'Custom background color' },
      { name: 'separator', type: "string", required: false, default: "' │ '", description: 'Separator character' },
    ],
    examples: [
      `StatusBar({\n  left: Text({}, 'Ready'),\n  center: Text({}, 'file.ts'),\n  right: Text({}, 'Ln 42, Col 8'),\n  color: 'blue'\n})`,
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
