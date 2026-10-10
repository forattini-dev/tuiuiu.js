import { Text } from './nodes.js';
import type { TextProps, VNode } from '../utils/types.js';
import { normalizeTextSpans, type TextSpan } from '../utils/styled-text.js';

export type { TextSpan, TextSpanStyle } from '../utils/styled-text.js';

/** One text flow with structured styles; no ANSI or separate flexbox children. */
export function RichText(props: TextProps, ...parts: (string | number | TextSpan)[]): VNode {
  const spans = normalizeTextSpans(parts);
  const node = Text(props, spans.map(span => span.text).join(''));
  node.props.__textSpans = spans;
  return node;
}
