/**
 * Reck Components - Box, Text, Spacer, etc.
 *
 * Factory functions that create VNodes
 * No JSX needed - just function calls
 */

import type { VNode, BoxProps, TextProps, SpacerProps, NewlineProps, ReckNode, ReckChild, BoxStyle } from '../utils/types.js';

/**
 * Normalize children into VNode array
 */
function normalizeChildren(children: ReckNode): VNode[] {
  if (children === null || children === undefined || children === false || children === true) {
    return [];
  }

  if (Array.isArray(children)) {
    return children.flatMap(normalizeChildren);
  }

  if (typeof children === 'string' || typeof children === 'number') {
    return [Text({ children: String(children) })];
  }

  return [children as VNode];
}

/**
 * Box - Container with flexbox layout
 *
 * @example
 * Box({ flexDirection: 'row', padding: 1 },
 *   Text({ color: 'cyan' }, 'Hello'),
 *   Text({ color: 'green' }, 'World')
 * )
 */
export function Box(props: BoxProps, ...children: ReckChild[]): VNode {
  return {
    type: 'box',
    props: { ...props },
    children: normalizeChildren(children.length > 0 ? children : props.children),
  };
}

/**
 * Text - Styled text content
 *
 * @example
 * Text({ color: 'red', bold: true }, 'Error!')
 */
export function Text(props: TextProps, ...children: (string | number)[]): VNode {
  const content = children.length > 0
    ? children.join('')
    : Array.isArray(props.children)
      ? props.children.join('')
      : String(props.children ?? '');

  return {
    type: 'text',
    props: { ...props, children: content },
    children: [],
  };
}

/**
 * Spacer - Flexible space that expands
 *
 * @example
 * Box({ flexDirection: 'row' },
 *   Text({}, 'Left'),
 *   Spacer(),
 *   Text({}, 'Right')
 * )
 */
export function Spacer(props: SpacerProps = {}): VNode {
  return {
    type: 'spacer',
    props: { flexGrow: 1, ...props },
    children: [],
  };
}

/**
 * Newline - Insert blank lines
 *
 * @example
 * Newline({ count: 2 })
 */
export function Newline(props: NewlineProps = {}): VNode {
  return {
    type: 'newline',
    props: { count: props.count ?? 1 },
    children: [],
  };
}

/**
 * Fragment - Group children without wrapper
 *
 * @example
 * Fragment(
 *   Text({}, 'Line 1'),
 *   Text({}, 'Line 2')
 * )
 */
export function Fragment(...children: ReckChild[]): VNode {
  return {
    type: 'fragment',
    props: {},
    children: normalizeChildren(children),
  };
}

/**
 * Conditional rendering helper
 *
 * @example
 * When(isLoading,
 *   Text({}, 'Loading...')
 * )
 */
export function When(condition: boolean, ...children: ReckChild[]): VNode | null {
  if (!condition) return null as any;
  return Fragment(...children);
}

/**
 * Map helper for rendering lists
 *
 * @example
 * Each(items, (item, i) =>
 *   Text({ key: i }, item.name)
 * )
 */
export function Each<T>(items: T[], render: (item: T, index: number) => VNode): VNode {
  return Fragment(...items.map(render));
}

/**
 * Transform - Apply a transformation function to rendered text output
 *
 * Useful for:
 * - Gradient effects
 * - Text animations
 * - Custom styling
 *
 * @example
 * Transform({
 *   transform: (text, index) => text.toUpperCase()
 * },
 *   Text({}, 'hello world')
 * )
 */
export interface TransformProps extends BoxStyle {
  /** Function to transform rendered text */
  transform: (text: string, lineIndex: number) => string;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  children?: ReckNode;
}

export function Transform(props: TransformProps, ...children: ReckChild[]): VNode {
  const { transform, accessibilityLabel, ...boxProps } = props;
  return {
    type: 'box',
    props: {
      ...boxProps,
      __transform: transform,
      __accessibilityLabel: accessibilityLabel,
    },
    children: normalizeChildren(children.length > 0 ? children : props.children),
  };
}

/**
 * Static - Permanently render items above dynamic content
 *
 * Items rendered here stay fixed at the top and don't get re-rendered.
 * Useful for:
 * - Completed task lists
 * - Log messages
 * - Progress history
 *
 * @example
 * Static({
 *   items: completedTasks,
 *   children: (task, i) => Text({ key: i, color: 'green' }, `✓ ${task.name}`)
 * })
 */
export interface StaticProps<T> {
  /** Array of items to render */
  items: T[];
  /** Render function for each item */
  children: (item: T, index: number) => VNode;
  /** Optional styles for the container */
  style?: BoxStyle;
}

