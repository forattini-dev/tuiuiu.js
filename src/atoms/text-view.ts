import { component, type ComponentKeyProps } from '../app/component.js';
import { Box } from '../primitives/nodes.js';
import { RichText, type TextSpan, type TextSpanStyle } from '../primitives/rich-text.js';
import { useConst } from '../hooks/use-const.js';
import { useState } from '../hooks/use-state.js';
import { useEffect } from '../hooks/use-effect.js';
import { useMouse } from '../hooks/use-mouse.js';
import { useInput } from '../hooks/use-input.js';
import { useClipboard } from '../hooks/use-clipboard.js';
import { getHitTestRegistry } from '../core/hit-test.js';
import type { TextSelection } from '../interaction/text-selection.js';
import { createTextViewport, type TextViewport, type TextViewportOptions } from '../interaction/text-viewport.js';
import { previousGraphemeBoundary, nextGraphemeBoundary, segmentGraphemes } from '../utils/grapheme.js';
import { stringWidth } from '../utils/text-utils.js';
import type { VNode } from '../utils/types.js';

export interface TextViewProps extends ComponentKeyProps {
  id?: string;
  /** Caller owns the selection and document, including their disposal. */
  selection: TextSelection;
  width: number;
  height: number;
  wrap?: TextViewportOptions['wrap'];
  tabSize?: number;
  style?: TextSpanStyle;
  selectionStyle?: TextSpanStyle;
  /** Controlled visual-row offset; omit for component-owned scrolling. */
  scrollTop?: number;
  onScrollTopChange?: (row: number) => void;
  /** Opt-in keyboard routing; the application chooses which view is active. */
  isActive?: boolean;
  /** Ctrl+Shift+C. Overrides the capability-aware terminal clipboard adapter. */
  onCopy?: (plainText: string) => void;
}

