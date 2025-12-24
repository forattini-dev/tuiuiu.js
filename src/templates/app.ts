/**
 * Application Layouts - Higher-level layout components for apps
 *
 * Provides structured layouts for building complete applications:
 * - Page: Single page with header, content, footer
 * - AppShell: Complete app structure with sidebar, header, content
 * - StatusBar: Bottom status bar component
 * - Header: App header with title and actions
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode } from '../utils/types.js';
import { VStack, HStack, Spacer, Divider } from './stack.js';
import { getTheme, getContrastColor } from '../core/theme.js';
import type { SemanticVariant } from '../core/theme-types.js';

// =============================================================================
// TYPES
// =============================================================================

/** Variant type for Header component */
export type HeaderVariant = SemanticVariant;

/** Variant type for StatusBar component */
export type StatusBarVariant = 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'default';

/** Variant type for Page component */
export type PageVariant = 'primary' | 'secondary' | 'default';

// =============================================================================
// PAGE - Single page layout
// =============================================================================

export interface PageProps {
  /** Page title (displayed at top) */
  title?: string;
  /** Subtitle or description */
  subtitle?: string;
  /** Semantic variant for theming */
  variant?: PageVariant;
  /** Custom background color (overrides variant) */
  color?: string;
  /** Show border around page */
  border?: boolean;
  /** Border style */
  borderStyle?: 'single' | 'double' | 'round' | 'bold';
  /** Header content (overrides title) */
  header?: VNode;
  /** Footer content */
  footer?: VNode;
  /** Show title/content divider */
  divider?: boolean;
  /** Padding inside page */
  padding?: number;
  /** Full screen mode */
  fullScreen?: boolean;
  /** Page width */
  width?: number;
  /** Page height */
  height?: number;
  /** Main content */
  children: VNode;
}

/**
 * Page - Single page layout with header and footer
 *
 * @example
 * ```typescript
 * Page({
 *   title: 'Settings',
 *   subtitle: 'Configure your preferences',
 *   footer: Text({ color: 'gray' }, 'Press ESC to go back'),
 *   children: SettingsForm()
 * })
 *
 * // Full screen page with border
 * Page({
 *   title: 'Dashboard',
 *   fullScreen: true,
 *   border: true,
 *   borderStyle: 'round',
 *   children: DashboardContent()
 * })
 * ```
 */
export function Page(props: PageProps): VNode {
  const theme = getTheme();
  const {
    title,
    subtitle,
    variant = 'default',
    color,
    border = false,
    borderStyle = 'single',
    header,
    footer,
    divider = true,
    padding = 1,
    fullScreen = false,
    width,
    height,
    children,
  } = props;

  // Resolve colors from theme tokens or custom color
  let titleColor: string;
  let subtitleColor: string;
  let borderColor: string;
  let backgroundColor: string | undefined;

  if (color) {
    // Custom color: use getContrastColor for text
    backgroundColor = color;
    titleColor = getContrastColor(color);
    subtitleColor = getContrastColor(color); // Will use dim in the Text component
    borderColor = color;
  } else {
    // Use theme tokens based on variant
    const tokens = theme.components.page[variant] ?? theme.components.page.default;
    backgroundColor = tokens.bg;
    titleColor = tokens.titleFg;
    subtitleColor = tokens.subtitleFg;
    borderColor = tokens.border;
  }

  const termWidth = process.stdout.columns || 80;
  const termHeight = process.stdout.rows || 24;

  const pageWidth = fullScreen ? termWidth : (width ?? termWidth);
  const pageHeight = fullScreen ? termHeight : height;

  const parts: VNode[] = [];

  // Header section
  if (header) {
    parts.push(header);
    if (divider) {
      parts.push(Divider({ color: borderColor }));
    }
  } else if (title) {
    const headerContent: VNode[] = [
      Text({ color: titleColor, bold: true }, title),
    ];
    if (subtitle) {
      headerContent.push(Text({ color: subtitleColor, dim: true }, ` - ${subtitle}`));
    }
    parts.push(HStack({ children: headerContent }));
    if (divider) {
      parts.push(Divider({ color: borderColor }));
    }
  }

  // Main content
  parts.push(
    Box(
      { flexGrow: 1, flexDirection: 'column' },
      children
    )
  );

  // Footer section
  if (footer) {
    if (divider) {
      parts.push(Divider({ color: borderColor }));
    }
    parts.push(footer);
  }

  // Build the page
  const pageContent = VStack({
    gap: 0,
    padding: border ? 0 : padding,
    width: border ? undefined : pageWidth,
    height: border ? undefined : pageHeight,
    children: parts,
  });

  if (border) {
    return Box(
      {
        borderStyle,
        borderColor,
        backgroundColor,
        padding,
        width: pageWidth,
        height: pageHeight,
        flexDirection: 'column',
      },
      pageContent
    );
  }

  return Box(
    { backgroundColor, flexDirection: 'column' },
    pageContent
  );
}

