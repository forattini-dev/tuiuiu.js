import type { CollectionController } from './collection.js';
import {
  createInteractionTarget,
  type InteractionTarget,
} from './target.js';
import type { Disposable, InteractionRuntime } from './runtime.js';

export interface CollectionBindingMap {
  previous?: string | readonly string[];
  next?: string | readonly string[];
  first?: string | readonly string[];
  last?: string | readonly string[];
  pagePrevious?: string | readonly string[];
  pageNext?: string | readonly string[];
  activate?: string | readonly string[];
  toggle?: string | readonly string[];
  cancel?: string | readonly string[];
}

export interface CollectionBindingsOptions<T, K> {
  id: string;
  controller: CollectionController<T, K>;
  runtime?: InteractionRuntime;
  mode?: string;
  exclusive?: boolean;
  bindings?: CollectionBindingMap;
  onActivate?: (item: T | undefined) => void;
  onCancel?: () => void;
}

export interface CollectionBindings extends Disposable {
  readonly target: InteractionTarget;
  focus(): void;
  blur(): void;
}

const DEFAULT_BINDINGS: Required<CollectionBindingMap> = {
  previous: 'arrowup',
  next: 'arrowdown',
  first: 'home',
  last: 'end',
  pagePrevious: 'pageup',
  pageNext: 'pagedown',
  activate: 'enter',
  toggle: 'space',
  cancel: 'escape',
};

/**
 * Give an identity-based collection semantic keyboard ownership. Each instance
 * owns one target and exact command registrations, so unmount order is safe.
 */
export function createCollectionBindings<T, K>(
  options: CollectionBindingsOptions<T, K>,
): CollectionBindings {
  const target = createInteractionTarget({
    id: options.id,
    mode: options.mode ?? 'collection',
    exclusive: options.exclusive,
    runtime: options.runtime,
  });
  const keys = { ...DEFAULT_BINDINGS, ...options.bindings };
  const prefix = `${options.id}.collection`;
  const register = (
    name: string,
    title: string,
    binding: string | readonly string[] | undefined,
    run: () => void,
  ) => {
    if (binding === undefined) return;
    target.command({ id: `${prefix}.${name}`, title, run }, binding);
  };

  register('previous', 'Previous item', keys.previous, () => void options.controller.move(-1));
  register('next', 'Next item', keys.next, () => void options.controller.move(1));
  register('first', 'First item', keys.first, () => void options.controller.first());
  register('last', 'Last item', keys.last, () => void options.controller.last());
  register('page-previous', 'Previous page', keys.pagePrevious, () => void options.controller.page(-1));
  register('page-next', 'Next page', keys.pageNext, () => void options.controller.page(1));
  register('activate', 'Activate item', keys.activate, () => {
    options.onActivate?.(options.controller.activate());
  });
  register('toggle', 'Toggle item', keys.toggle, () => void options.controller.toggle());
  register('cancel', 'Cancel collection interaction', keys.cancel, () => options.onCancel?.());

  return {
    target,
    get disposed() {
      return target.disposed;
    },
    focus: () => target.focus(),
    blur: () => target.blur(),
    dispose: () => target.dispose(),
  };
}
