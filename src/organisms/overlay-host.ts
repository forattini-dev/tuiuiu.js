import { Box } from '../primitives/nodes.js';
import type { OverlayHost, OverlaySnapshotEntry } from '../interaction/overlay.js';
import type { ColorValue, VNode } from '../utils/types.js';
import { component } from '../app/component.js';

export interface OverlayHostViewProps {
  host: OverlayHost<VNode | null>;
  backdropColor?: ColorValue;
  backdropChar?: string;
  renderBackdrop?: (entry: OverlaySnapshotEntry<VNode | null>) => VNode | null;
}

function placementAlignment(entry: OverlaySnapshotEntry<VNode | null>): {
  alignItems: 'flex-start' | 'center' | 'flex-end';
  justifyContent: 'flex-start' | 'center' | 'flex-end';
} {
  const [vertical, horizontal] = entry.placement.includes('-')
    ? entry.placement.split('-')
    : entry.placement === 'left' || entry.placement === 'right'
      ? ['center', entry.placement]
      : [entry.placement, 'center'];
  return {
    alignItems: horizontal === 'left' ? 'flex-start' : horizontal === 'right' ? 'flex-end' : 'center',
    justifyContent: vertical === 'top' ? 'flex-start' : vertical === 'bottom' ? 'flex-end' : 'center',
  };
}

const OverlayEntryContent = component<{
  entry: OverlaySnapshotEntry<VNode | null>;
}, VNode | null>('OverlayEntryContent', ({ entry }) => (
  typeof entry.content === 'function' ? entry.content() : entry.content
));

const OverlayBackdropContent = component<{
  entry: OverlaySnapshotEntry<VNode | null>;
  render: (entry: OverlaySnapshotEntry<VNode | null>) => VNode | null;
}, VNode | null>('OverlayBackdropContent', ({ entry, render }) => render(entry));

/**
 * VNode Adapter for the renderer-independent OverlayHost.
 * The app render loop installs this automatically; exporting it remains useful
 * for embedded/custom renderers.
 */
export function OverlayHostView(props: OverlayHostViewProps): VNode {
  const snapshot = props.host.snapshot();
  const children: VNode[] = [];

  for (const entry of snapshot.entries) {
    if (entry.hidden) continue;
    if (entry.id === snapshot.backdropId) {
      const customBackdrop = props.renderBackdrop
        ? OverlayBackdropContent({
            key: entry.id,
            entry,
            render: props.renderBackdrop,
          })
        : null;
      children.push(Box(
        {
          key: `${entry.id}:backdrop`,
          position: 'absolute',
          top: 0,
          left: 0,
          width: 'fill',
          height: 'fill',
          backgroundColor: customBackdrop ? undefined : (props.backdropColor ?? 'black'),
          __fillChar: customBackdrop ? undefined : (props.backdropChar ?? ' '),
          onMouseDown: (event) => {
            event.stopPropagation();
            props.host.pointerDownBackdrop(entry.id);
          },
          onMouseUp: (event) => {
            event.stopPropagation();
            props.host.pointerUpBackdrop(entry.id);
          },
        },
        ...(customBackdrop ? [customBackdrop] : []),
      ));
    }

    const content = OverlayEntryContent({ key: entry.id, entry });
    if (!content) continue;
    children.push(Box(
      {
        key: `${entry.id}:content`,
        position: 'absolute',
        top: 0,
        left: 0,
        width: 'fill',
        height: 'fill',
        ...placementAlignment(entry),
        padding: entry.margin,
      },
      content,
    ));
  }

  return Box({
    position: 'absolute',
    top: 0,
    left: 0,
    width: 'fill',
    height: 'fill',
  }, ...children);
}