// =============================================================================
// APPSHELL - Complete application structure
// =============================================================================

export interface AppShellProps {
  /** App header (top bar) */
  header?: VNode;
  /** Header height (default: auto) */
  headerHeight?: number;
  /** Left sidebar */
  sidebar?: VNode;
  /** Sidebar width */
  sidebarWidth?: number;
  /** Right panel */
  aside?: VNode;
  /** Aside width */
  asideWidth?: number;
  /** Footer/status bar */
  footer?: VNode;
  /** Footer height (default: 1) */
  footerHeight?: number;
  /** Show dividers between sections */
  dividers?: boolean;
  /** Divider style */
  dividerStyle?: 'line' | 'double' | 'dotted' | 'dashed' | 'thick';
  /** Divider color */
  dividerColor?: string;
  /** Padding inside content area */
  padding?: number;
  /** Main content */
  children: VNode;
}

/**
 * AppShell - Complete application shell with header, sidebar, content, footer
 *
 * @example
 * ```typescript
 * AppShell({
 *   header: Header({ title: 'My App' }),
 *   sidebar: Navigation(),
 *   sidebarWidth: 25,
 *   footer: StatusBar(),
 *   children: MainContent()
 * })
 *
 * // IDE-style layout
 * AppShell({
 *   header: MenuBar(),
 *   sidebar: FileTree(),
 *   sidebarWidth: 30,
 *   aside: Properties(),
 *   asideWidth: 25,
 *   footer: StatusBar(),
 *   children: Editor()
 * })
 * ```
 */
export function AppShell(props: AppShellProps): VNode {
  const theme = getTheme();
  const tokens = theme.components.appshell;

  const {
    header,
    headerHeight,
    sidebar,
    sidebarWidth = 25,
    aside,
    asideWidth = 25,
    footer,
    footerHeight = 1,
    dividers = true,
    dividerStyle = 'line',
    dividerColor = props.dividerColor ?? tokens.dividerFg,
    padding = 0,
    children,
  } = props;

  const termWidth = process.stdout.columns || 80;
  const termHeight = process.stdout.rows || 24;

  // Divider character based on style
  const divChars: Record<string, { v: string; h: string }> = {
    line: { v: '│', h: '─' },
    double: { v: '║', h: '═' },
    dotted: { v: '┊', h: '┈' },
    dashed: { v: '┆', h: '┄' },
    thick: { v: '┃', h: '━' },
  };
  const divChar = divChars[dividerStyle] || divChars.line;

  // Build vertical layout
  const rows: VNode[] = [];

  // Header
  if (header) {
    rows.push(
      Box(
        { width: termWidth, height: headerHeight, flexDirection: 'column' },
        header
      )
    );
    if (dividers) {
      rows.push(Text({ color: dividerColor }, divChar.h.repeat(termWidth)));
    }
  }

  // Calculate content height
  let contentHeight = termHeight;
  if (header) contentHeight -= (headerHeight ?? 1) + (dividers ? 1 : 0);
  if (footer) contentHeight -= footerHeight + (dividers ? 1 : 0);

  // Middle section (sidebar + content + aside)
  const middleParts: VNode[] = [];

  // Sidebar
  if (sidebar) {
    middleParts.push(
      Box(
        { width: sidebarWidth, height: contentHeight, flexDirection: 'column' },
        sidebar
      )
    );
    if (dividers) {
      const sidebarDivider = Array(contentHeight).fill(divChar.v).join('\n');
      middleParts.push(Text({ color: dividerColor }, sidebarDivider));
    }
  }

  // Main content
  const contentWidth = termWidth
    - (sidebar ? sidebarWidth + (dividers ? 1 : 0) : 0)
    - (aside ? asideWidth + (dividers ? 1 : 0) : 0);

  middleParts.push(
    Box(
      {
        width: contentWidth,
        height: contentHeight,
        padding,
        flexDirection: 'column',
      },
      children
    )
  );

  // Aside
  if (aside) {
    if (dividers) {
      const asideDivider = Array(contentHeight).fill(divChar.v).join('\n');
      middleParts.push(Text({ color: dividerColor }, asideDivider));
    }
    middleParts.push(
      Box(
        { width: asideWidth, height: contentHeight, flexDirection: 'column' },
        aside
      )
    );
  }

  rows.push(Box({ flexDirection: 'row' }, ...middleParts));

  // Footer
  if (footer) {
    if (dividers) {
      rows.push(Text({ color: dividerColor }, divChar.h.repeat(termWidth)));
    }
    rows.push(
      Box(
        { width: termWidth, height: footerHeight, flexDirection: 'column' },
        footer
      )
    );
  }

  return Box(
    { width: termWidth, height: termHeight, flexDirection: 'column' },
    ...rows
  );
}

