/**
 * KeyboardShortcutHint - Display keyboard shortcuts with platform awareness
 *
 * @layer Atom
 * @description Renders formatted keyboard shortcut hints (e.g., "⌘S to save")
 *
 * Features:
 * - Platform-aware formatting (⌘ on macOS, Ctrl elsewhere)
 * - Optional parentheses wrapping
 * - Bold shortcut key
 * - Dim styling for secondary affordance
 * - HintBar for multiple hints with middot separators
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { formatHotkeyPlatform } from '../hooks/use-hotkeys.js';
import { getTheme } from '../core/theme.js';

export interface KeyboardShortcutHintProps {
  /** Hotkey string (e.g., 'ctrl+s', 'cmd+z', 'escape') */
  shortcut: string;
  /** Action description (e.g., 'save', 'undo') */
  action?: string;
  /** Wrap in parentheses */
  parens?: boolean;
  /** Bold the shortcut portion */
  bold?: boolean;
  /** Dim the entire hint */
  dim?: boolean;
  /** Separator between shortcut and action (default: ' to ') */
  separator?: string;
  /** Text color */
  color?: ColorValue;
}

/**
 * Renders a single keyboard shortcut hint.
 *
 * @example
 * KeyboardShortcutHint({ shortcut: 'ctrl+s', action: 'save' })
 * // → "ctrl+s to save" (Linux/Win) or "⌘S to save" (macOS)
 *
 * KeyboardShortcutHint({ shortcut: 'escape', action: 'close', parens: true })
 * // → "(esc to close)"
 */
export function KeyboardShortcutHint(props: KeyboardShortcutHintProps): VNode {
  const {
    shortcut,
    action,
    parens = false,
    bold = false,
    dim = true,
    separator = ' to ',
    color,
  } = props;

  const theme = getTheme();
  const textColor = color ?? theme.foreground?.muted ?? 'gray';
  const formatted = formatHotkeyPlatform(shortcut);

  let content: string;
  if (action) {
    content = `${formatted}${separator}${action}`;
  } else {
    content = formatted;
  }

  if (parens) {
    content = `(${content})`;
  }

  if (bold) {
    // Split so we can bold just the shortcut part
    const formattedKey = parens ? `(${formatted}` : formatted;
    const rest = action ? `${separator}${action}${parens ? ')' : ''}` : (parens ? ')' : '');

    return Box(
      { flexDirection: 'row' },
      Text({ color: textColor, dim, bold: true }, formattedKey),
      Text({ color: textColor, dim }, rest),
    );
  }

  return Text({ color: textColor, dim }, content);
}

export interface HintBarProps {
  /** Array of shortcut hints to display */
  hints: KeyboardShortcutHintProps[];
  /** Separator between hints (default: ' · ') */
  separator?: string;
  /** Color for separators */
  separatorColor?: ColorValue;
  /** Dim separators */
  separatorDim?: boolean;
}

/**
 * Renders multiple keyboard shortcut hints separated by middots.
 *
 * @example
 * HintBar({
 *   hints: [
 *     { shortcut: 'enter', action: 'select' },
 *     { shortcut: 'escape', action: 'cancel' },
 *     { shortcut: 'ctrl+a', action: 'select all' },
 *   ]
 * })
 * // → "enter to select · esc to cancel · ⌃A to select all"
 */
export function HintBar(props: HintBarProps): VNode {
  const {
    hints,
    separator = ' \u00B7 ',
    separatorColor,
    separatorDim = true,
  } = props;

  const theme = getTheme();
  const sepColor = separatorColor ?? theme.foreground?.muted ?? 'gray';

  const children: VNode[] = [];
  for (let i = 0; i < hints.length; i++) {
    children.push(KeyboardShortcutHint(hints[i]!));
    if (i < hints.length - 1) {
      children.push(Text({ color: sepColor, dim: separatorDim }, separator));
    }
  }

  return Box({ flexDirection: 'row' }, ...children);
}