export function Static<T>(props: StaticProps<T>): VNode {
  const { items, children: render, style = {} } = props;

  const renderedItems = items.map((item, index) => render(item, index));

  return {
    type: 'box',
    props: {
      ...style,
      position: 'absolute',
      flexDirection: 'column',
      __static: true,
    },
    children: renderedItems,
  };
}

// Re-export Divider from primitives (canonical implementation)
export { Divider, type DividerProps } from '../design-system/primitives/divider.js';

/**
 * Spinner - Loading indicator with animation frames
 *
 * Note: Requires external animation loop to update frame
 *
 * @example
 * const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
 * const [frame, setFrame] = createSignal(0);
 *
 * useEffect(() => {
 *   const id = setInterval(() => setFrame(f => (f + 1) % frames.length), 80);
 *   return () => clearInterval(id);
 * });
 *
 * Spinner({ frames, frame: frame(), color: 'cyan' })
 */
export interface SpinnerProps {
  /** Animation frames */
  frames?: string[];
  /** Current frame index */
  frame?: number;
  /** Spinner color */
  color?: string;
}

export function Spinner(props: SpinnerProps = {}): VNode {
  const {
    frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    frame = 0,
    color = 'cyan',
  } = props;

  return Text({ color }, frames[frame % frames.length]);
}

/** Common spinner frame sets */
export const SPINNER_FRAMES = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  line: ['-', '\\', '|', '/'],
  arc: ['◜', '◠', '◝', '◞', '◡', '◟'],
  circle: ['◐', '◓', '◑', '◒'],
  square: ['◰', '◳', '◲', '◱'],
  arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
  bounce: ['⠁', '⠂', '⠄', '⡀', '⢀', '⠠', '⠐', '⠈'],
  clock: ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'],
};

/**
 * ProgressBar - Visual progress indicator
 *
 * @example
 * ProgressBar({ percent: 0.75, width: 30, color: 'green' })
 * // [████████████████████████░░░░░░] 75%
 */
export interface ProgressBarProps {
  /** Progress value between 0 and 1 */
  percent: number;
  /** Width of the bar in characters */
  width?: number;
  /** Color of the filled portion */
  color?: string;
  /** Color of the unfilled portion */
  backgroundColor?: string;
  /** Character for filled portion */
  filledChar?: string;
  /** Character for unfilled portion */
  unfilledChar?: string;
  /** Show percentage text */
  showPercent?: boolean;
  /** Show the bar borders */
  showBorders?: boolean;
}

export function ProgressBar(props: ProgressBarProps): VNode {
  const {
    percent,
    width = 20,
    color = 'green',
    backgroundColor = 'gray',
    filledChar = '█',
    unfilledChar = '░',
    showPercent = true,
    showBorders = true,
  } = props;

  const clampedPercent = Math.max(0, Math.min(1, percent));
  const filled = Math.round(width * clampedPercent);
  const unfilled = width - filled;

  const bar = filledChar.repeat(filled) + unfilledChar.repeat(unfilled);
  const percentText = showPercent ? ` ${Math.round(clampedPercent * 100)}%` : '';

  if (showBorders) {
    return Box({ flexDirection: 'row' },
      Text({ dim: true }, '['),
      Text({ color }, filledChar.repeat(filled)),
      Text({ color: backgroundColor, dim: true }, unfilledChar.repeat(unfilled)),
      Text({ dim: true }, ']'),
      showPercent ? Text({ dim: true }, percentText) : null as any
    );
  }

  return Box({ flexDirection: 'row' },
    Text({ color }, filledChar.repeat(filled)),
    Text({ color: backgroundColor, dim: true }, unfilledChar.repeat(unfilled)),
    showPercent ? Text({ dim: true }, percentText) : null as any
  );
}

/**
 * Badge - Small status indicator with label
 *
 * @example
 * Badge({ label: 'SUCCESS', color: 'green' })
 * Badge({ label: 'ERROR', color: 'red', inverse: true })
 */
export interface BadgeProps {
  /** Badge label text */
  label: string;
  /** Badge color */
  color?: string;
  /** Inverse colors (background becomes foreground) */
  inverse?: boolean;
}

export function Badge(props: BadgeProps): VNode {
  const { label, color = 'blue', inverse = false } = props;

  return Text({ color, inverse, bold: true }, ` ${label} `);
}

/**
 * Markdown - Render markdown text with terminal styling
 *
 * Supports:
 * - Headers (# ## ###)
 * - Bold (**text**)
 * - Italic (*text* or _text_)
 * - Code (`code`) and code blocks (```)
 * - Lists (- item, * item, 1. item)
 * - Blockquotes (> text)
 * - Links [text](url)
 *
 * @example
 * Markdown({ children: '# Hello\n\nThis is **bold** and *italic*' })
 */
