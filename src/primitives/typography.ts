/**
 * Typography presets
 */

import type { TextStyle, VNode } from '../utils/types.js';
import { Text } from './nodes.js';

export type TypographyText = string | number;

export function Title(text: TypographyText, props: TextStyle = {}): VNode {
  return Text({ color: 'primary', bold: true, ...props }, text);
}

export function Subtitle(text: TypographyText, props: TextStyle = {}): VNode {
  return Text({ color: 'secondary', ...props }, text);
}

export function Caption(text: TypographyText, props: TextStyle = {}): VNode {
  return Text({ color: 'mutedForeground', dim: true, ...props }, text);
}

export function Label(text: TypographyText, props: TextStyle = {}): VNode {
  return Text({ color: 'foreground', ...props }, text);
}
