/**
 * Signal-Transparent Resolution Utilities
 *
 * @description Helpers for components that accept both static values and signals
 *
 * This enables the "signal-transparent" pattern where props can be:
 * - Static: `status: 'success'`
 * - Reactive: `status: () => isOk() ? 'success' : 'error'`
 *
 * Components use resolve() internally so developers don't need to think about it.
 */

/**
 * Type for values that can be static or reactive (signal/getter)
 */
export type MaybeReactive<T> = T | (() => T);

/**
 * Resolve a potentially reactive value to its current value
 *
 * @example
 * ```typescript
 * // Both work identically:
 * resolve('success')           // 'success'
 * resolve(() => 'success')     // 'success'
 *
 * // With signals:
 * const [status, setStatus] = createSignal('pending')
 * resolve(status)              // 'pending' (calls the signal)
 * ```
 */
export function resolve<T>(value: MaybeReactive<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value;
}

/**
 * Check if a value is reactive (function)
 */
export function isReactive<T>(value: MaybeReactive<T>): value is () => T {
  return typeof value === 'function';
}

/**
 * Resolve multiple values at once
 *
 * @example
 * ```typescript
 * const [status, label] = resolveAll([statusSignal, 'Static Label'])
 * ```
 */
export function resolveAll<T extends readonly MaybeReactive<unknown>[]>(
  values: T
): { [K in keyof T]: T[K] extends MaybeReactive<infer U> ? U : never } {
  return values.map(resolve) as { [K in keyof T]: T[K] extends MaybeReactive<infer U> ? U : never };
}

/**
 * Create a resolver function for a specific type
 *
 * @example
 * ```typescript
 * const resolveStatus = createResolver<StatusType>()
 * const status = resolveStatus(props.status)
 * ```
 */
export function createResolver<T>(): (value: MaybeReactive<T>) => T {
  return resolve;
}

/**
 * Resolve an object of potentially reactive values
 *
 * @example
 * ```typescript
 * const props = resolveProps({
 *   status: () => 'success',
 *   label: 'Connected',
 *   count: countSignal,
 * })
 * // props = { status: 'success', label: 'Connected', count: 5 }
 * ```
 */
export function resolveProps<T extends Record<string, MaybeReactive<unknown>>>(
  props: T
): { [K in keyof T]: T[K] extends MaybeReactive<infer U> ? U : never } {
  const result: Record<string, unknown> = {};
  for (const key in props) {
    if (Object.prototype.hasOwnProperty.call(props, key)) {
      result[key] = resolve(props[key]);
    }
  }
  return result as { [K in keyof T]: T[K] extends MaybeReactive<infer U> ? U : never };
}
