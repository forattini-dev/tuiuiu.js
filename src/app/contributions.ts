import { component, type StatefulComponent } from './component.js';
import type { VNode } from '../utils/types.js';

export type SlotMap = Record<string, unknown>;

export interface SlotDefinition<TSlots extends SlotMap> {
  readonly __slots?: TSlots;
}

export interface ContributionSpec<
  TSlots extends SlotMap,
  TName extends keyof TSlots = keyof TSlots,
> {
  id: string;
  slot: TName;
  order?: number;
  when?: (context: TSlots[TName]) => boolean;
  render: (context: TSlots[TName]) => VNode | null;
}

export interface ContributionHandle<
  TSlots extends SlotMap,
  TName extends keyof TSlots = keyof TSlots,
> {
  readonly disposed: boolean;
  update(spec: ContributionSpec<TSlots, TName>): void;
  dispose(): void;
}

export interface ContributionHost<TSlots extends SlotMap> {
  register<TName extends keyof TSlots>(
    spec: ContributionSpec<TSlots, TName>,
  ): ContributionHandle<TSlots, TName>;
  render<TName extends keyof TSlots>(slot: TName, context: TSlots[TName]): VNode[];
  subscribe(listener: () => void): () => void;
  dispose(): void;
}

interface StoredContribution<TSlots extends SlotMap> {
  spec: ContributionSpec<TSlots>;
  sequence: number;
  ownedRender: StatefulComponent<{ context: unknown }, VNode | null>;
}

export interface ContributionHostOptions {
  onError?: (error: unknown, contributionId: string) => void;
}

/** Type-only declaration of the slots an application accepts. */
export function defineSlots<TSlots extends SlotMap>(): SlotDefinition<TSlots> {
  return Object.freeze({}) as SlotDefinition<TSlots>;
}

export function createContributionHost<TSlots extends SlotMap>(
  options: ContributionHostOptions = {},
): ContributionHost<TSlots> {
  const entries = new Map<string, StoredContribution<TSlots>>();
  const listeners = new Set<() => void>();
  let sequence = 0;
  let disposed = false;

  const registrationKey = (slot: keyof TSlots, id: string) => `${String(slot)}\u0000${id}`;
  const notify = () => {
    for (const listener of [...listeners]) listener();
  };
  const requireId = (id: string): string => {
    const normalized = id.trim();
    if (!normalized) throw new TypeError('Contribution id must be a non-empty string');
    return normalized;
  };

  const host: ContributionHost<TSlots> = {
    register<TName extends keyof TSlots>(input: ContributionSpec<TSlots, TName>) {
      if (disposed) throw new Error('ContributionHost has been disposed');
      const id = requireId(input.id);
      const key = registrationKey(input.slot, id);
      if (entries.has(key)) {
        throw new Error(`Contribution already registered: ${String(input.slot)}/${id}`);
      }

      let current = { ...input, id } as unknown as ContributionSpec<TSlots>;
      const entry: StoredContribution<TSlots> = {
        spec: current,
        sequence: sequence++,
        ownedRender: component<{ context: unknown }, VNode | null>(
          `Contribution(${String(input.slot)}/${id})`,
          ({ context }) => {
          try {
            return current.render(context as never);
          } catch (error) {
            options.onError?.(error, id);
            return null;
          }
          },
        ),
      };
      entries.set(key, entry);
      notify();
      let registrationDisposed = false;

      return {
        get disposed() {
          return registrationDisposed;
        },
        update(next: ContributionSpec<TSlots, TName>) {
          if (registrationDisposed) throw new Error('Contribution registration has been disposed');
          const nextId = requireId(next.id);
          if (nextId !== id || next.slot !== input.slot) {
            throw new Error('Contribution id and slot cannot change during registration');
          }
          current = { ...next, id } as unknown as ContributionSpec<TSlots>;
          entry.spec = current;
          notify();
        },
        dispose() {
          if (registrationDisposed) return;
          registrationDisposed = true;
          entries.delete(key);
          notify();
        },
      };
    },
    render(slot, context) {
      if (disposed) return [];
      return [...entries.values()]
        .filter((entry) => entry.spec.slot === slot)
        .filter((entry) => entry.spec.when?.(context as never) ?? true)
        .sort((left, right) => (left.spec.order ?? 0) - (right.spec.order ?? 0)
          || left.sequence - right.sequence)
        .flatMap((entry) => {
          const node = entry.ownedRender({
            key: entry.spec.id,
            context,
          });
          return node ? [node] : [];
        });
    },
    subscribe(listener) {
      if (disposed) throw new Error('ContributionHost has been disposed');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      entries.clear();
      listeners.clear();
    },
  };
  return host;
}

export interface AppSlotProps<
  TSlots extends SlotMap,
  TName extends keyof TSlots,
> {
  host: ContributionHost<TSlots>;
  name: TName;
  context: TSlots[TName];
  fallback?: VNode | null;
}

/** Render the contributions registered for one typed application slot. */
export function AppSlot<
  TSlots extends SlotMap,
  TName extends keyof TSlots,
>(props: AppSlotProps<TSlots, TName>): VNode[] {
  const contributions = props.host.render(props.name, props.context);
  return contributions.length > 0
    ? contributions
    : props.fallback
      ? [props.fallback]
      : [];
}
