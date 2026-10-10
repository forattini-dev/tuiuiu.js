import type { TextSpan, TextSpanStyle } from './styled-text.js';

export interface InlineMarkdownTheme {
  bold: string;
  italic: string;
  link: string;
  code: string;
}

/**
 * Bounded inline parser for the terminal Markdown subset (not CommonMark).
 * Formatting composes recursively; escapes and code are literal. Keeping this
 * independent of VNodes lets all inline styles share one text layout.
 */
export function parseInlineMarkdown(
  source: string, theme: InlineMarkdownTheme, showLinkUrls = true,
): TextSpan[] {
  const result: TextSpan[] = [];
  let budget = source.length * 16 + 128;
  const append = (text: string, style: TextSpanStyle) => {
    if (text) result.push({ text, style });
  };
  const escaped = (text: string, index: number) => {
    let slashes = 0;
    while (index > 0 && text[--index] === '\\') slashes++;
    return slashes % 2 === 1;
  };
  const balancedEnd = (text: string, start: number, open: string, close: string) => {
    let depth = 1;
    for (let i = start + 1; i < text.length && budget-- > 0; i++) {
      if (text[i] === '\\') { i++; continue; }
      if (text[i] === open) depth++;
      if (text[i] === close && --depth === 0) return i;
    }
    return -1;
  };
  const closingMarker = (text: string, start: number, marker: string) => {
    for (let i = start; i < text.length && budget-- > 0; i++) {
      if (text[i] !== marker[0] || escaped(text, i)) continue;
      let length = 1;
      while (text[i + length] === marker[0]) length++;
      const closeAt = i + length - marker.length;
      const intraword = marker[0] === '_' && /[\p{L}\p{N}]/u.test(text[i + length] ?? '');
      if ((length === marker.length || (length === 3 && marker.length < 3)) &&
        closeAt >= start && !/\s/u.test(text[closeAt - 1] ?? ' ') && !intraword) return closeAt;
      i += length - 1;
    }
    return -1;
  };
  const parse = (text: string, inherited: TextSpanStyle, depth: number): void => {
    if (depth >= 32 || budget <= 0) { append(text, inherited); return; }
    let plain = '';
    const flush = () => { append(plain, inherited); plain = ''; };
    for (let i = 0; i < text.length;) {
      if (budget-- <= 0) { plain += text.slice(i); break; }
      const char = text[i]!;
      if (char === '\\' && /[!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~]/u.test(text[i + 1] ?? '')) {
        plain += text[i + 1]; i += 2; continue;
      }
      if (char === '`') {
        let count = 1;
        while (text[i + count] === '`') count++;
        const marker = '`'.repeat(count);
        let end = text.indexOf(marker, i + count);
        budget -= (end >= 0 ? end : text.length) - i;
        while (end >= 0 && (text[end - 1] === '`' || text[end + count] === '`')) {
          budget -= end - i + count;
          if (budget <= 0) { end = -1; break; }
          end = text.indexOf(marker, end + count);
        }
        if (end >= 0) {
          flush();
          append(` ${text.slice(i + count, end).replaceAll('\n', ' ')} `,
            { ...inherited, color: theme.code, backgroundColor: 'black' });
          i = end + count; continue;
        }
        plain += marker; i += count; continue;
      }
      const image = char === '!' && text[i + 1] === '[';
      if (char === '[' || image) {
        const labelStart = i + (image ? 1 : 0);
        const labelEnd = balancedEnd(text, labelStart, '[', ']');
        const urlEnd = labelEnd >= 0 && text[labelEnd + 1] === '('
          ? balancedEnd(text, labelEnd + 1, '(', ')') : -1;
        if (urlEnd >= 0) {
          flush();
          const label = text.slice(labelStart + 1, labelEnd);
          if (image) {
            append('🖼️ ', { ...inherited, color: 'warning' });
            append(label || 'image', { ...inherited, color: 'mutedForeground' });
          } else {
            parse(label, { ...inherited, color: theme.link, underline: true }, depth + 1);
          }
          if (showLinkUrls) append(` (${text.slice(labelEnd + 2, urlEnd)})`,
            { ...inherited, color: 'mutedForeground', dim: true });
          i = urlEnd + 1; continue;
        }
      }
      if (char === '*' || char === '_' || (char === '~' && text[i + 1] === '~')) {
        let length = 1;
        while (text[i + length] === char) length++;
        const intraword = char === '_' && /[\p{L}\p{N}]/u.test(text[i - 1] ?? '');
        const valid = char === '~' ? length === 2 : length <= 3;
        if (valid && !intraword && !/\s/u.test(text[i + length] ?? ' ')) {
          const marker = char.repeat(length);
          const end = closingMarker(text, i + length, marker);
          if (end > i + length) {
            flush();
            const style = char === '~' ? { strikethrough: true }
              : length === 3 ? { bold: true, italic: true, color: theme.bold }
              : length === 2 ? { bold: true, color: theme.bold }
              : { italic: true, color: theme.italic };
            parse(text.slice(i + length, end), { ...inherited, ...style }, depth + 1);
            i = end + length; continue;
          }
        }
        plain += char.repeat(length); i += length; continue;
      }
      plain += char; i++;
    }
    flush();
  };
  parse(source, {}, 0);
  return result;
}