// =============================================================================
// STATUSBAR - Bottom status bar
// =============================================================================

export interface StatusBarProps {
  /** Left section content (string auto-colored, VNode used as-is) */
  left?: string | VNode;
  /** Center section content (string auto-colored, VNode used as-is) */
  center?: string | VNode;
  /** Right section content (string auto-colored, VNode used as-is) */
  right?: string | VNode;
  /** Semantic variant for theming */
  variant?: StatusBarVariant;
  /** Custom background color (overrides variant) */
  color?: string;
  /** Separator character between items */
  separator?: string;
}

/**
 * StatusBar - Bottom status bar with left/center/right sections
 *
 * @example
 * ```typescript
 * StatusBar({
 *   left: Text({}, 'Ready'),
 *   center: Text({}, 'file.ts'),
 *   right: Text({}, 'Ln 42, Col 8'),
 *   backgroundColor: 'blue'
 * })
 * ```
 */
export function StatusBar(props: StatusBarProps): VNode {
  const theme = getTheme();
  const {
    left,
    center,
    right,
    variant = 'default',
    color,
    separator = ' │ ',
  } = props;

  // Resolve colors from theme tokens or custom color
  let backgroundColor: string;
  let textColor: string;

  if (color) {
    // Custom color: use getContrastColor for text
    backgroundColor = color;
    textColor = getContrastColor(color);
  } else {
    // Use theme tokens based on variant
    const tokens = theme.components.statusbar[variant] ?? theme.components.statusbar.default;
    backgroundColor = tokens.bg;
    textColor = tokens.fg;
  }

  const termWidth = process.stdout.columns || 80;

  // Helper to convert string to Text with correct color, or pass VNode through
  const toNode = (content: string | VNode | undefined): VNode | null => {
    if (content === undefined) return null;
    if (typeof content === 'string') {
      return Text({ color: textColor }, content);
    }
    return content;
  };

  const parts: VNode[] = [];

  const leftNode = toNode(left);
  if (leftNode) {
    parts.push(leftNode);
  }

  parts.push(Spacer());

  const centerNode = toNode(center);
  if (centerNode) {
    parts.push(centerNode);
    parts.push(Spacer());
  }

  const rightNode = toNode(right);
  if (rightNode) {
    parts.push(rightNode);
  }

  return Box(
    {
      width: termWidth,
      height: 1,
      backgroundColor,
      flexDirection: 'row',
      paddingX: 1,
    },
    ...parts
  );
}

// =============================================================================
// HEADER - App header bar
// =============================================================================

export interface HeaderProps {
  /** App title */
  title: string;
  /** Subtitle/version */
  subtitle?: string;
  /** Semantic variant for theming */
  variant?: HeaderVariant;
  /** Custom background color (overrides variant) */
  color?: string;
  /** Left actions/icons (string auto-colored, VNode used as-is) */
  leftActions?: string | VNode;
  /** Right actions/menu (string auto-colored, VNode used as-is) */
  rightActions?: string | VNode;
  /** Show bottom border */
  border?: boolean;
}

