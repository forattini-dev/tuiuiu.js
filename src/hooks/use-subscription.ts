/**
 * useSubscription - Connect external event sources to reactive signals
 *
 * Bridges EventEmitters, WebSockets, streams, or any callback-based
 * subscription into the tuiuiu signal system.
 *
 * @example
 * // EventEmitter
 * const price = useSubscription<number>(
 *   (cb) => { ws.on('price', cb); return () => ws.off('price', cb); },
 *   { initialValue: 0 }
 * );
 *
 * // WebSocket
 * const msg = useSubscription<string>((cb) => {
 *   socket.onmessage = (e) => cb(e.data);
 *   return () => { socket.onmessage = null; };
 * });
 */

import { createSignal } from '../primitives/signal.js';
import { allowInternalSignalCreationDuringRender } from '../core/dev-warnings.js';
import {
  getHookState,
  getCurrentHookIndex,
  setHookState,
  getHookStateByIndex,
  registerHookCleanup,
} from './context.js';

export interface UseSubscriptionOptions<T> {
  /** Initial value before first emission */
  initialValue?: T;
  /** Whether the subscription is active (default: true) */
  enabled?: boolean;
}

interface SubscriptionHookData<T> {
  getter: () => T | undefined;
  setter: (value: T | undefined | ((prev: T | undefined) => T | undefined)) => void;
  subscribeFn: (callback: (value: T) => void) => () => void;
  unsubscribe: (() => void) | null;
  enabled: boolean;
  hookIndex: import('./context.js').HookSlotToken;
}

function startSubscription<T>(data: SubscriptionHookData<T>): void {
  if (data.unsubscribe) return; // already subscribed

  data.unsubscribe = data.subscribeFn((value: T) => {
    const current = getHookStateByIndex(data.hookIndex) as SubscriptionHookData<T> | null;
    if (!current) return; // component unmounted
    current.setter(value);
  });
}

function stopSubscription<T>(data: SubscriptionHookData<T>): void {
  if (data.unsubscribe) {
    data.unsubscribe();
    data.unsubscribe = null;
  }
}

/**
 * useSubscription - Connect an external event source to a reactive signal.
 *
 * @param subscribe - Function that takes a callback and returns an unsubscribe function
 * @param options - Configuration options
 * @returns Signal getter that updates when the subscription emits
 */
export function useSubscription<T>(
  subscribe: (callback: (value: T) => void) => () => void,
  options: UseSubscriptionOptions<T> = {}
): () => T | undefined {
  const { enabled = true, initialValue } = options;

  const { value: hookData, isNew } = getHookState<SubscriptionHookData<T> | null>(null);

  if (isNew || hookData === null) {
    const hookIndex = getCurrentHookIndex();
    const [getter, setter] = allowInternalSignalCreationDuringRender(
      () => createSignal<T | undefined>(initialValue)
    );

    const data: SubscriptionHookData<T> = {
      getter,
      setter,
      subscribeFn: subscribe,
      unsubscribe: null,
      enabled,
      hookIndex,
    };

    setHookState(hookIndex, data);
    registerHookCleanup(() => stopSubscription(data), hookIndex);

    if (enabled) {
      startSubscription(data);
    }

    return getter;
  } else {
    // Subsequent render — update subscribe reference
    hookData.subscribeFn = subscribe;

    // Handle enabled state changes
    if (enabled !== hookData.enabled) {
      hookData.enabled = enabled;
      if (enabled) {
        startSubscription(hookData);
      } else {
        stopSubscription(hookData);
      }
    }

    return hookData.getter;
  }
}

/**
 * Cleanup function for unmount
 */
export function cleanupSubscription<T>(hookData: SubscriptionHookData<T>): void {
  stopSubscription(hookData);
}
