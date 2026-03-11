import { isRenderingHooks } from './context.js';
import { useConst } from './use-const.js';

type UpdatableFactoryState<TOptions> = {
  updateOptions?: (options: TOptions) => void;
};

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

  if (isRenderingHooks()) {
    const state = useConst(() => createState(options));
    state.updateOptions?.(options);
    return state;
  }

  return createState(options);
}