/**
 * Header - Application header with title and actions
 *
 * @example
 * ```typescript
 * Header({
 *   title: 'My App',
 *   subtitle: 'v1.0.0',
 *   rightActions: HStack({ gap: 2, children: [
 *     Text({}, '[H]elp'),
 *     Text({}, '[Q]uit'),
 *   ]}),
 *   backgroundColor: 'blue'
 * })
 * ```
 */
export function Header(props: HeaderProps): VNode {
  const theme = getTheme();
  const {
    title,
    subtitle,
    variant = 'default',
    color,
    leftActions,
    rightActions,
    border = false,
  } = props;

  // Resolve colors from theme tokens or custom color
  let backgroundColor: string;
  let titleColor: string;
  let subtitleColor: string;
  let borderColor: string;
  let actionColor: string;

  if (color) {
    // Custom color: use getContrastColor for text
    backgroundColor = color;
    titleColor = getContrastColor(color);
    subtitleColor = getContrastColor(color); // Will use dim in the Text component
    actionColor = getContrastColor(color);
    borderColor = color;
  } else {
    // Use theme tokens based on variant
    const tokens = theme.components.header[variant] ?? theme.components.header.default;
    backgroundColor = tokens.bg;
    titleColor = tokens.titleFg;
    subtitleColor = tokens.subtitleFg;
    actionColor = tokens.fg;
    borderColor = tokens.border;
  }

  const termWidth = process.stdout.columns || 80;

  // Helper to convert string to Text with correct color, or pass VNode through
  const toNode = (content: string | VNode | undefined): VNode | null => {
    if (content === undefined) return null;
    if (typeof content === 'string') {
      return Text({ color: actionColor }, content);
    }
    return content;
  };

  const titleNode = Box(
    { flexDirection: 'row' },
    Text({ color: titleColor, bold: true }, title),
    subtitle ? Text({ color: subtitleColor, dim: true }, ` ${subtitle}`) : Box({})
  );

  const parts: VNode[] = [];

  const leftNode = toNode(leftActions);
  if (leftNode) {
    parts.push(leftNode);
    parts.push(Box({ width: 2 }));
  }

  parts.push(titleNode);
  parts.push(Spacer());

  const rightNode = toNode(rightActions);
  if (rightNode) {
    parts.push(rightNode);
  }

  const headerContent = Box(
    {
      width: termWidth,
      backgroundColor,
      flexDirection: 'row',
      paddingX: 1,
    },
    ...parts
  );

  if (border) {
    return VStack({
      gap: 0,
      children: [
        headerContent,
        Text({ color: borderColor }, '─'.repeat(termWidth)),
      ],
    });
  }

  return headerContent;
}

// =============================================================================
// CONTAINER - Generic container with max-width
// =============================================================================

export interface ContainerProps {
  /** Maximum width */
  maxWidth?: number;
  /** Center horizontally */
  center?: boolean;
  /** Padding */
  padding?: number;
  /** Children */
  children: VNode;
}

/**
 * Container - Constrains content to a maximum width
 *
 * @example
 * ```typescript
 * Container({
 *   maxWidth: 80,
 *   center: true,
 *   padding: 2,
 *   children: Content()
 * })
 * ```
 */
export function Container(props: ContainerProps): VNode {
  const {
    maxWidth = 80,
    center = true,
    padding = 0,
    children,
  } = props;

  const termWidth = process.stdout.columns || 80;
  const actualWidth = Math.min(maxWidth, termWidth);

  if (center && actualWidth < termWidth) {
    const sideMargin = Math.floor((termWidth - actualWidth) / 2);
    return Box(
      { flexDirection: 'row' },
      Box({ width: sideMargin }),
      Box({ width: actualWidth, padding, flexDirection: 'column' }, children),
      Box({ width: termWidth - actualWidth - sideMargin })
    );
  }

  return Box(
    { width: actualWidth, padding, flexDirection: 'column' },
    children
  );
}
