import type { VNode } from '../utils/types.js';
import { renderOwnedComponent } from '../hooks/context.js';

export type ComponentKey = string | number;

export interface ComponentKeyProps {
  /** Stable identity within the nearest stateful parent. Required for repeated components. */
  readonly key?: ComponentKey;
}

export interface StatefulComponent<P extends object, TResult = VNode> {
  (props: P & ComponentKeyProps): TResult;
  readonly displayName: string;
}

export interface StatefulComponentWithoutProps<TResult = VNode> {
  (props?: ComponentKeyProps): TResult;
  readonly displayName: string;
}

export type OwnedComponent<TComponent extends (props: any, ...args: any[]) => any> = TComponent & {
  readonly displayName: string;
};

/**
 * Define a hook-owning component.
 *
 * Pure visual functions do not need this wrapper. Components that call hooks
 * use it so state and disposables belong to a keyed owner instead of the root
 * render's positional hook list.
 */
export function component<TResult = VNode>(
  name: string,
  render: () => TResult,
): StatefulComponentWithoutProps<TResult>;
export function component<TComponent extends (props: any, ...args: any[]) => any>(
  name: string,
  render: TComponent,
): OwnedComponent<TComponent>;
export function component<P extends object, TResult = VNode>(
  name: string,
  render: (props: P) => TResult,
): StatefulComponent<P, TResult>;
export function component<P extends object, TResult = VNode>(
  name: string,
  render: (props: P, ...args: any[]) => TResult,
): StatefulComponent<P, TResult> | StatefulComponentWithoutProps<TResult> | OwnedComponent<any> {
  if (!name.trim()) {
    throw new Error('[tuiuiu] component() requires a non-empty display name');
  }

  const definition = {};
  const owned = (input: P & ComponentKeyProps = {} as P & ComponentKeyProps, ...args: unknown[]): TResult => {
    const { key, ...props } = input;
    return renderOwnedComponent(definition, name, key, () => render(props as P, ...args));
  };
  Object.defineProperty(owned, 'displayName', {
    value: name,
    enumerable: true,
  });
  return owned as StatefulComponent<P, TResult>;
}