export interface MarkdownProps {
  children: string;
  /** Theme colors (optional) */
  theme?: {
    heading?: string;
    bold?: string;
    italic?: string;
    code?: string;
    codeBlock?: string;
    link?: string;
    blockquote?: string;
    list?: string;
  };
}

export function Markdown(props: MarkdownProps): VNode {
  const theme = {
    heading: 'cyan',
    bold: 'white',
    italic: 'gray',
    code: 'yellow',
    codeBlock: 'gray',
    link: 'blue',
    blockquote: 'gray',
    list: 'white',
    ...props.theme,
  };

  const lines = props.children.split('\n');
  const result: VNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';

  for (const line of lines) {
    // Handle code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        result.push(
          Box({ borderStyle: 'round', borderColor: theme.codeBlock, padding: 1 },
            Text({ color: theme.codeBlock, dim: true }, codeBlockContent.join('\n'))
          )
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start code block
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = parseInline(headerMatch[2], theme);
      result.push(
        Text({
          color: theme.heading,
          bold: level <= 2,
          underline: level === 1,
        }, level <= 2 ? text.toUpperCase() : text)
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      result.push(
        Box({ paddingLeft: 2 },
          Text({ color: theme.blockquote, italic: true }, '│ ' + parseInline(line.slice(2), theme))
        )
      );
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
    if (ulMatch) {
      const indent = ulMatch[1].length;
      result.push(
        Box({ paddingLeft: indent },
          Text({ color: theme.list }, '• ' + parseInline(ulMatch[2], theme))
        )
      );
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (olMatch) {
      const indent = olMatch[1].length;
      const num = olMatch[2];
      result.push(
        Box({ paddingLeft: indent },
          Text({ color: theme.list }, `${num}. ` + parseInline(olMatch[3], theme))
        )
      );
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      result.push(Text({ dim: true }, '─'.repeat(40)));
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      result.push(Newline());
      continue;
    }

    // Normal paragraph
    result.push(Text({}, parseInline(line, theme)));
  }

  return Fragment(...result);
}

/**
 * Parse inline markdown elements (bold, italic, code, links)
 */
function parseInline(text: string, theme: Record<string, string>): string {
  // Note: This returns styled ANSI text
  // In a full implementation, we'd return VNodes for proper styling
  // For now, we just return the text with ANSI codes

  // Code (must be before bold/italic to not conflict with *)
  text = text.replace(/`([^`]+)`/g, (_, code) => `\x1b[33m${code}\x1b[0m`);

  // Bold
  text = text.replace(/\*\*([^*]+)\*\*/g, (_, bold) => `\x1b[1m${bold}\x1b[22m`);
  text = text.replace(/__([^_]+)__/g, (_, bold) => `\x1b[1m${bold}\x1b[22m`);

  // Italic
  text = text.replace(/\*([^*]+)\*/g, (_, italic) => `\x1b[3m${italic}\x1b[23m`);
  text = text.replace(/_([^_]+)_/g, (_, italic) => `\x1b[3m${italic}\x1b[23m`);

  // Strikethrough
  text = text.replace(/~~([^~]+)~~/g, (_, strike) => `\x1b[9m${strike}\x1b[29m`);

  // Links [text](url) - show text in blue with URL in dim
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) =>
    `\x1b[34m${linkText}\x1b[0m \x1b[2m(${url})\x1b[22m`
  );

  return text;
}

/**
 * Slot - Reserved layout space for content that may appear/disappear
 *
 * The Slot pattern prevents layout shifts by always reserving space,
 * even when content is hidden. This is crucial for stable UX.
 *
 * @example
 * // Job output area - always reserves 5 lines even when no output
 * Slot({ visible: hasOutput, height: 5 },
 *   Text({}, output)
 * )
 *
 * // Conditionally show input, but never shift layout
 * Slot({ visible: showInput, minHeight: 1 },
 *   TextInput({ value: input, onChange: setInput })
 * )
 */
export interface SlotProps {
  /** Whether content is visible */
  visible: boolean;
  /** Fixed height when hidden (in lines) */
  height?: number;
  /** Minimum height (used when visible too) */
  minHeight?: number;
  /** Flex grow factor */
  flexGrow?: number;
  /** Fixed width */
  width?: number;
}

export function Slot(props: SlotProps, ...children: ReckChild[]): VNode {
  const { visible, height = 0, minHeight, flexGrow, width } = props;

  if (visible) {
    // When visible, render children with optional minHeight
    return Box(
      { flexDirection: 'column', minHeight: minHeight ?? height, flexGrow, width },
      ...children
    );
  }

  // When hidden, still reserve the space
  if (height === 0 && !minHeight) {
    return Box({ height: 0 });
  }

  return Box({ height: minHeight ?? height, flexGrow, width });
}

// Re-export types for convenience
export type { BoxProps, TextProps, SpacerProps, NewlineProps, VNode, ReckNode };
