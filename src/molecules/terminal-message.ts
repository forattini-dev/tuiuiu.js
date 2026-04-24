/**
 * TerminalMessage - Role-aware terminal message renderer
 *
 * @layer Molecule
 * @description Agent/chat message renderer with raw streaming text and rich Markdown completion
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode } from '../utils/types.js';
import { Markdown, type MarkdownOptions } from './markdown.js';

export type TerminalMessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface TerminalMessageRoleStyle {
  /** Label shown in the message header */
  label?: string;
  /** Marker shown before the role label */
  marker?: string;
  /** Role color */
  color?: string;
  /** Dim the role header and gutter */
  dim?: boolean;
}

export interface TerminalMessageOptions extends MarkdownOptions {
  /** Message role */
  role?: TerminalMessageRole;
  /** Message content */
  content: string;
  /** Render content as raw text while it is still streaming */
  streaming?: boolean;
  /** Show the role header and gutter */
  showRole?: boolean;
  /** Override the role label for this message */
  label?: string;
  /** Override the role marker for this message */
  marker?: string;
  /** Override the role color for this message */
  color?: string;
  /** Role style overrides */
  roleStyles?: Partial<Record<TerminalMessageRole, TerminalMessageRoleStyle>>;
  /** Color used for raw streaming text */
  rawTextColor?: string;
}

const DEFAULT_ROLE_STYLES: Record<TerminalMessageRole, Required<TerminalMessageRoleStyle>> = {
  user: {
    label: 'user',
    marker: '>',
    color: 'primary',
    dim: false,
  },
  assistant: {
    label: 'assistant',
    marker: '<',
    color: 'accent',
    dim: false,
  },
  system: {
    label: 'system',
    marker: '!',
    color: 'warning',
    dim: false,
  },
  tool: {
    label: 'tool',
    marker: '$',
    color: 'mutedForeground',
    dim: true,
  },
};

function resolveRoleStyle(options: TerminalMessageOptions): Required<TerminalMessageRoleStyle> {
  const role = options.role ?? 'assistant';
  const base = DEFAULT_ROLE_STYLES[role];
  const override = options.roleStyles?.[role] ?? {};

  return {
    label: options.label ?? override.label ?? base.label,
    marker: options.marker ?? override.marker ?? base.marker,
    color: options.color ?? override.color ?? base.color,
    dim: override.dim ?? base.dim,
  };
}

function RawMessageContent(options: { content: string; color?: string }): VNode {
  const lines = options.content.split('\n');

  return Box(
    { flexDirection: 'column', width: '100%' },
    ...lines.map((line) => Text({ color: options.color }, line))
  );
}

/**
 * TerminalMessage - Render a terminal-first chat or agent message.
 *
 * Completed messages render through Markdown so fenced code uses CodeBlock.
 * Streaming messages render as raw text to avoid flickering partial code fences.
 *
 * @example
 * TerminalMessage({
 *   role: 'assistant',
 *   content: '```ts\nconst answer = 42;\n```',
 * })
 */
export function TerminalMessage(options: TerminalMessageOptions): VNode {
  const {
    content,
    streaming = false,
    showRole = true,
    maxWidth,
    theme,
    codeLineNumbers,
    codeBlock,
    indentSize,
  } = options;

  const roleStyle = resolveRoleStyle(options);
  const headerText = roleStyle.marker
    ? `${roleStyle.marker} ${roleStyle.label}`
    : roleStyle.label;
  const body = streaming
    ? RawMessageContent({ content, color: options.rawTextColor })
    : Markdown({
      content,
      maxWidth,
      theme,
      codeLineNumbers,
      codeBlock,
      indentSize,
    });

  return Box(
    {
      flexDirection: 'column',
      width: maxWidth ?? '100%',
    },
    showRole
      ? Box(
        { flexDirection: 'row', marginBottom: content ? 1 : 0 },
        Text({ color: roleStyle.color, bold: true, dim: roleStyle.dim }, headerText),
        streaming ? Text({ color: 'mutedForeground', dim: true }, ' streaming') : null
      )
      : null,
    Box(
      { flexDirection: 'row', width: '100%' },
      showRole ? Text({ color: roleStyle.color, dim: true }, '  ') : null,
      body
    )
  );
}
