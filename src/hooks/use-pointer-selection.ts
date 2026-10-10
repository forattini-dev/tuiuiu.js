import { useConst } from './use-const.js';
import { useEffect } from './use-effect.js';
import { useMouse } from './use-mouse.js';
import { getHitTestRegistry } from '../core/hit-test.js';
import type { MouseEventData, VNode } from '../utils/types.js';

interface PointerSelectionOptions {
  /** Controller identity and geometry changes invalidate an in-flight capture. */
  identity: object;
  geometry: string;
  revision?: unknown;
  isActive?: boolean | (() => boolean);
  /** Relative coordinates use the unclipped node origin. False rejects the press. */
  onStart(event: MouseEventData): boolean;
  onMove(x: number, y: number): void;
}

/** Owner-local text drag capture, shared by editable and read-only views. */
export function usePointerSelection(options: PointerSelectionOptions) {
  const active = () => typeof options.isActive === 'function' ? options.isActive() : options.isActive ?? true;
  const slot = useConst(() => ({
    identity: options.identity, geometry: options.geometry, revision: options.revision,
    node: null as VNode | null, dragging: false, startedHere: false,
  }));
  if (slot.identity !== options.identity || slot.geometry !== options.geometry || slot.revision !== options.revision || !active()) {
    slot.dragging = false;
    slot.startedHere = false;
  }
  slot.identity = options.identity;
  slot.geometry = options.geometry;
  slot.revision = options.revision;
  useEffect(() => () => { slot.dragging = false; slot.node = null; });
  useMouse(event => {
    if (!active()) { slot.dragging = false; return; }
    if (!slot.dragging) return;
    if (event.action === 'click' || event.action === 'double-click') {
      // Hit handlers run before global handlers: a press elsewhere ends capture.
      if (!slot.startedHere) slot.dragging = false;
      slot.startedHere = false;
      return;
    }
    if (event.action !== 'release' && !(event.action === 'drag' && event.button === 'left')) return;
    const bounds = slot.node && getHitTestRegistry().getBounds(slot.node);
    if (!bounds) { slot.dragging = false; return; }
    options.onMove(event.x - (bounds.originX ?? bounds.x), event.y - (bounds.originY ?? bounds.y));
    if (event.action === 'release') slot.dragging = false;
  }, { isActive: active(), enableTracking: true });
  return {
    onMouseDown(event: MouseEventData) {
      if (!active() || event.button !== 'left' || !options.onStart(event)) return;
      slot.dragging = true;
      slot.startedHere = true;
      event.stopPropagation();
    },
    bind(node: VNode): VNode { slot.node = node; return node; },
  };
}
