import { component } from '../app/component.js';
import { TextView, type TextViewProps } from '../atoms/text-view.js';
import { useConst } from '../hooks/use-const.js';
import { useState } from '../hooks/use-state.js';
import { useEffect } from '../hooks/use-effect.js';
import { useClipboard } from '../hooks/use-clipboard.js';
import type { MarkdownSelection } from '../utils/markdown-selection.js';
import type { VNode } from '../utils/types.js';

export { createMarkdownSelection, type MarkdownSelection, type MarkdownSelectionOptions } from '../utils/markdown-selection.js';

export interface MarkdownViewProps extends Omit<TextViewProps, 'selection' | 'spans'> {
  /** Caller owns the controller. Use update() for streamed content and dispose() on teardown. */
  selection: MarkdownSelection;
  copyMode?: 'display' | 'source';
}

/** Bounded selectable Markdown reader. Existing Markdown block rendering is unchanged. */
export const MarkdownView = component<MarkdownViewProps, VNode>('MarkdownView', props => {
  const { selection, copyMode = 'display', ...view } = props;
  if (selection.disposed) throw new Error('MarkdownView requires an active MarkdownSelection');
  if (copyMode !== 'display' && copyMode !== 'source') throw new RangeError('Markdown copy mode must be display or source');
  const [revision, setRevision] = useState(0);
  const clipboard = useClipboard();
  const slot = useConst(() => ({ controller: null as MarkdownSelection | null, unsubscribe: () => {} }));
  useEffect(() => () => { slot.unsubscribe(); });
  if (slot.controller !== selection) {
    slot.unsubscribe();
    slot.controller = selection;
    slot.unsubscribe = selection.subscribe(() => setRevision(value => value + 1));
  }
  revision();
  return TextView({ ...view, selection: selection.selection, spans: selection.snapshot().spans,
    onCopy: props.onCopy || clipboard.supported ? () => (props.onCopy ?? clipboard.copy)(selection.copyText(copyMode)) : undefined });
});