/** Read-only source document view. Selection uses source offsets, never screen strings. */
export const TextView = component<TextViewProps, VNode>('TextView', props => {
  const { selection, width, height, wrap = 'word', tabSize = 4 } = props;
  if (!Number.isSafeInteger(height) || height < 1
    || (props.scrollTop !== undefined && (!Number.isSafeInteger(props.scrollTop) || props.scrollTop < 0))) {
    throw new RangeError('TextView height must be positive and scrollTop non-negative safe integers');
  }
  if (selection.disposed) throw new Error('TextView requires an active TextSelection');
  const [revision, setRevision] = useState(0);
  const [localScroll, setLocalScroll] = useState(0);
  const clipboard = useClipboard();
  const slot = useConst(() => ({
    selection: null as TextSelection | null,
    viewport: null as TextViewport | null,
    node: null as VNode | null,
    unsubscribe: () => {},
    dragging: false,
    startedHere: false,
    goalColumn: null as number | null,
    goalHead: null as number | null,
    width,
    height,
    wrap,
    tabSize,
  }));
  useEffect(() => () => { slot.unsubscribe(); slot.dragging = false; });
  if (slot.selection !== selection) {
    const nextViewport = createTextViewport(selection.document, { width, wrap, tabSize });
    slot.unsubscribe();
    slot.selection = selection;
    slot.viewport = nextViewport;
    slot.unsubscribe = selection.subscribe(() => setRevision(value => value + 1));
    slot.dragging = false;
    slot.goalColumn = null;
  }
  if (slot.width !== width || slot.height !== height || slot.wrap !== wrap || slot.tabSize !== tabSize) {
    slot.dragging = false;
    slot.goalColumn = null;
  }
  Object.assign(slot, { width, height, wrap, tabSize });
  const viewport = slot.viewport!;
  viewport.configure({ width, wrap, tabSize });
  revision();
  const rows = viewport.lines();
  const maxScroll = Math.max(0, rows.length - height);
  const scrollTop = Math.min(props.scrollTop ?? localScroll(), maxScroll);
  if (props.scrollTop === undefined && localScroll() !== scrollTop) setLocalScroll(scrollTop);
  const scrollTo = (row: number) => {
    const next = Math.max(0, Math.min(row, maxScroll));
    if (props.scrollTop === undefined) setLocalScroll(next);
    if (next !== scrollTop) props.onScrollTopChange?.(next);
  };
  const ensureHeadVisible = () => {
    const { row } = viewport.positionAt(selection.snapshot().head);
    if (row < scrollTop) scrollTo(row);
    else if (row >= scrollTop + height) scrollTo(row - height + 1);
  };
  const offsetAt = (row: number, column: number) => viewport.offsetAt(
    Math.max(scrollTop, Math.min(scrollTop + row, Math.min(rows.length - 1, scrollTop + height - 1))),
    column,
  );
  useMouse(event => {
    if (!slot.dragging) return;
    if (event.action === 'click' || event.action === 'double-click') {
      // Hit handlers run first. A press on another element cancels our capture.
      if (!slot.startedHere) slot.dragging = false;
      slot.startedHere = false;
      return;
    }
    if (event.action === 'release' || (event.action === 'drag' && event.button === 'left')) {
      const bounds = slot.node && getHitTestRegistry().getBounds(slot.node);
      if (!bounds) { slot.dragging = false; return; }
      selection.extend(offsetAt(event.y - (bounds.originY ?? bounds.y), event.x - (bounds.originX ?? bounds.x)));
      if (event.action === 'release') slot.dragging = false;
    }
  }, { enableTracking: true });
  useInput((input, key) => {
    if (key.ctrl && key.shift && input.toLowerCase() === 'c') {
      if (selection.snapshot().start === selection.snapshot().end) return false;
      if (!props.onCopy && !clipboard.supported) return false;
      (props.onCopy ?? clipboard.copy)(selection.copyText());
      return true;
    }
    if (key.ctrl && input.toLowerCase() === 'a') { selection.selectAll(); return true; }
    if (key.escape) return selection.clear();
    if (!key.shift) return false;
    const head = selection.snapshot().head;
    if (slot.goalHead !== head) slot.goalColumn = null;
    const value = selection.document.snapshot().value;
    const position = viewport.positionAt(head);
    let next: number;
    if (key.upArrow || key.downArrow) {
      slot.goalColumn ??= position.column;
      next = viewport.offsetAt(position.row + (key.upArrow ? -1 : 1), slot.goalColumn);
    } else {
      slot.goalColumn = null;
      if (key.leftArrow) next = previousGraphemeBoundary(value, head);
      else if (key.rightArrow) next = nextGraphemeBoundary(value, head);
      else if (key.home) next = rows[position.row]!.start;
      else if (key.end) next = rows[position.row]!.end;
      else return false;
    }
    selection.extend(next);
    slot.goalHead = selection.snapshot().head;
    ensureHeadVisible();
    return true;
  }, { isActive: props.isActive ?? false, stopPropagation: true });
  const selected = selection.snapshot();
  const rects = new Map(viewport.rangeRects(selected.start, selected.end, scrollTop, height)
    .map(rect => [rect.row, rect]));
  const selectionStyle = props.selectionStyle ?? { inverse: true };
  const visible = rows.slice(scrollTop, scrollTop + height).map((line, index) => {
    const rect = rects.get(scrollTop + index);
    const spans: TextSpan[] = [];
    let column = 0;
    for (const { segment } of segmentGraphemes(line.displayText)) {
      const selectedCell = rect !== undefined && column >= rect.column && column < rect.column + rect.width;
      const style = selectedCell ? selectionStyle : undefined;
      const previous = spans.at(-1);
      if (previous && previous.style === style) spans[spans.length - 1] = { text: previous.text + segment, style };
      else spans.push({ text: segment, style });
      column += stringWidth(segment);
    }
    return Box({ width: Math.max(width, line.width), height: 1, flexShrink: 0, overflow: 'hidden' },
      RichText(props.style ?? {}, ...spans));
  });
  const node = Box({ id: props.id, width, height, flexShrink: 0, overflow: 'hidden',
    role: 'document', 'aria-readonly': true,
    onMouseDown(event) {
      if (event.button !== 'left') return;
      const offset = offsetAt(event.y, event.x);
      if (event.modifiers.shift) selection.extend(offset);
      else selection.set(offset, offset);
      slot.dragging = true;
      slot.startedHere = true;
      slot.goalColumn = null;
      event.stopPropagation();
    },
    onScroll(event) {
      scrollTo(scrollTop + (event.button === 'scroll-up' ? -3 : 3));
      event.stopPropagation();
    },
  }, ...visible);
  slot.node = node;
  return node;
});
