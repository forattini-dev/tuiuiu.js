import { isRenderingHooks } from './context.js';
import { useConst } from './use-const.js';

type UpdatableFactoryState<TOptions> = {
  updateOptions?: (options: TOptions) => void;
};

/** Internal capability query for components with optional render lifecycles. */
export function hasComponentRenderLifecycle(): boolean {
  return isRenderingHooks();
}

/**
 * Reuses a factory-backed controller across parent rerenders when hooks are
 * active, while still preserving standalone `createX()` behavior outside the
 * render cycle.
 */
export function useFactoryState<TOptions, TState extends UpdatableFactoryState<TOptions>>(
  externalState: TState | undefined,
  options: TOptions,
  createState: (options: TOptions) => TState
): TState {
  if (externalState) {
    externalState.updateOptions?.(options);
    return externalState;
  }

  if (hasComponentRenderLifecycle()) {
    const state = useConst(() => createState(options));
    state.updateOptions?.(options);
    return state;
  }

  return createState(options);
}
